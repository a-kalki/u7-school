# Спецификация — Трек: wish: полный жизненный цикл + универсальные цели (target)

## Обзор

Модуль **`@u7-scl/wish`** («Желание») эволюционирует в двух направлениях:

1. **Универсализация цели (target).** Желание больше не жёстко привязано к курсу через поле `courseId` — вводится `WishTarget` (дискриминированный союз `v.variant`). Сейчас единственный тип цели — `course`, в будущем можно добавлять другие (mentorship, challenge и т.д.) без переписывания агрегата.
2. **Полный жизненный цикл (две ветки).** Желание фиксируется **сразу** в момент выражения:
   - курс **без анкеты** → мгновенная фиксация, статус `expressed`;
   - курс **с анкетой** → желание фиксируется при старте анкеты, статус `pending`, далее `confirmed` (анкета завершена) или `abandoned` (анкета брошена).

Анкету запускает сам модуль wish (UC вызывает `questionnaireFacade.startStandard`), поэтому подписка на событие `questionnaire:start` **не нужна**: создание желания происходит в UC, а события `questionnaire:complete` / `questionnaire:abandon` лишь **переводят статус**.

Пул анкеты курса — простой JSON с явной привязкой к курсам (`pools/course.json`). В будущем пулы станут отдельной сущностью, которую пользователи смогут добавлять сами.

## Текущее состояние (базовая линия)

- `Wish`: `{ uuid, userId, courseId, status: 'expressed'|'cancelled'|'fulfilled', createdAt, updatedAt }` — жёсткая привязка к курсу.
- UC `express-wish` (две ветки: `instant` / `questionnaire`), UC `cancel-wish`.
- ER `record-wish` — создаёт желание по событию `questionnaire:complete`.
- `domain/wish/wish-questionnaire.ts` — пул `wishQuestionnairePool` + `hasQuestionnaire(courseId)` (захардкоженный пустой `Set`).
- `WishRepo.getByUserAndCourse(userId, courseId)`.

## Зафиксированные решения

1. **`WishTarget` — дискриминированный союз** (вариант A):
   ```ts
   const WishTargetSchema = v.variant('kind', [
     v.object({ kind: v.literal('course'), courseId: v.uuid() }),
   ]);
   ```
   `Wish`: `{ uuid, userId, target: WishTarget, status, createdAt, updatedAt }`. Агрегат не знает про курсы — он оперирует абстрактной целью.

2. **Статусы (6):** `expressed` | `pending` | `confirmed` | `cancelled` | `abandoned` | `fulfilled`.
   - `expressed` — мгновенная ветка: курс без анкеты (активный);
   - `pending` — анкетная ветка: анкета начата, желание уже зафиксировано (активный);
   - `confirmed` — анкетная ветка: анкета завершена (активный);
   - `cancelled` — отменено пользователем, **только из** `expressed` | `confirmed`;
   - `abandoned` — анкета брошена, «желание не доведено до конца», **только из** `pending`;
   - `fulfilled` — реализовано (переход добавляет трек C2), из `expressed` | `confirmed`.

   Ветки не пересекаются: переходы `pending ↔ expressed` невозможны. Единственная общая точка — `fulfilled`.

3. **Создание желания — в UC, не по событию `questionnaire:start`.** `create-course-wish` создаёт агрегат (`pending` или `expressed`) и запускает анкету через фасад. ER только переводят статус.

4. **ER:**
   - `confirm-wish-er` — подписка `questionnaire:complete` → найти желание по (user, target), если `pending` → `confirm()` → save; иначе игнор (идемпотентность);
   - `abandon-wish-er` — подписка `questionnaire:abandon` → если `pending` → `abandon()` → save; иначе игнор.

5. **Пул курса — `domain/wish/pools/course.json`** (map `courseId → QuestionnairePool`) + `course-pool.ts` с `findCoursePool(courseId): QuestionnairePool | undefined`. Курс без пула → мгновенная фиксация (`expressed`). В `tsconfig.json` включается `resolveJsonModule: true`.

6. **Скоуп активного желания — (user, target).** Активные статусы: `expressed | pending | confirmed`. Не более одного активного желания на пару (user, target); параллельные желания на **разные** курсы у одного пользователя разрешены. Повторное выражение после `cancelled`/`abandoned` разрешено (история сохраняется).

7. **Переименование:** UC `express-wish` → **`create-course-wish`** (явный глагол, course-специфичный). Удаляются: `express-wish-uc.ts`, `express-wish-cmd.ts`, `record-wish-er.ts`, `wish-questionnaire.ts`. Все публичные контракты (appApi-метаданные, ui-spec, трек D) переходят на `create-course-wish`.

8. **Желания не являются источником метрик.** Правки metrics-документов — только технические (замена устаревшего `onboarding` → `wish`).

## FR1 — Агрегат `Wish`

- `WishTargetSchema` (variant: `course`), `WishSchema` `{ uuid, userId, target, status, createdAt, updatedAt }`.
- `WishAr`:
  - `express(userId, target)` — фабрика, статус `expressed`;
  - `pending(userId, target)` — фабрика, статус `pending`;
  - `confirm()` — переход `pending → confirmed`, иначе ошибка;
  - `abandon()` — переход `pending → abandoned`, иначе ошибка;
  - `cancel()` — переход `expressed|confirmed → cancelled`, для `pending` — ошибка (для pending отмена только через abandon);
  - `fulfill()` — **не в этом треке** (C2), но инвариант фиксируется: переход из `expressed|confirmed`.
- Инвариант: не более одного активного желания на (user, target) — обеспечивается UC.

## FR2 — Repo + инфра

