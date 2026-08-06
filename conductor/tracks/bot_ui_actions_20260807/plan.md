# План реализации: ActionFactory — `UiActions` и `UiRegistry`

> **Трек:** `bot_ui_actions_20260807`
> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 2
>
> **Зависимости:** `bot_ui_base_20260807`

---

## Фаза 1: Тесты (Red) — Типы и базовые тесты

- [x] Task: Написать тесты на `UiActions` и `UiRegistry`
    - [x] Тест: `ControllerActions` выводит правильный тип из контроллера
    - [x] Тест: `UiRegistry` объединяет несколько контроллеров
    - [x] Тест: вызов `this.ui.controller.story.action()` возвращает правильный callback-код
    - [x] Тест: пустой контроллер, стори без действий, граничные случаи
- [~] Task: Conductor - User Manual Verification 'Фаза 1: Тесты' (пропущено — автоматический режим)

## Фаза 2: Реализация (Green) — Инфраструктура

- [x] Task: Добавить поле `ui` в `BotUserStory` (core)
    - [x] Поле `ui: unknown` в базовом классе
    - [x] Метод `initUi(ui)` для инжекции
- [x] Task: Создать `apps/u7-bot/src/ui-actions.ts`
    - [x] Тип `ControllerActions<C>` — извлекает публичные действия контроллера
    - [x] Тип `UiRegistry` — отображает имена контроллеров на `ControllerActions`
    - [x] Функция `createUiRegistry(controllers)` — собирает реестр
    - [x] Тип `StoryPublicActions` и `UiCallbackFactory`
    - [x] Интерфейс `HasPublicActions` для минимального контракта
- [x] Task: Реализовать `publicActions` в `BotController` (core)
    - [x] Геттер `get publicActions()` — собирает действия со всех стори
    - [x] Метод `initUi(registry)` — пробрасывает реестр всем стори
- [x] Task: Обновить `BotRouter.init()` (core) — опциональный параметр `uiRegistry`
- [x] Task: Интегрировать `createUiRegistry` в `api-app.ts`
- [~] Task: Conductor - User Manual Verification 'Фаза 2: Реализация' (пропущено — автоматический режим)

## Фаза 3: Рефакторинг

- [x] Task: Упростить типы и проверить граничные случаи
    - [x] Пустой контроллер (без стори)
    - [x] Стори без публичных действий
    - [x] Контроллер с одной стори
- [~] Task: Conductor - User Manual Verification 'Фаза 3: Рефакторинг' (пропущено — автоматический режим)

## Фаза 4: Проверка качества и документация

- [x] Task: Прогнать полную проверку качества
    - [x] `bun run lint` — 0 ошибок
    - [x] `bun run tslint` — 0 ошибок
    - [x] `bun test` — 3 предсуществующих падающих теста (не связаны с треком)
    - [x] Новые тесты: `ui-actions.test.ts` (10 тестов), `bot-user-story.test.ts` (+4), `bot-controller.test.ts` (+7)
- [~] Task: Обновить документацию
    - [~] `code_styleguides/skills/bot-user-story.md` — поле `ui` и `publicActions`
    - [~] `code_styleguides/skills/bot-controller.md` — `publicActions`, `initUi`
- [~] Task: Conductor - User Manual Verification 'Фаза 4: Качество' (пропущено — автоматический режим)
