# Спецификация — Трек C1: wish модуль (ядро)

## Обзор

Создаётся новый модуль **`@u7-scl/wish`** («Желание»), который фиксирует **желание пользователя пройти курс**. Модуль заменяет старый `@u7-scl/onboarding` (весь код анкетирования из onboarding удаляется — анкеты теперь ведёт `questionnaire`).

Модуль wish **не имеет собственного bot-ui-контроллера**: он вызывается через `appApi` из каталога курсов (трек D) и реагирует на события через ER (трек A).

Домен языка — **«желание пройти курс»** (явная привязка к курсу через `courseId`).

## Текущее состояние (базовая линия)

Модуль `packages/onboarding/` (будет заменён):
- `src/domain/questionnaire/` — старый движок анкет (a-root.ts, entity.ts, question.ts, question-pool-service.ts, types.ts, policy.ts, repo.ts, errors.ts, commands/, question-pool.json).
- `src/api/questionnaire/` — start-uc.ts, handle-action-uc.ts, abandon-uc.ts, get-current-question-uc.ts.
- `src/api/onboarding-uc.ts`, `src/api/module.ts` (OnboardingApiModule).
- `src/domain/module.ts` (OnboardingApiModuleMeta/Resolver), `src/domain/index.ts`.
- `src/infra/db/questionnaire-json-repo.ts`, `src/infra/index.ts`.

Связанные точки в приложении:
- `apps/u7-bot/src/create-api-app.ts` — создаёт `OnboardingApiModule`, `QuestionPoolService`, `QuestionnaireJsonRepo` (onboarding), передаёт в ApiApp.
- `apps/u7-bot/src/core/u7-bot-app-meta.ts` — метаданные UC приложения (содержат onboarding-UC).
- `apps/u7-bot/src/controllers/onboarding/` — заглушка контроллера + `ui-spec.md`.
- `apps/u7-bot/tests/e2e/onboarding.e2e.test.ts` — e2e старого онбординга.
- Роль `CANDIDATE` выдаётся в `onboarding/api/questionnaire/handle-action-uc.ts` (строка `Role.CANDIDATE`) — этот код удаляется вместе с onboarding.

## Зафиксированные решения

1. **wish фиксирует желание, анкету ведёт questionnaire.** wish вызывает `questionnaireFacade.start(actorId, pool, { courseId })` ровно один раз; далее анкета ведёт пользователя, а wish ловит `questionnaire.completed` через ER `record-wish`.
2. **Роль `CANDIDATE` wish НЕ выдаёт.** Само удаление роли из enum/policy/stream — в треке **C2** (там же замена «снятие CANDIDATE при зачислении» на «Wish → fulfilled»). В C1 роль в enum НЕ трогаем (иначе сломается stream).
3. **Курс может не иметь анкеты** → желание фиксируется **мгновенно** по клику, без questionnaire.
4. **Статусы `Wish`:** `expressed` (зафиксировано) / `cancelled` (отменено) / `fulfilled` (реализовано — переход в C2).
5. **Привязка к курсу обязательна:** `courseId` — валидный UUID существующего курса.

## FR1 — Агрегат `Wish`

Новый пакет `packages/wish/` (структура по ddd-naming):

```
packages/wish/src/
  index.ts
  api/index.ts
  api/module.ts                  — WishApiModule
  api/wish-uc.ts                 — WishUseCase (базовый)
  api/wish/express-wish-uc.ts
  api/wish/cancel-wish-uc.ts
  api/er/record-wish-er.ts       — ER (трек A)
  domain/index.ts
  domain/module.ts               — WishApiModuleMeta / WishApiModuleResolver
  domain/wish/a-root.ts          — WishAr
  domain/wish/entity.ts          — WishSchema / Wish / WishStatus
  domain/wish/errors.ts
  domain/wish/repo.ts            — WishRepo (интерфейс)
  domain/wish/commands/express-wish-cmd.ts
  domain/wish/commands/cancel-wish-cmd.ts
  domain/wish/wish-questionnaire.ts  — пул анкеты желания + конфиг «у каких курсов есть анкета»
  infra/index.ts
  infra/db/wish-json-repo.ts
```

Схема `Wish`:
```ts
export const WishStatusSchema = v.picklist(['expressed', 'cancelled', 'fulfilled']);
export const WishSchema = v.object({
  uuid: v.uuid(),                  // v.pipe(v.string(), v.uuid(...))
  userId: <UserSchema.entries.uuid>,   // uuid пользователя
  courseId: <UserSchema.entries.uuid>, // uuid курса
  status: WishStatusSchema,
  createdAt: v.isoDateTime(),
  updatedAt: v.optional(v.isoDateTime()),
});
```

`WishAr`:
- `express(userId, courseId)` — статический/фабричный метод создания в статусе `expressed`.
- `cancel()` — переход `expressed` → `cancelled`.
- Инвариант: отменить можно только `expressed` (не `fulfilled`, не уже `cancelled`).
- Метод `fulfill()` добавляется в C2.

## FR2 — Repo + инфра

- `WishRepo` (интерфейс): `save(state)`, `getByUuid(uuid)`, `getByUserAndCourse(userId, courseId)`, `getByUser(userId)`.
- `WishJsonRepo` (реализация, как существующие json-repo): файл `${dbDir}/wish/wishes.json`.
- Экспорт из `packages/wish/src/infra/index.ts`.

## FR3 — UC `express-wish` (две ветки)

`requiresAuth: true` (actorId = uuid пользователя).

