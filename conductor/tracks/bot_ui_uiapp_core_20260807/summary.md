# Итоговый отчёт: `UiApp` в core + удаление `BotRouter` + доработка `publicActions`

> **Трек:** `bot_ui_uiapp_core_20260807`
> **Дата завершения:** 2026-08-07

## Цель

Заменить `BotRouter` на `UiApp` в core, добавить механизм `publicActions` + `getAction<T>(name)`, обновить `BotController.init()` и `BotUserStory`, подготовить инфраструктуру для следующих треков.

## Выполненные задачи

### Фаза 1: `UiApp` в core
- Создан `packages/core/src/ui/bot/ui-app.ts` — `UiApp<TAppMeta, TActor>` с полной маршрутизацией (бывший `BotRouter`), `MenuAggregator`, реестр `publicActions`, `getAction<T>(name)`
- 26 тестов в `ui-app.test.ts`

### Фаза 2: Обновление `BotController` и `BotUserStory`
- `BotController.init(appApi, uiApp)` — второй аргумент, `getStories()`, геттер `publicActions`
- `BotUserStory` — поле `uiApp`, геттер `ui` (временный, `any`), дефолтные `publicActions`

### Фаза 3: Обновление `apps/u7-bot`
- `connectRouter` → `connectUiApp` (`handlers/connect-ui-app.ts`)
- `U7BotUiApp extends UiApp<U7BotAppMeta, User>`
- `api-app.ts` разделён на `create-api-app.ts` + `create-ui-app.ts`
- `ui-actions.ts` удалён

### Фаза 4: Удаление `BotRouter`
- Удалены `bot-router.ts` и `bot-router.test.ts`
- Обновлены все импорты в тестах (интеграционные, E2E)

### Фаза 5: Качество
- `tsc --noEmit` чисто, `biome check` чисто
- core: 188/189 тестов (1 pre-existing failure)
- u7-bot: 62/62 тестов

## Созданные файлы

| Файл | Назначение |
|------|-----------|
| `packages/core/src/ui/bot/ui-app.ts` | `UiApp<TAppMeta, TActor>` — центральный хаб UI |
| `packages/core/src/ui/bot/ui-app.test.ts` | 26 тестов |
| `apps/u7-bot/src/handlers/connect-ui-app.ts` | Grammy-адаптер (бывший `router.ts`) |
| `apps/u7-bot/src/create-api-app.ts` | Фабрика `ApiApp` (выделена из `api-app.ts`) |
| `apps/u7-bot/src/create-ui-app.ts` | Фабрика `UiApp + контроллеры` (выделена из `api-app.ts`) |

## Удалённые файлы

| Файл | Причина |
|------|--------|
| `packages/core/src/ui/bot/router/bot-router.ts` | Функциональность перенесена в `UiApp` |
| `packages/core/src/ui/bot/router/bot-router.test.ts` | Тесты перенесены в `ui-app.test.ts` |
| `apps/u7-bot/src/api-app.ts` | Разделён на `create-api-app.ts` + `create-ui-app.ts` |
| `apps/u7-bot/src/ui-actions.ts` | Устарел (publicActions теперь в сторис) |

## Изменённые файлы

| Файл | Что изменено |
|------|-------------|
| `packages/core/src/ui/bot/controller/bot-controller.ts` | `init(appApi, uiApp)`, `getStories()`, геттер `publicActions` |
| `packages/core/src/ui/bot/bot-user-story.ts` | Поле `uiApp`, геттер `ui` (временный) |
| `packages/core/src/ui/index.ts` | Убран экспорт `bot-router` |
| `packages/core/src/ui/bot/types.ts` | Добавлен `UiCallbackFactory` |
| `apps/u7-bot/src/main.ts`, `u7-bot-controller.ts`, `u7-bot-user-story.ts` | Адаптированы под новый API |
| `tests/bot/helpers/test-app.ts` | Обновлены импорты |

## Принятые архитектурные решения

1. **`stories` protected с публичным `getStories()`** — чтобы не ломать контракты подклассов
2. **`publicActions` не абстрактный** (по умолчанию `{}`) — обратная совместимость
3. **`ui` геттер возвращает `any`** — временно, будет удалён после обновления конкретных сторис
4. **`#registerPublicActions()` собирает и с контроллера, и со сторис** — потому что `AppController.publicActions` объявлены на уровне контроллера

## Известные ограничения

- Конкретные доменные стори (stream, course, onboarding) всё ещё используют `this.ui.app.*` — они будут обновлены в Треках 3–7
- `safeConvert > blockquote` тест падает — pre-existing, не относится к треку
- Геттер `ui` на `any` с `// biome-ignore` — будет удалён после обновления сторис
