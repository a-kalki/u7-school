# Спецификация: core/api — актор-объект вместо actorId-строки

## Обзор

Сейчас `UseCase.handle(command, actorId?: string)` протаскивает через
`ApiApp.execute → ApiModule.execute → UseCase.execute` голый `actorId: string`,
и почти каждый доменный UC первым делом сам резолвит юзера через
`userFacade.getUserByUuid(actorId)` (или базовые хелперы `getActor`/`getUser`
в `user-uc.ts`, `course-uc.ts`, `stream-uc.ts`). Это дублирование резолва,
лишние запросы к БД и бойлерплейт в 63 UC.

Цель трека — резолвить пользователя **один раз на входе запроса** (UI-слой это
уже делает через `actorResolver`) и передавать по цепочке
`ApiApp → ApiModule → UseCase` **готовый объект** `actor: User`.

Попутно решается проблема дубля типа `User` (app-копия без `nick` vs
канонический в user-пакете): тип канонизируется в модуле `app`.

## Решения владельца (зафиксированы)

1. Тип `User` (и `UserSchema`, `Role`, `RoleSchema`, `UserArMeta`) канонически
   живёт в модуле `app` (`packages/app/src/domain/user.ts`); домен `user`
   импортирует его из app и реэкспортирует для совместимости.
2. ER и Job **не получают** актора — остаются системными (ER при
   необходимости берёт userId из события, Job выполняется планировщиком).
3. Фасады (`UserFacade`, `QuestionnaireFacade`, их in-proc-реализации)
   мигрируют с `actorId?: string` на `actor?: User`.
4. Один трек; между фазами допустимы красные состояния (домены/приложения),
   итоговое состояние обязано быть зелёным.

## Функциональные требования

### ФР-1. Канонизация User в app

- В `packages/app/src/domain/user.ts` — актуальные схемы (с `nick?`,
  полный набор ролей включая `AUTHOR`): `Role`, `RoleSchema`, `UserSchema`,
  `User`, `UserArMeta`.
- `packages/user/src/domain/user/entity.ts` и `roles.ts` — реэкспорты из
  `@u7-scl/app/domain` (55+ файлов с импортами из `@u7-scl/user/domain`
  продолжают работать без правок).
- Зависимость `@u7-scl/user → @u7-scl/app` (домен импортирует app —
  разрешено архитектурой; обратное запрещено и не появляется).
- Тесты схем переносятся в app (сценарии из `entity.test.ts`, `roles.test.ts`
  user-пакета не теряются — сверка по списку).

### ФР-2. core/api — дженерик актора

- `UcMeta<TActor = unknown>` получает поле `actor: TActor`.
- `UseCase`:
  - `handle(command: unknown, actor?: TMeta['actor'])`;
  - `protected execute(command, actor: TMeta['requiresAuth'] extends true ? TMeta['actor'] : TMeta['actor'] | undefined)`;
  - `checkAuth(actor?)` — семантика `requiresAuth` сохраняется (actor обязан
    быть передан).
- `ApiExecutor<TMeta>` / `ApiModule.execute` / `ApiApp.execute`:
  параметр `actor?: GetUcActorFromMeta<TMeta>` (тип-хелпер выводит actor-тип
  из union ucMetas, аналогично `ExtractUcMetaFromMeta`).
- ER (`EventReaction.handle(event)`) и Job (`Job.execute()`) — сигнатуры без
  актора, не меняются.

### ФР-3. Доменные UC — актор-объект

- Все CmdMeta доменов (user, wish, course, stream, questionnaire) объявляют
  `actor: User` (User из `@u7-scl/app/domain` или через реэкспорт
  `@u7-scl/user/domain`).
- Сигнатуры `execute(command, actor: User)` (или `actor?: User` для
  `requiresAuth: false`); повторный резолв актора внутри UC удаляется:
  - `UserUseCase.getActor()` — удалить;
  - `CourseUseCase.getActor()/getUser()` — удалить (getUser оставить нельзя:
  он используется для чужих юзеров; хелпер-обёртка над фасадом упрощается);
  - `StreamUseCase` — аналогично.
- Вызовы фасадов внутри UC/ER/Job передают `actor`-объект (или `undefined`
  для системных вызовов).

### ФР-4. Фасады — актор-объект

- `UserFacade`: все `actorId?: string` → `actor?: User`
  (`getUserByUuid`, `userExists`, `addRoleToUser`, `updateUserRole`,
  `getUserByTelegramId`, `removeRoleFromUser`, `registerGuest`, `notify`).
- `QuestionnaireFacade` — аналогично (все actorId-параметры).
- `UserInProcFacade` / `QuestionnaireInProcFacade`: вызовы
  `module.execute(uc, attrs, actor)` передают объект дальше.

### ФР-5. Приложения

- **u7-bot**: стори/контроллеры передают `actor`-объект в
  `appApi.execute(...)` вместо `actor.uuid`; системный актор бота
  (BOT_ADMIN) — резолвнутый объект `User` вместо `botAdminUuid: string`
  (резолв при старте в main.ts уже есть — верификация админа); мигрируют
  `ensure-registered.ts`, `group-handler.ts`, `main.ts`, все стори и тесты.
- **u7-cli**: вызовы `app.execute(...)` — объект актора (резолв на входе
  CLI-команды).

## Нефункциональные требования

- Контракт актора в core — без жёсткого интерфейса (`TActor = unknown`),
  core остаётся фреймворком, ничего не знающим о приложении.
- Никаких изменений поведения: валидация, ошибки, права — как раньше;
  меняются только сигнатуры и точка резолва.
- `bun run check` (biome + tsc + bun test) зелёный по всему репозиторию
  в конце трека.

## Критерии приёмки

1. `rg 'actorId' packages apps` (вне conductor/) не возвращает доменных
   сигнатур/вызовов с actorId-строками (допустимо только в названиях тест-фикстур
   или комментариев при необходимости — минимизировать).
2. UC-домены не резолвят актора повторно (нет `getActor(actorId)` /
   `getUserByUuid(actorId, actorId)` паттернов в начале execute).
3. `bun run check` — зелёный; покрытие новых механик core (actor-параметр,
   checkAuth, GetUcActorFromMeta) — тестами.
4. Дубль User устранён: канонические схемы только в
   `packages/app/src/domain/user.ts`; в user-пакете — реэкспорты.
5. UI-пользовательский сценарий бота не изменился (e2e-тесты зелёные,
   правки только в передаче актора).

## За рамками

- Web-api вход (когда появится) — резолв актора по своему контракту.
- Изменение Job/ER на акторные сигнатуры.
- Кэширование/инвалидация User-объекта между запросами.
- Изменение схем/валидации User (перенос как есть, с `nick`).
