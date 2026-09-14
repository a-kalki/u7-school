# План: core-api-actor_20260914

> Трек выполняется безостановочно (владелец отсутствует). Задачи
> «Conductor - Ручная верификация» выполняются владельцем по возвращении —
> оставляются `[ ]`. Чекпоинты фаз создаются автоматически.

## Фаза 1. Канонизация User в модуле app [checkpoint: b2d4a96]

- [x] Task: Перенести канонические схемы User в app (Red: тесты схем в app) `95cfc19`
  - [x] Обновить `packages/app/src/domain/user.ts`: Role/RoleSchema/UserSchema (с `nick?`, полный набор ролей), User, UserArMeta — источник: актуальные схемы user-пакета
  - [x] Перенести тесты схем в app (`user.test.ts`), включив сценарии из `packages/user/src/domain/user/entity.test.ts` и `roles.test.ts` (сверить список сценариев — ничего не теряется)
  - [x] `CI=true bun run check:p app` — зелёный
- [x] Task: Перевести user-пакет на реэкспорты из app `95cfc19`
  - [x] `packages/user/src/domain/user/entity.ts` → реэкспорт из `@u7-scl/app/domain`
  - [x] `packages/user/src/domain/user/roles.ts` → реэкспорт из `@u7-scl/app/domain`
  - [x] Добавить зависимость `@u7-scl/app` в `packages/user/package.json`
  - [x] Удалить перенесённые тесты user-пакета (`entity.test.ts`, `roles.test.ts`) после сверки переноса сценариев
  - [x] `CI=true bun run check:p user` и `CI=true bun test apps/u7-bot` — зелёные
- [ ] Task: Conductor - Ручная верификация 'Фаза 1' (Protocol in workflow.md)

## Фаза 2. core/api — дженерик актора [checkpoint: 003dd9c5; переделан: актор — дженерик-параметр класса, не поле меты]

> **Изменение дизайна (решение владельца):** актор — отдельный дженерик-параметр класса
> (`UseCase<TMeta, TResolve, TActor>`), зеркально UI-слою (`BotUiApp<TAppMeta, TActor, TResolve>`);
> `UcMeta` остаётся чистой (без actor). Специализация User закрывается в модуле app
> (`U7UseCase`/`U7ApiModule`/`U7ApiApp`/`U7ApiExecutor`). Первая реализация через
> `UcMeta<TActor>`/`GetUcActorFromMeta` (коммит 4f1c8a5) заменена.

- [x] Task: UseCase — дженерик-параметр TActor (Red: тесты на actor-объект)
  - [x] `UseCase<TMeta, TResolve, TActor = unknown>`: `handle(command, actor?)`, `execute(command, actor)` с условным типом по `requiresAuth`, `checkAuth(actor?)`
  - [x] `UcMeta` — без actor (чистые данные)
  - [x] Тесты: `use-case.test.ts`, `use-case-auth.test.ts`, `use-case-output.test.ts`, `use-case-publish-events.test.ts`, `job.test.ts` — актор в дженерик-аргументах
- [x] Task: ApiExecutor/ApiModule/ApiApp — дженерик-параметр TActor
  - [x] `ApiExecutor<TMeta, TActor = unknown>.execute(ucName, attrs, actor?)`
  - [x] `ApiModule<TMeta, TResolve, TActor>` / `ApiApp<TMeta, TActor>` — прокидка actor-объекта; `GetUcActorFromMeta` удалён
  - [x] Тесты `api-module.test.ts`, `api-app.test.ts`; `CI=true bun run check:p core` — зелёный
- [x] Task: Специализация User в модуле app (закрытие дженерика, как в UI)
  - [x] `packages/app/src/domain/api.ts`: `U7UseCase`, `U7ApiModule` (базовые классы), `U7ApiApp`, `U7ApiExecutor` (типы)
  - [x] Экспорт из `@u7-scl/app/domain` и `@u7-scl/app`; тест `api.test.ts` (3 сценария)
  - [x] `CI=true bun run check:p app` — зелёный; корневой tsc — зелёный (строки совместимы с unknown до миграции доменов)
