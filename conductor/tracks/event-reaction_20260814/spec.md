# Спецификация — Трек A: EventReaction в core

## Обзор

В `@u7-scl/core` добавляется механизм подписки модулей на доменные события — абстрактный класс **`EventReaction`** (сокращение **ER**) и его контракт **`ErMeta`**.

Сейчас шина событий умеет **только публиковать** (через `UseCase.publishEvents`), а метод `EventBus.subscribe()` **нигде не вызывается в проде**. ER даёт модулям декларативный способ **реагировать** на события — по аналогии с тем, как `ApiModule.useCases` декларирует use-case'ы.

Модуль объявляет реакции в поле `reactions`, и они **автоматически подписываются** на нужные события при инициализации модуля.

## Текущее состояние (базовая линия)

- `packages/core/src/domain/events/event-bus.ts` — интерфейс `EventBus`: `publish(event)`, `subscribe(eventName, handler)` (возвращает unsubscribe).
- `packages/core/src/infra/in-proc-event-bus.ts` — `InProcEventBus` (синхронная `Map<eventName, handler[]>`, изоляция ошибок через `console.error`).
- `packages/core/src/domain/events/domain-event.ts` — `DomainEvent` (`eventId`, `eventName`, `occurredAt`, `aggregateName`, `aggregateId`, `payload`). **Остаётся НЕ дженериком** — имя события сужается в конкретных событиях через структурную типизацию (`interface X extends DomainEvent { eventName: '...' }`).
- `packages/core/src/domain/ar/aggregate.ts` — `Aggregate.addEvent/hasEvents/flushEvents`.
- `packages/core/src/api/uc/use-case.ts` — `UseCase` (**образец для ER**): поля `ucName`, `ucLabel`, `arMeta`, `type`, `requiresAuth`, `inputSchema`, `outputSchema`; методы `init`, `getUcName`, `getDocType`, `handle`, `execute`, `publishEvents`.
- `packages/core/src/api/module/api-module.ts` — `ApiModule` (`useCases`, `init`, `execute`, `getDocTypes`).
- `packages/core/src/domain/types.ts` — `ModuleResolver`/`AppResolver` содержат `eventBus`.

## Зафиксированные решения

1. **`DomainEvent` НЕ делаем дженериком.** Конкретное событие само сужает `eventName` литералом, и `ErMeta` ловит его через `TEvent['eventName']`.
2. **ER — отдельный класс по аналогии с `UseCase`**, но минимальный (см. FR2).
3. **`EventBus.subscribe` остаётся без типизации событий** — автоматика подписки в `ApiModule.init()` работает по строковому `eventName`; типизация живёт внутри ER.
4. **Файлы ER:** `*-er.ts` (по аналогии с `*-uc.ts`). Сокращение имени: **ER**.

## FR1 — Контракт `ErMeta`

По аналогии с `UcMeta`, но минимальный (без `type`/`requiresAuth`/`input`/`output`/`errors`/`arMeta`):

```ts
export interface ErMeta<TEvent extends DomainEvent = DomainEvent> {
  /** Уникальное имя реакции (например "record-wish") */
  erName: string;
  /** Тип события, на которое реагирует ER. Имя события захвачено как TEvent['eventName']. */
  event: TEvent;
}
```

Ключевое: `eventName` **не хранится отдельно** — он выводится из `TEvent['eventName']`. Если переименовать `eventName` в событии (`'questionnaire.completed'` → `'questionnaire.finished'`), то `TEvent['eventName']` изменится, и все конкретные ER, объявившие старое имя, **не сойдутся по типам** — tsc/линтер потребует правку по всей цепочке.

Пример конкретной meta (из будущего трека C1):

```ts
export interface RecordWishErMeta extends ErMeta<QuestionnaireCompletedEvent> {
  erName: 'record-wish';
}
```

## FR2 — Класс `EventReaction`

Новый файл `packages/core/src/api/er/event-reaction.ts` (директория `er/` по аналогии с `uc/`):

