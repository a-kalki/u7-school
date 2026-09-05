# Система задач — Технические решения по слоям

> v1 (2026-09-04). Детальная (но высокоуровневая) проработка четырёх слоёв перед
> треками этапа B: типизация через метатипы (`TaskKindMeta`/`TaskTypeMeta`),
> механика kind-рендереров и сопоставления задача↔рендерер, оси классификации
> задач. Бизнес-концепция — [tasks-system.md](./tasks-system.md), развилка
> «кто рендерит кнопки» — [tasks-system-architecture.md](./tasks-system-architecture.md),
> сценарии и manual-задачи — [tasks-system-scenarios.md](./tasks-system-scenarios.md).
> Заземлено в живой код: `ArMeta` (`packages/core/src/domain/ar/aggregate.ts`),
> `UcMeta` (`packages/core/src/api/uc/use-case.ts`), `ApiModuleMeta`
> (`packages/core/src/domain/types.ts`), `UiApp.handleCallback`
> (`packages/core/src/ui/bot/ui-app.ts`).

---

## 1. Оси классификации задач

Оси независимы: это не enum-иерархия «типов задач», а измерения, каждое ложится
в отдельное поле/политику сущности. Владелец kind выбирает точку в каждом
измерении — комбинация и есть «тип задачи».

### Ось 1 — происхождение и механизм выполнения

| Значение | Кто выполняет | Как закрывается |
|---|---|---|
| **системная** | флоу доменного модуля | UC владельца по кнопке из контракта / флоу-переход / развилка |
| **пользовательская (manual)** | человек вне системы | assignee жмёт [Выполнено] / автор отменяет |
| **событийно-завершаемая** (перспектива, уровень 4 из scenarios) | человек + система | только событием владельца (напр. `questionnaire.completed`), кнопок нет либо только «инициировать» |

Пользовательские задачи — встроенный kind самого модуля задач
(см. §6, «Крючки расширения»).

### Ось 2 — время жизни

| Значение | Политики |
|---|---|
| **бессрочная** | закрывается только явно (действие/отказ/отмена) |
| **окно жизни** | `expiresAt`; по истечении — авто-close `expired` + событие |
| **продлеваемое окно** | upsert по dedupeKey обновляет `expiresAt` (повтор sweep 7→9 дней — та же задача) |
| **закрываемая внешним фактом** | формально подвид бессрочной: закрывается событием владельца, expire запрещён |

«Переоткрываемость» (после skip — новое рождение по новому поводу) — не время
жизни задачи, а политика памяти отказа в ER владельца.

### Прочие оси (влияют на политики, не на структуру)

- **обязательность** (`mandatory`) — напоминания, доступность стандартного [Пропустить];
- **результат закрытия** (`outcome`: `completed | skipped | expired | cancelled`) — критично: ER владельца реагирует на outcome (память отказа — на `skipped` **и** `expired`);
- **адресат** (`assigneeId` + роль) — студент/ментор; задаёт права на действия.

## 2. Слой 1 — домен `task`: чистые данные + конверт

`Task { id, assigneeId, kind: '<domain>.<name>' (строка, не enum), title,
description?, origin: 'system' | 'manual', authorId?, status, outcome?,
mandatory, dedupeKey? (nullable — manual), ownerInfo, expiresAt?, createdAt/updatedAt }`.

- `ownerInfo` — прозрачный конверт владельца (паттерн `QuestionnaireFacade`),
  внутри агрегата хранится как `Record<string, unknown>`, типизируется
  статически на границах (§3).
- `TaskArMeta implements ArMeta` — стандартный контракт агрегата: `state` (схема
  Task), `events` (`task.completed | task.skipped | task.cancelled` — payload
  `{ kind, ownerInfo, outcome }`).
- Фасад: `upsert / close / getMyTasks` (детали — в scenarios). Тексты
  системных задач НЕ персистятся — рендер на лету (§3); тексты manual-задач
  персистятся (владельца-меты нет).

## 3. Слой 2 — доменное объявление и рендер-контракт

Два разных артефакта, не путать: **`TaskKindMeta` — статический тип-контракт**
(никогда не создаётся в рантайме, как `UcMeta`), **`TaskTypeMeta` — рантайм-реестр
обогащения** (создаётся при сборке, несёт функцию).

### TaskKindMeta — ответ на «нужен ли TaskMeta»: да

