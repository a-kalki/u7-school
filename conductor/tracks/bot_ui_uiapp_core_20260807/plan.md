# План реализации: `UiApp` в core + удаление `BotRouter`

> **Трек:** `bot_ui_uiapp_core_20260807`
> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md)
>
> **Зависимости:** `bot_ui_app_20260807`

---

## Фаза 1: Создать `UiApp` в core

- [x] Task: Создать `packages/core/src/ui/bot/ui-app.ts`
    - [x] Класс `UiApp<TAppMeta, TActor>` с дженериками
    - [x] `constructor(controllers)` — валидация уникальности имён контроллеров
    - [x] `init(apiApp)` — каскад: apiApp → контроллеры → стори → сбор publicActions
    - [x] Приватный метод `#registerPublicActions()` — плоская мапа `Map<actionName, factory>`, проверка уникальности
    - [x] `getAction<T extends StoryPublicActions>(name: keyof T): T[typeof name]` — типизированный доступ
- [x] Task: Перенести ВСЮ маршрутизацию из `BotRouter` в `UiApp`
    - [x] `handleWelcome`, `handleCallback`, `handleMessage`, `handleCancel`, `handleTimeout`
    - [x] `collectMainMenu`, `collectHelp` (имплементирует `MenuAggregator`)
    - [x] Приватные методы: `#toKeyboard`, `#applyCapturedInput`, `#mergeResponses`
    - [x] Логика делегирования (один уровень)
    - [x] `getController(name)` — публичный метод для тестов
- [x] Task: Обновить `packages/core/src/ui/index.ts`
    - [x] Убрать экспорт `bot-router`
    - [x] Добавить экспорт `ui-app`
    - [x] Убрать экспорт несуществующего `ui-registry`
- [x] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: Доработать `BotController` и `BotUserStory`

- [x] Task: Доработать `BotController.init()`
    - [x] Второй аргумент `uiApp: UiApp<TAppMeta, TActor>`
    - [x] Сохранить `this.uiApp = uiApp`
    - [x] Каскадный проброс в стори: `story.init(appApi, uiApp)`
- [x] Task: Доработать `BotUserStory`
    - [x] Дженерик `TActions extends StoryPublicActions = StoryPublicActions`
    - [x] Поле `publicActions: TActions` (с дефолтом `{}`, не abstract для совместимости)
    - [x] Поле `uiApp!: UiApp<TAppMeta, TActor>` (вместо `ApiApp`)
    - [x] `init(appApi: ApiApp<TAppMeta>, uiApp: UiApp<TAppMeta, TActor>)` — два аргумента
- [x] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Обновить `u7-bot` (connectRouter, ui-app, ui-actions)

- [x] Task: `connectRouter` → `connectUiApp`
    - [x] Переименовать функцию в `apps/u7-bot/src/handlers/router.ts`
    - [x] Заменить `router: BotRouter` → `uiApp: UiApp<U7BotAppMeta, User>`
    - [x] Все вызовы `router.*` → `uiApp.*`
    - [x] Файл переименован в `apps/u7-bot/src/handlers/connect-ui-app.ts`
- [x] Task: Обновить `U7BotUiApp` (`apps/u7-bot/src/ui-app.ts`)
    - [x] `extends UiApp<U7BotAppMeta, User>`
    - [x] Убрать создание `BotRouter` (свойство `router`)
    - [x] Убрать геттер `get router()`
    - [x] Убрать метод `getPublicActionCb`
    - [x] `init()` вызывает `super.init(apiApp)`
- [x] Task: Обновить `apps/u7-bot/src/main.ts`
    - [x] `connectRouter` → `connectUiApp`
    - [x] `uiApp.router` → `uiApp`
- [x] Task: Обновить `apps/u7-bot/src/ui-actions.ts`
    - [x] Убрать реэкспорт несуществующего `@u7-scl/core/ui/ui-registry`
    - [x] Файл удалён (решено не реэкспортировать типы из core)
- [x] Task: Обновить `apps/u7-bot/src/api-app.ts` (`createUiApp`)
    - [x] Адаптировать создание `U7BotUiApp` (без `BotRouter`, один вызов `init(apiApp)`)
    - [x] Файл разделён на `create-api-app.ts` + `create-ui-app.ts`
- [x] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)

## Фаза 4: Удаление `BotRouter` и обновление импортов

- [x] Task: Удалить `packages/core/src/ui/bot/router/bot-router.ts`
- [x] Task: Удалить `packages/core/src/ui/bot/router/bot-router.test.ts`
- [x] Task: Обновить ВСЕ импорты `BotRouter` в проекте (кроме тех, что внутри `BotRouter`)
    - [x] `apps/u7-bot/src/handlers/connect-ui-app.ts`
    - [x] `apps/u7-bot/src/main.ts`
    - [x] `apps/u7-bot/src/create-api-app.ts`
    - [x] `apps/u7-bot/src/ui-app.ts`
    - [x] Любые тесты, ссылающиеся на `BotRouter`
- [x] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)

## Фаза 5: Проверка качества

- [x] Task: Прогнать полную проверку качества
    - [x] `bun run check` в `packages/core` и `apps/u7-bot` — biome + tsc
    - [x] `bun test` в `packages/core` и `apps/u7-bot` — все тесты проходят
- [x] Task: Conductor - User Manual Verification 'Фаза 5: Качество' (Protocol in workflow.md)
