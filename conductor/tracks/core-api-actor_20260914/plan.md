# План: core-api-actor_20260914

> Трек выполняется безостановочно (владелец отсутствует). Задачи
> «Conductor - Ручная верификация» выполняются владельцем по возвращении —
> оставляются `[ ]`. Чекпоинты фаз создаются автоматически.

## Фаза 1. Канонизация User в модуле app

- [~] Task: Перенести канонические схемы User в app (Red: тесты схем в app)
  - [ ] Обновить `packages/app/src/domain/user.ts`: Role/RoleSchema/UserSchema (с `nick?`, полный набор ролей), User, UserArMeta — источник: актуальные схемы user-пакета
  - [ ] Перенести тесты схем в app (`user.test.ts`), включив сценарии из `packages/user/src/domain/user/entity.test.ts` и `roles.test.ts` (сверить список сценариев — ничего не теряется)
  - [ ] `CI=true bun run check:p app` — зелёный
- [~] Task: Перевести user-пакет на реэкспорты из app
  - [ ] `packages/user/src/domain/user/entity.ts` → реэкспорт из `@u7-scl/app/domain`
  - [ ] `packages/user/src/domain/user/roles.ts` → реэкспорт из `@u7-scl/app/domain`
  - [ ] Добавить зависимость `@u7-scl/app` в `packages/user/package.json`
  - [ ] Удалить перенесённые тесты user-пакета (`entity.test.ts`, `roles.test.ts`) после сверки переноса сценариев
  - [ ] `CI=true bun run check:p user` и `CI=true bun test apps/u7-bot` — зелёные
- [ ] Task: Conductor - Ручная верификация 'Фаза 1' (Protocol in workflow.md)

## Фаза 2. core/api — дженерик актора

- [ ] Task: UcMeta.actor + UseCase (Red: тесты handle/execute/checkAuth на actor-объекте)
  - [ ] `UcMeta<TActor = unknown>`: поле `actor: TActor`
  - [ ] `UseCase.handle(command, actor?)`, `execute(command, actor)` с условным типом по `requiresAuth`, `checkAuth(actor?)`
  - [ ] Обновить `use-case.test.ts`, `use-case-auth.test.ts`, `use-case-output.test.ts`, `use-case-publish-events.test.ts` на actor-объекты
- [ ] Task: ApiExecutor/ApiModule/ApiApp — прокидка actor-объекта
  - [ ] `GetUcActorFromMeta<TMeta>` тип-хелпер в `core/domain/types.ts`
  - [ ] `ApiExecutor<TMeta>.execute(ucName, attrs, actor?)`
  - [ ] `ApiModule.execute(..., actor?)`, `ApiApp.execute(..., actor?)` + тесты (`api-module.test.ts`, `api-app.test.ts`)
  - [ ] `CI=true bun run check:p core` — зелёный (домены красные — легальное промежуточное состояние, чинится Фазами 3–4)
- [ ] Task: Conductor - Ручная верификация 'Фаза 2' (Protocol in workflow.md)

## Фаза 3. Домен user — актор-объект

- [ ] Task: CmdMeta домена user: поле `actor: User`
- [ ] Task: UC домена user — сигнатуры execute(command, actor), удалить `UserUseCase.getActor()`
- [ ] Task: UserFacade + UserInProcFacade — `actor?: User`; module.test.ts и прочие тесты домена
  - [ ] `CI=true bun run check:p user` — зелёный
- [ ] Task: Conductor - Ручная верификация 'Фаза 3' (Protocol in workflow.md)

## Фаза 4. Домены wish, course, stream, questionnaire — актор-объект

- [ ] Task: wish — CmdMeta + actor, UC-сигнатуры, тесты
- [ ] Task: course — CmdMeta + actor, UC-сигнатуры, упростить `CourseUseCase.getActor/getUser`, тесты
- [ ] Task: stream — CmdMeta + actor, UC-сигнатуры, `StreamUseCase` (getActor-хелпер), Job/ER — фасадные вызовы с actor-объектом/undefined, тесты
- [ ] Task: questionnaire — CmdMeta + actor, UC-сигнатуры, QuestionnaireFacade/InProc — `actor?: User`, тесты
  - [ ] `CI=true bun run check:p wish && CI=true bun run check:p course && CI=true bun run check:p stream && CI=true bun run check:p questionnaire` — зелёные (u7-bot/u7-cli красные — промежуточное состояние, чинится Фазой 5)
- [ ] Task: Conductor - Ручная верификация 'Фаза 4' (Protocol in workflow.md)

## Фаза 5. Приложения u7-bot и u7-cli — актор-объект

- [ ] Task: u7-bot — системный актор бота: резолв BOT_ADMIN в User при старте, `U7BotUiAppResolve.botAdminUuid` → объект User (main.ts, group-handler, ensure-registered)
- [ ] Task: u7-bot — стори/контроллеры: `appApi.execute(..., actor)` вместо `actor.uuid`; фасадные вызовы с объектом
- [ ] Task: u7-bot — тесты (юнит, интеграционные, e2e): моки execute/фасадов на actor-объекты
- [ ] Task: u7-cli — вызовы `app.execute(..., actor)`; тесты
  - [ ] `CI=true bun run check:a u7-bot && CI=true bun run check:a u7-cli` — зелёные
- [ ] Task: Conductor - Ручная верификация 'Фаза 5' (Protocol in workflow.md)

## Фаза 6. Чистка, документация, финализация

- [ ] Task: Полный гейт: `CI=true bun run check` по репозиторию — зелёный
- [ ] Task: Чистка остатков actorId (rg-аудит по ФР/КП спеки)
- [ ] Task: Обновить styleguides: `conductor/code_styleguides/skills/usecase.md`, `facade.md`, `domain-boundaries.md`, `architecture.md` — паттерн actor-объекта
- [ ] Task: summary.md трека + реестр tracks.md
- [ ] Task: Conductor - Ручная верификация 'Фаза 6' (Protocol in workflow.md)