По аналогии с `UcMeta` → `CmdMeta` → `ApiModuleMeta`:

```ts
// packages/task/src/domain/types.ts — статический контракт
export interface TaskKindMeta {
  kind: string;        // литерал '<domain>.<name>'
  ownerInfo: unknown;  // тип конверта — конкретизирует владелец
  actions?: string;    // union литералов action.id (для типизации рендереров)
}
```

Домен-владелец объявляет литеральные типы (у себя, task о них не знает):

```ts
// packages/stream/src/domain/task-kinds.ts
export interface InactivityCandidateTaskKind extends TaskKindMeta {
  kind: 'stream.inactivity-candidate';
  ownerInfo: { studentId: string; userId: string; streamId: string };
  actions: 'mark-abandoned' | 'keep-student';
}
export type StreamTaskKinds = InactivityCandidateTaskKind | InactivityWarningTaskKind;
```

Фасад дженерик-сужается union-ом владельца (обратной зависимости нет — task
знает только базовый контракт):

```ts
export interface TaskFacade<Kinds extends TaskKindMeta = TaskKindMeta> {
  upsert<K extends Kinds>(input: TaskUpsertInput<K>): Promise<void>;
  // TaskUpsertInput<K> = { kind: K['kind']; ownerInfo: K['ownerInfo']; ... }
}
// StreamApiModuleResolver: taskFacade: TaskFacade<StreamTaskKinds>
// → stream может создавать только свои kind-ы и только с корректным ownerInfo
```

Что даёт: (а) compile-time контроль `ownerInfo` при upsert — опечатка ловится
там, где её делают, а не в рантайме `resolveRenderInfo`; (б) ER владельца на
`task.skipped` кастит `ownerInfo` к типу своего kind-а (helper по kind-мете);
(в) типизация UI-рендереров (§4). Валидация рантайма: данные из БД приходят
нетипизированными — при необходимости TaskTypeMeta несёт valibot-схему ownerInfo
(как `schema` в агрегатах); деградация — фолбэк на стандартный рендер.

### TaskTypeMeta — рантайм-обогащение (канало-независимое)

```ts
export interface TaskTypeMeta<K extends TaskKindMeta = TaskKindMeta> {
  kind: K['kind'];
  resolveRenderInfo(task: TypedTask<K>): TaskRenderInfo;
}
export interface TaskRenderInfo {
  title: string; description?: string;
  actions: Array<{ id: K['actions']; label: string; style?: 'primary'|'danger'; confirm?: { text: string } }>;
}
```

- Регистрируется доменом-владельцем при сборке api-приложения (в реестр
  task-модуля). Fail-fast на дубликаты kind.
- `GetMyTasksUc` обогащает DTO **на лету** (не персистится — тексты свежие,
  имя студента и дни вычисляются из агрегатов по `ownerInfo`). Нет меты →
  стандартный контракт: текст + [Выполнено]/[Пропустить] по mandatory — здесь
  живёт manual-режим.
- Ответственность слоя: «**что** показать» — состав действий, тексты,
  подтверждения. Про колбеки слой не знает ничего.

## 4. Слой 3 — рендеринг задач (канало-зависимый)

Ответственность слоя: «**как** показать и куда ведёт нажатие» — построение
`callback_data`, клавиатур, делегирование. Живёт в UI-контроллерах.

### Kind-рендерер и реестр

```ts
// контроллер tasks (ui) — реестр рендереров сторонних контроллеров
export interface TaskKindRenderer<K extends TaskKindMeta = TaskKindMeta> {
  kindPrefix: string;  // 'stream.' — один рендерер на все kinds домена
  /** action.id контракта → код кнопки стори-владельца; null → стандартная */
  actionCode(actionId: K['actions'], task: TaskDto): string | null;
}
```

- Каждый контроллер-владелец (streams, questionnaire, …) объявляет свой
  рендерер и передаёт его контроллеру tasks **при сборке UI-приложения**
  (в `create-ui-app.ts`, по образцу передачи контроллеров в `U7BotUiApp`).
  Контроллер tasks о владельцах не знает — только о реестре.
- Рендерер — тонкий маппинг: `actionCode` = `cbFor('<story>', actionId, taskId)`
  (или delegate во флоу). Никакой бизнес-логики.

### Сопоставление задача ↔ рендерер