```ts
export interface ErDocType {
  erName: ErMeta['erName'];
  erLabel: string;
  eventName: string;
}

export abstract class EventReaction<
  TMeta extends ErMeta,
  TResolve extends ModuleResolver = ModuleResolver,
> {
  /** Уникальное имя реакции */
  protected abstract readonly erName: TMeta['erName'];
  /** Человекочитаемая метка (для документации) */
  protected abstract readonly erLabel: string;
  /** Имя события — связано с типом через TMeta['event']['eventName'] */
  protected abstract readonly eventName: TMeta['event']['eventName'];

  protected resolve!: TResolve;

  init(resolve: TResolve): void;           // аналог UseCase.init
  getErName(): TMeta['erName'];            // аналог getUcName
  getEventName(): TMeta['event']['eventName'];
  abstract handle(event: TMeta['event']): Promise<void>;  // «вход» = само событие
  getDocType(): ErDocType;                 // аналог getDocType
}
```

Отличия от `UseCase` (сознательно):
- **НЕТ** `type`, `requiresAuth`, `inputSchema`, `outputSchema`, `errors`, `arMeta`.
- «Вход» = само событие (`TMeta['event']`); выхода нет (реакция делает side-effect: запись в repo, вызов фасада и т.п.).
- Ошибки наружу не бросаются (шина изолирует ошибки обработчиков через `console.error`) — при необходимости логируются внутри `handle`.

## FR3 — Интеграция в `ApiModule`

В `packages/core/src/api/module/api-module.ts`:

1. Добавить поле (опционально — не все модули реагируют):
   ```ts
   abstract readonly reactions?: EventReaction<ErMeta, ModuleResolver>[];
   ```
2. В `init()` после инициализации use-case'ов — авто-подписка:
   ```ts
   for (const er of this.reactions ?? []) {
     er.init(this.resolve);
     this.resolve.eventBus.subscribe(er.getEventName(), (event) =>
       er.handle(event as never),
     );
   }
   ```
   Каст `event as never` — потому что `subscribe` принимает `(event: DomainEvent) => Promise<void>`, а `er.handle` ожидает конкретный `TMeta['event']`. Типобезопасность обеспечивается внутри ER и через `ErMeta`, а не на шине.

## FR4 — Экспорты

- `EventReaction`, `ErMeta`, `ErDocType` экспортировать из `packages/core/src/api/er/` и из `packages/core/src/api/index.ts` (далее через `packages/core/src/index.ts`).

## FR5 — Документация ER (styleguide)

- Создать styleguide-файл для ER по образцу styleguide use-case. Положить рядом с существующими styleguide'ами слоёв (см. `arch-boundary-design/SKILL.md` — таблица указывает `conductor/code_styleguides/skills/<name>.md`).
- Зарегистрировать ER в двух местах:
  - таблица «Таблица принятия решений» в `conductor/code_styleguides/` (через `arch-boundary-design/SKILL.md` — добавить ряд: **EventReaction (ER)** → `api/er/*-er.ts` → ссылка на styleguide);
  - `conductor/index.md` (раздел «Руководства по стилю кода» — добавить ссылку на styleguide ER).

## Критерии приёмки

- [ ] `EventReaction` + `ErMeta` + `ErDocType` реализованы и экспортированы из core.
- [ ] `ApiModule.reactions` + авто-подписка в `init()` работают.
- [ ] Unit-тесты: ER (`init`/`getErName`/`getEventName`/`handle`/`getDocType`) + авто-подписка реакций в `ApiModule`.
- [ ] `bun run check:p core` проходит (biome + tsc + тесты).
- [ ] Styleguide ER создан и зарегистрирован (arch-boundary-design + index.md).

## За рамками

- Конкретные ER в доменных модулях (`questionnaire`/`wish`) — в треках B/C1/C2.
- Изменения в самом `EventBus` — шина остаётся как есть.

## Контекст и связанные документы

- [arch-boundary-design](../../.pi/skills/arch-boundary-design/SKILL.md) — где размещать логику (загружать первым).
- [ddd-api](../../.pi/skills/ddd-api/SKILL.md) — шаблоны API-слоя (UseCase/Module).
- [use-case.ts](../../packages/core/src/api/uc/use-case.ts) — образец для ER.
- [api-module.ts](../../packages/core/src/api/module/api-module.ts) — точка интеграции `reactions`.
- [event-bus.ts](../../packages/core/src/domain/events/event-bus.ts) — шина событий.
- [Рабочий процесс](../../workflow.md) — жизненный цикл задач (TDD, верификация фаз).
