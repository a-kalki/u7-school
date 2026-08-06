# План реализации: ActionFactory — `UiActions` и `UiRegistry`

> **Трек:** `bot_ui_actions_20260807`
> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 2
>
> **Зависимости:** `bot_ui_base_20260807`

---

## Фаза 1: Тесты (Red) — Типы и базовые тесты

- [ ] Task: Написать тесты на `UiActions` и `UiRegistry`
    - [ ] Тест: `ControllerActions` выводит правильный тип из контроллера
    - [ ] Тест: `UiRegistry` объединяет несколько контроллеров
    - [ ] Тест: вызов `this.ui.controller.story.action()` возвращает правильный callback-код
    - [ ] Тест: TypeScript не компилируется при вызове несуществующего действия
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Тесты' (Protocol in workflow.md)

## Фаза 2: Реализация (Green) — Инфраструктура

- [ ] Task: Добавить поле `ui` в `BotUserStory` (core)
    - [ ] Поле `ui: unknown` в базовом классе
    - [ ] Метод `init(ui)` для инжекции
- [ ] Task: Создать `apps/u7-bot/src/ui-actions.ts`
    - [ ] Тип `ControllerActions<C>` — извлекает публичные действия контроллера
    - [ ] Тип `UiRegistry` — отображает имена контроллеров на `ControllerActions`
    - [ ] Функция `createUiRegistry(controllers)` — собирает реестр
- [ ] Task: Реализовать `publicActions` в базовом шаблоне
    - [ ] Создать пример стори с `get publicActions()`
    - [ ] Создать пример контроллера, собирающего `publicActions` своих стори
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Реализация' (Protocol in workflow.md)

## Фаза 3: Рефакторинг

- [ ] Task: Упростить типы и проверить граничные случаи
    - [ ] Пустой контроллер (без стори)
    - [ ] Стори без публичных действий
    - [ ] Контроллер с одной стори
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Рефакторинг' (Protocol in workflow.md)

## Фаза 4: Проверка качества и документация

- [ ] Task: Прогнать полную проверку качества
    - [ ] `bun run check` — biome + tsc + тесты
    - [ ] `bun test --coverage` — покрытие >80%
- [ ] Task: Обновить документацию
    - [ ] `conductor/code_styleguides/skills/bot-user-story.md` — поле `ui` и `publicActions`
    - [ ] `conductor/code_styleguides/skills/bot-controller.md` — иерархия, `publicActions`
- [ ] Task: Conductor - User Manual Verification 'Фаза 4: Качество' (Protocol in workflow.md)