- [ ] Task: Conductor - Ручная верификация 'Фаза 2' (Protocol in workflow.md)

## Фаза 3. Домен user — актор-объект [checkpoint: 6f69443b]

- [x] Task: UC домена user: база `UserUseCase extends U7UseCase`, сигнатуры `execute(command, actor: User)`, удалить `getActor()`; модуль `UserApiModule extends U7ApiModule` `5c4de46`
- [x] Task: UserFacade + UserInProcFacade — `actor?: User`; тесты домена (registerGuest: nick?/actor? поменялись местами — actor последним) `5c4de46`
  - [x] `CI=true bun run check:p user` — зелёный (135 тестов)
- [ ] Task: Conductor - Ручная верификация 'Фаза 3' (Protocol in workflow.md)

## Фаза 4. Домены wish, course, stream, questionnaire — актор-объект [checkpoint: 389b18bf]

- [x] Task: wish — UC `extends U7UseCase`, сигнатуры execute(actor), модуль `extends U7ApiModule`, тесты `ba7dce8`
- [x] Task: course — UC `extends U7UseCase`, упростить `CourseUseCase` (удалить getActor/getUser), модуль `extends U7ApiModule`, тесты `ba7dce8` (удалены кейсы «несуществующий пользователь» — резолв перенесён на вход приложения)
- [x] Task: stream — UC `extends U7UseCase`, `StreamUseCase` (getActor-хелпер удалён), Job/ER — фасадные вызовы с actor-объектом/undefined, тесты `ba7dce8`
- [x] Task: questionnaire — UC `extends U7UseCase`, QuestionnaireFacade/InProc — `actor?: User`, тесты `ba7dce8`
  - [x] `CI=true bun run check:p wish && CI=true bun run check:p course && CI=true bun run check:p stream && CI=true bun run check:p questionnaire` — зелёные (wish 107 / course 364 / stream 264 / questionnaire 130 тестов)
- [ ] Task: Conductor - Ручная верификация 'Фаза 4' (Protocol in workflow.md)

## Фаза 5. Приложения u7-bot и u7-cli — актор-объект [checkpoint: 0f231e14]

- [x] Task: u7-bot — `U7BotApp = U7ApiApp<U7BotAppMeta>`; системный актор бота: botAdminUser (User) резолвится при старте (main.ts + async createUiApp), `U7BotUiAppResolve.botAdminUser` (group-handler, ensure-registered) `f891d7a`
- [x] Task: u7-bot — стори/контроллеры: `appApi.execute(..., actor)` вместо `actor.uuid`; фасадные вызовы с объектом; getStudent(appApi, actor) `f891d7a`
- [x] Task: u7-bot — тесты (юнит, интеграционные, e2e): моки execute/фасадов на actor-объекты (655/655) `f891d7a`
- [x] Task: u7-cli — `currentActor: User` (полный объект через get-user при /login); scripts — resolveActor() в _app-factory `f891d7a`
  - [x] Полный гейт репозитория `CI=true bun run check` — зелёный: 2092 теста / 0 fail, biome + tsc чисты
- [ ] Task: Conductor - Ручная верификация 'Фаза 5' (Protocol in workflow.md)

## Фаза 6. Чистка, документация, финализация

- [x] Task: Полный гейт: `CI=true bun run check` по репозиторию — зелёный (2092 теста / 0 fail, biome + tsc) `f891d7a`
- [x] Task: Чистка остатков actorId (rg-аудит) — докстринги/мок-подписи обновлены; остались только локальные uuid-переменные тестов (легитимно) `fde497bd`
- [x] Task: Обновить styleguides: `skills/usecase.md`, `skills/facade.md`, `architecture.md` — паттерн actor-объекта (в domain-boundaries.md правок не потребовалось) `fde497bd`
- [x] Task: summary.md трека + реестр tracks.md + metadata.json (status: done)
- [ ] Task: Conductor - Ручная верификация 'Фаза 6' (Protocol in workflow.md)