Вход: `{ courseId: string }`.
Выход: `{ outcome: 'instant' | 'questionnaire' }` (треку D нужно знать, что отрисовать).

Логика:
1. Проверить, что курс существует (через `CourseFacade`); если нет — ошибка `COURSE_NOT_FOUND`.
2. Проверить, что нет уже существующего `Wish` с `status === 'expressed'` для (userId, courseId); если есть — конфликт `WISH_ALREADY_EXISTS`.
3. Определить, есть ли у курса анкета (конфиг `wish-questionnaire.ts`, см. FR6):
   - **есть анкета** → `await questionnaireFacade.start<{ courseId: string }>(actorId, pool, { courseId })`; вернуть `{ outcome: 'questionnaire' }`. Wish здесь **не создаётся** — его создаст ER `record-wish` по событию.
   - **нет анкеты** → `WishAr.express(actorId, courseId)`, сохранить, вернуть `{ outcome: 'instant' }`.

## FR4 — ER `record-wish`

Файл `api/er/record-wish-er.ts` (трек A). Подписка на событие из трека B:

```ts
interface RecordWishErMeta extends ErMeta<QuestionnaireCompletedEvent<{ courseId: string }>> {
  erName: 'record-wish';
}
```

`handle(event)`:
1. `const courseId = event.ownerInfo.courseId;`
2. `const userId = event.payload.respondentId;`
3. Проверить, что нет `Wish(expressed)` для (userId, courseId); если есть — ничего не делать (идемпотентность).
4. `WishAr.express(userId, courseId)` → `wishRepo.save(...)`.

Роль `CANDIDATE` **НЕ выдаётся**.

## FR5 — UC `cancel-wish`

`requiresAuth: true`.
Вход: `{ courseId: string }` (найти свой `Wish(expressed)` по курсу).
Логика: найти `Wish(expressed)` → `cancel()` → сохранить. Если нет — ошибка `WISH_NOT_FOUND`.

## FR6 — Пул анкеты желания и конфиг «у каких курсов есть анкета»

Файл `domain/wish/wish-questionnaire.ts`:
- `wishQuestionnairePool: QuestionnairePool` — общий пул вопросов желания (тексты `inviteText`/`completionText` + вопросы об ожиданиях от курса).
- `hasQuestionnaire(courseId: string): boolean` — определяет, есть ли у курса анкета (реализация — конфиг/набор courseIds; курсы вне набора → мгновенное желание).

## FR7 — Удаление старого onboarding

- Удалить `packages/onboarding/` целиком (или переименовать в `wish` и вычистить — на выбор, итог один: пакет `@u7-scl/wish` без старого кода анкет).
- `packages/onboarding/package.json` → `packages/wish/package.json` (name `@u7-scl/wish`).
- Удалить из `apps/u7-bot/src/create-api-app.ts`: `OnboardingApiModule`, `QuestionPoolService`, onboarding-`QuestionnaireJsonRepo`, `activePoolService` и передачу `onboardingModule` в ApiApp.
- Удалить `apps/u7-bot/src/controllers/onboarding/` (заглушку) и `apps/u7-bot/tests/e2e/onboarding.e2e.test.ts`.
- Обновить `apps/u7-bot/src/core/u7-bot-app-meta.ts` (убрать onboarding-UC, добавить wish-UC).

## FR8 — Регистрация в ApiApp

- `WishApiModule` c `useCases = [ExpressWishUc, CancelWishUc]` и `reactions = [RecordWishEr]`.
- `WishApiModuleResolver` — расширяет `ModuleResolver`: `wishRepo`, `courseFacade`, `questionnaireFacade`, `userFacade`, `appResolver`, `eventBus`.
- В `create-api-app.ts`: создать `wishRepo`, `wishModule`, зарегистрировать в `ApiApp`.

## Критерии приёмки

- [ ] `Wish` создаётся **мгновенно** (курс без анкеты) и **через ER** (курс с анкетой → `questionnaire.completed`).
- [ ] `cancel-wish` переводит `expressed` → `cancelled`; повторная отмена/несуществующее желание дают ошибку.
- [ ] Роль `CANDIDATE` wish'ем не выдаётся.
- [ ] Старый код анкет onboarding удалён; пакет переименован в `@u7-scl/wish`.
- [ ] `bun run check:p wish` и `bun run check:a u7-bot` проходят (с учётом того, что UI — трек D).
- [ ] Инвариант: нельзя дважды создать `Wish(expressed)` на один (user, course).

## За рамками

- UI-экраны в каталоге курсов (трек D).
- Пометка `fulfilled` при зачислении + удаление роли `CANDIDATE` из enum/policy/stream (трек C2).

## Контекст и связанные документы

- [arch-boundary-design](../../.pi/skills/arch-boundary-design/SKILL.md) — где размещать логику.
- [ddd-domain](../../.pi/skills/ddd-domain/SKILL.md), [ddd-api](../../.pi/skills/ddd-api/SKILL.md), [ddd-infra](../../.pi/skills/ddd-infra/SKILL.md), [ddd-naming](../../.pi/skills/ddd-naming/SKILL.md).
- [course/ui-spec.md](../../apps/u7-bot/src/controllers/courses/ui-spec.md) — раздел «Желание пройти курс» (экраны W01–W05).
- [Трек A](../event-reaction_20260814/spec.md) — EventReaction/ErMeta.
- [Трек B](../questionnaire-owner-info_20260814/spec.md) — ownerInfo + событие.
- [Рабочий процесс](../../workflow.md) — жизненный цикл задач.
