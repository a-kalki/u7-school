# Итоговый отчёт: ActionFactory — UiActions и UiRegistry

> **Трек:** `bot_ui_actions_20260807`
> **Релиз:** 1 — Новый Bot UI
> **Зависимости:** `bot_ui_base_20260807`

## Цель

Создать механизм типизированных кросс-ссылок между UserStory: каждая стори объявляет `publicActions`, контроллер собирает их, `UiRegistry` объединяет и инжектит в стори через `initUi()`.

## Выполненные задачи

### Core-изменения
- `BotUserStory` — добавлено поле `ui: unknown` + метод `initUi(ui)`
- `BotController` — добавлен геттер `publicActions` + метод `initUi(registry)`
- `BotRouter.init()` — возвращён к одному параметру `apiApp` (без `uiRegistry`)

### Новая инфраструктура
- `packages/core/src/ui/bot/ui-registry.ts` — типы `ControllerActions`, `UiRegistry`, `StoryPublicActions`, `UiCallbackFactory`, `HasPublicActions` + функция `createUiRegistry`
- `apps/u7-bot/src/ui-actions.ts` — реэкспорт для обратной совместимости

### U7BotUiApp
- `apps/u7-bot/src/ui-app.ts` — новый класс-оркестратор UI-слоя:
  - Владеет контроллерами и `BotRouter` (композиция)
  - `init(apiApp)`: каскад ApiApp → контроллеры → стори → UiRegistry → инжект ui
- `apps/u7-bot/src/api-app.ts` — разделён на `createApiApp()` (только домен) и `createUiApp()` (UI-слой)

### Тесты
- `ui-actions.test.ts` — 10 тестов (создан)
- `bot-user-story.test.ts` — +4 теста на `ui`/`initUi`
- `bot-controller.test.ts` — +7 тестов на `publicActions`/`initUi`
- `test-app.ts` — исправлен `apiApp.init()`, добавлен `createTestUiRouter()`

## Изменённые файлы

Новые:
- `packages/core/src/ui/bot/ui-registry.ts`
- `apps/u7-bot/src/ui-app.ts`
- `apps/u7-bot/src/ui-actions.test.ts`

Изменённые:
- `packages/core/src/ui/bot/bot-user-story.ts`
- `packages/core/src/ui/bot/controller/bot-controller.ts`
- `packages/core/src/ui/bot/router/bot-router.ts`
- `packages/core/src/ui/index.ts`
- `apps/u7-bot/src/api-app.ts`
- `apps/u7-bot/src/main.ts`
- `apps/u7-bot/src/ui-actions.ts`
- `tests/bot/helpers/test-app.ts`
- `packages/core/.../bot-user-story.test.ts`
- `packages/core/.../bot-controller.test.ts`

## Архитектурные решения

1. **`ui: unknown`** — поле не параметризовано дженериком, чтобы не усложнять базовый класс. Тип выводится через `ControllerActions<typeof controller>`.

2. **`initUi` отдельно от `init`** — чтобы не ломать существующий контракт `init(moduleApi, appApi)`.

3. **`U7BotUiApp` — композиция над `BotRouter`** — не наследование. `BotRouter` остаётся чистым (только маршрутизация), `U7BotUiApp` добавляет сборку `UiRegistry`.

4. **`createUiRegistry` в core** — это инфраструктура, не специфичная для u7-bot.

5. **Разделение `createApiApp` / `createUiApp`** — доменный и UI слои инициализируются раздельно.

## Известные ограничения

- Тесты (~20 файлов) пока не переведены на `createTestUiRouter` — используют старый паттерн ручного создания контроллеров. Переход можно сделать постепенно, когда стори начнут использовать `this.ui`.
- 3 предсуществующих падающих теста не связаны с треком.