- `WishRepo`: `save(state)`, `getByUuid(uuid)`, `getByUserAndTarget(userId, target)`, `getByUser(userId)`.
- `WishJsonRepo` — файл `${dbDir}/wish/wishes.json` (поле `target` вместо `courseId`).

## FR3 — UC `create-course-wish`

`requiresAuth: true`. Вход: `{ courseId: string }`. Выход: `{ outcome: 'instant' | 'questionnaire' }`.

Логика:
1. Курс существует? (`CourseFacade.getCourse`) — иначе `COURSE_NOT_FOUND`.
2. Нет активного желания (`expressed|pending|confirmed`) для (user, target=course)? — иначе `WISH_ALREADY_EXISTS`.
3. `findCoursePool(courseId)`:
   - **есть пул** → `WishAr.pending(userId, target)` → save → `questionnaireFacade.startStandard<{ courseId }>(userId, pool, { courseId })` → `{ outcome: 'questionnaire' }`;
   - **нет пула** → `WishAr.express(userId, target)` → save → `{ outcome: 'instant' }`.

## FR4 — ER

- `confirm-wish-er`: `questionnaire:complete` (`ownerInfo.courseId`, `payload.respondentId`) → желание в `pending` → `confirm()` → save; иначе игнор.
- `abandon-wish-er`: `questionnaire:abandon` → желание в `pending` → `abandon()` → save; иначе игнор.
- Регистрация в `WishApiModule.reactions` (вместо `record-wish`).

## FR5 — UC `cancel-wish`

Вход: `{ courseId: string }`. Поиск желания (user, target=course) в статусе `expressed|confirmed` → `cancel()` → save. Если желания нет **или** оно в `pending` (отменять можно только активные, для `pending` — только abandon) → `WISH_NOT_FOUND`.

## FR6 — Пул анкеты курса

`domain/wish/pools/course.json`:
```json
{
  "<courseId>": {
    "inviteText": "...",
    "completionText": "...",
    "questions": [ { "type": "text", "question": "...", "questionCode": "wish-expectations" } ]
  }
}
```
`course-pool.ts`:
```ts
export function findCoursePool(courseId: string): QuestionnairePool | undefined;
```
`resolveJsonModule: true` в `tsconfig.json`.

## FR7 — Удаление и переименование

- Удалить: `express-wish-uc.ts`, `express-wish-cmd.ts`, `record-wish-er.ts`, `wish-questionnaire.ts` (код + тесты).
- Переименовать UC в `create-course-wish` (файл `course-wish-uc.ts` → `create-course-wish-uc.ts`, класс `CreateCourseWishUc`, `ucName: 'create-course-wish'`, команда `create-course-wish-cmd.ts`).
- Обновить: appApi-метаданные (`u7-bot-app-meta.ts`, `create-api-app.ts`), все ссылки `express-wish` в коде и тестах (grep → пусто), `course/ui-spec.md` (экраны W01–W05).

## Критерии приёмки

- [ ] Курс с анкетой: желание создаётся **сразу** (`pending`), `questionnaire:complete` → `confirmed`, `questionnaire:abandon` → `abandoned`.
- [ ] Курс без пула: желание создаётся мгновенно (`expressed`).
- [ ] `cancel-wish`: отменяет `expressed|confirmed`; для `pending` и отсутствующего желания — `WISH_NOT_FOUND`.
- [ ] Параллельные желания на разные курсы у одного пользователя возможны; повторное выражение после `cancelled`/`abandoned` возможно; `WISH_ALREADY_EXISTS` — при активном желании на тот же (user, target).
- [ ] `express-wish` / `record-wish` / `wish-questionnaire` удалены: `grep -rn "express-wish\|record-wish\|wishQuestionnairePool" packages/ apps/` → пусто (кроме документации трека C1).
- [ ] `resolveJsonModule: true` включён; `findCoursePool` возвращает пул только для курсов из `course.json`.
- [ ] `bun run check:p wish` и `bun run check:a u7-bot` проходят.

## За рамками

- `WishAr.fulfill()` и переход в `fulfilled` — трек C2 (в этом треке фиксируются только инварианты перехода).
- Удаление роли `CANDIDATE` из enum/policy/stream — трек C2.
- UI-экраны каталога курсов — трек D (здесь фиксируется контракт `create-course-wish`).
- Likert-анкеты для желаний, пользовательские пулы (будущая сущность «пул как данные пользователя»).
- Другие типы целей (`kind !== 'course'`) — задел через `WishTargetSchema`.

## Контекст и связанные документы

- [arch-boundary-design](../../.pi/skills/arch-boundary-design/SKILL.md) — где размещать логику.
- [ddd-domain](../../.pi/skills/ddd-domain/SKILL.md), [ddd-api](../../.pi/skills/ddd-api/SKILL.md), [ddd-infra](../../.pi/skills/ddd-infra/SKILL.md), [ddd-naming](../../.pi/skills/ddd-naming/SKILL.md).
- [Трек C1 (wish-module)](../../archive/wish-module_20260814/spec.md) — базовая модель агрегата, которую заменяет этот трек.
- [Трек C2 (wish-fulfillment)](../wish-fulfillment_20260814/spec.md) — `fulfill()`, удаление `CANDIDATE` (зависит от новых статусов).
- [Трек D (wish-ui)](../wish-ui_20260814/spec.md) — UI каталога курсов, контракт `create-course-wish`.
- [metrics-system.md](../../metrics-system.md), [metrics-conception.md](../../metrics-conception.md) — технические правки (onboarding → wish).
- [course/ui-spec.md](../../../apps/u7-bot/src/controllers/courses/ui-spec.md) — экраны W01–W05.
- [Рабочий процесс](../../workflow.md) — жизненный цикл задач.