Публичный контракт — **kind с префиксом домена** (`stream.inactivity-candidate`
→ префикс `stream.`). Резолвер контроллера tasks: `kind.split('.')[0] + '.'` →
`Map<kindPrefix, TaskKindRenderer>`. Правила:

- нет рендерера → дефолтный рендер (стандартные кнопки `cbFor('tasks', 'skip'|'done', id)`);
- `actionCode → null` для конкретного action → этот action не рендерится
  (владелец передумал в UI, но контракт оставил);
- fail-fast при сборке: дубликат kindPrefix; предупреждение «есть TaskTypeMeta
  (api), нет рендерера (ui)» — явная деградация, а не молчание.

### Поток рендера `/tasks`

```
/tasks → GetMyTasksUc → TaskDto[] (+TaskRenderInfo по каждому kind)
→ контроллер tasks: для каждой задачи label/style/confirm — из контракта
  (слоя 2), code — из kind-рендерера (слоя 3) или стандартный
→ нажатие → UiApp.handleCallback → маршрутизация по префиксу контроллера
→ сторя владельца (confirm при style/confirm контракта) → UC владельца → close
```

Связка `action.id ↔ обработчик` — конвенция одного домена: TaskTypeMeta
(api-слой) и TaskKindRenderer (ui-слой) пишутся владельцем одного kind-а;
компилятор сверяет id через `K['actions']` в обоих типах.

## 5. Слой 4 — выполнение и завершение

| Путь закрытия | Кто инициирует | outcome | Механика |
|---|---|---|---|
| действие владельца | кнопка из контракта | `completed` | сторя → UC владельца → `taskFacade.close(dedupeKey)` |
| стандартное действие | assignee ([Пропустить]/[Выполнено]) | `skipped` / `completed` | UC task-модуля → событие → ER владельца |
| истечение окна | expiry-job task-модуля | `expired` | авто-close → событие → ER владельца (память отказа как при skip) |
| отмена автора | author (только manual) | `cancelled` | cancel-uc → `task.cancelled` → notify исполнителю |

Права: skip/done — assignee; cancel — author (manual); close — фасад с
валидацией assignee (открытый вопрос 2 из scenarios). Повтор ситуации → upsert
по dedupeKey — обновление, не дубликат. Закрытие не удаляет — история для метрик.

Касания пользователя (notify о рождении, напоминания, дайджест, окна) —
централизованы в task-модуле, владелец только создаёт задачу.

## 6. Крючки расширения (пользовательские задачи)

> **Пометка на будущее:** сейчас manual-задачи минимальны. Заложено так, чтобы
> расширять без миграций и второго модуля задач.

- **Manual — встроенный kind `task.manual`**: владелец — сам домен task
  (TaskTypeMeta не нужен — стандартный контракт без меты). Поля `origin`,
  `authorId?`, nullable `dedupeKey` — в треке 1, иначе миграция хранилища.
- **Новые «пользовательские» разновидности** (дедлайны, чек-листы, повторяющиеся
  домашние задания): общая механика — полями и политиками домена task;
  доменная специфика — **новым доменом-владельцем kind** (как `session` в
  scenarios §«Фиксация результата», уровень 4), со своей TaskKindMeta/TaskTypeMeta/
  рендерером. Task-модуль не меняется.
- **UI создания manual-задач** — отдельный трек после `task-ui`; UC
  `create-manual`/`cancel` — в треке 1.

## Открытые вопросы

1. Каст `ownerInfo` в ER владельца: хелпер `assertTaskKind(kindMeta, event)` в
   task-модуле или ручной cast + valibot в каждом ER?
2. `expiresAt` для задач-кандидатов на снятие: N дней или «до конца бездействия»
   (влияет на политику продлеваемого окна).
3. Событие `task.expired` отдельно или `task.skipped` с `outcome` внутри?
4. Проверка при сборке «мета есть, рендерера нет»: warning или error?

## Связанные документы

- [tasks-system.md](./tasks-system.md) — бизнес-концепция (pull вместо push).
- [tasks-system-architecture.md](./tasks-system-architecture.md) — развилка, четыре слоя, треки.
- [tasks-system-scenarios.md](./tasks-system-scenarios.md) — сценарии, manual-задачи, решения сессии.
- [domain-boundaries.md](./code_styleguides/domain-boundaries.md) — правила границ.
