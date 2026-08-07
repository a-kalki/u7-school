# План реализации: `UiApp` в core + удаление `BotRouter`

> **Трек:** `bot_ui_uiapp_core_20260807`
> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md)
>
> **Зависимости:** `bot_ui_app_20260807`

---

## Фаза 1: Создать `UiApp` в core

- [ ] Task: Создать `packages/core/src/ui/bot/ui-app.ts`
    - [ ] Класс `UiApp<TAppMeta, TActor>` с дженериками
    - [ ] `constructor(controllers)` — валидация уникальности имён контроллеров
    - [ ] `init(apiApp)` — каскад: apiApp → контроллеры → стори → сбор publicActions
    - [ ] Приватный метод `#registerPublicActions()` — плоская мапа `Map<actionName, factory>`, проверка уникальности
    - [ ] `getAction<T extends StoryPublicActions>(name: keyof T): T[typeof name]` — типизированный доступ
- [ ] Task: Перенести ВСЮ маршрутизацию из `BotRouter` в `UiApp`
    - [ ] `handleWelcome`, `handleCallback`, `handleMessage`, `handleCancel`, `handleTimeout`
    - [ ] `collectMainMenu`, `collectHelp` (имплементирует `MenuAggregator`)
    - [ ] Приватные методы: `#toKeyboard`, `#applyCapturedInput`, `#mergeResponses`
    - [ ] Логика делегирования (один уровень)
    - [ ] `getController(name)` — публичный метод для тестов
- [ ] Task: Обновить `packages/core/src/ui/index.ts`
    - [ ] Убрать экспорт `bot-router`
    - [ ] Добавить экспорт `ui-app`
    - [ ] Убрать экспорт несуществующего `ui-registry`
- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: Доработать `BotController` и `BotUserStory`

- [ ] Task: Доработать `BotController.init()`
    - [ ] Второй аргумент `uiApp: UiApp<TAppMeta, TActor>`
    - [ ] Сохранить `this.uiApp = uiApp`
    - [ ] Каскадный проброс в стори: `story.init(appApi, uiApp)`
- [ ] Task: Доработать `BotUserStory`
    - [ ] Дженерик `TActions extends StoryPublicActions = StoryPublicActions`
    - [ ] Поле `abstract publicActions: TActions`
    - [ ] Поле `protected uiApp!: UiApp<TAppMeta, TActor>` (вместо `ApiApp`)
    - [ ] `init(appApi: ApiApp<TAppMeta>, uiApp: UiApp<TAppMeta, TActor>)` — два аргумента
- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Обновить `u7-bot` (connectRouter, ui-app, ui-actions)

- [ ] Task: `connectRouter` → `connectUiApp`
    - [ ] Переименовать функцию в `apps/u7-bot/src/handlers/router.ts`
    - [ ] Заменить `router: BotRouter` → `uiApp: UiApp<U7BotAppMeta, User>`
    - [ ] Все вызовы `router.*` → `uiApp.*`
- [ ] Task: Обновить `U7BotUiApp` (`apps/u7-bot/src/ui-app.ts`)
    - [ ] `extends UiApp<U7BotAppMeta, User>`
    - [ ] Убрать создание `BotRouter` (свойство `router`)
    - [ ] Убрать геттер `get router()`
    - [ ] Убрать метод `getPublicActionCb`
    - [ ] `init()` вызывает `super.init(apiApp)`
- [ ] Task: Обновить `apps/u7-bot/src/main.ts`
    - [ ] `connectRouter` → `connectUiApp`
    - [ ] `uiApp.router` → `uiApp`
- [ ] Task: Обновить `apps/u7-bot/src/ui-actions.ts`
    - [ ] Убрать реэкспорт несуществующего `@u7-scl/core/ui/ui-registry`
    - [ ] Оставить только актуальные локальные реэкспорты (только из core)
- [ ] Task: Обновить `apps/u7-bot/src/api-app.ts` (`createUiApp`)
    - [ ] Адаптировать создание `U7BotUiApp` (без `BotRouter`, один вызов `init(apiApp)`)
- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)

## Фаза 4: Удаление `BotRouter` и обновление импортов

- [ ] Task: Удалить `packages/core/src/ui/bot/router/bot-router.ts`
- [ ] Task: Удалить `packages/core/src/ui/bot/router/bot-router.test.ts`
- [ ] Task: Обновить ВСЕ импорты `BotRouter` в проекте (кроме тех, что внутри `BotRouter`)
    - [ ] `apps/u7-bot/src/handlers/router.ts`
    - [ ] `apps/u7-bot/src/main.ts`
    - [ ] `apps/u7-bot/src/api-app.ts`
    - [ ] `apps/u7-bot/src/ui-app.ts`
    - [ ] Любые тесты, ссылающиеся на `BotRouter`
- [ ] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)

## Фаза 5: Проверка качества

- [ ] Task: Прогнать полную проверку качества
    - [ ] `bun run check` в `packages/core` и `apps/u7-bot` — biome + tsc
    - [ ] `bun test` в `packages/core` и `apps/u7-bot` — все тесты проходят
- [ ] Task: Conductor - User Manual Verification 'Фаза 5: Качество' (Protocol in workflow.md)
