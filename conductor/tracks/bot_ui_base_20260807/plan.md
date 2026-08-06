# План реализации: Перенос базовых классов в `u7-bot`

> **Трек:** `bot_ui_base_20260807`
> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 1

---

## Фаза 1: Тесты (Red) — Подготовка и тесты на текущее поведение

- [ ] Task: Зафиксировать текущее поведение тестами перед переносом
    - [ ] Проверить, что `U7BotAppMeta` корректно импортируется из `app/domain/`
    - [ ] Проверить, что `U7BotController` доступен из `app/ui/`
    - [ ] Проверить, что `U7BotUserStory` доступен из `app/ui/`
    - [ ] Проверить отсутствие циклических импортов через `tsc --noEmit`
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Тесты' (Protocol in workflow.md)

## Фаза 2: Реализация (Green) — Перенос файлов и обновление импортов

- [ ] Task: Создать целевую структуру папок в `apps/u7-bot/src/`
    - [ ] Создать `apps/u7-bot/src/u7-bot-controller.ts` (перенос из `app/ui/`)
    - [ ] Создать `apps/u7-bot/src/u7-bot-user-story.ts` (перенос из `app/ui/`)
    - [ ] Создать `apps/u7-bot/src/u7-bot-app-meta.ts` (перенос из `app/domain/`)
- [ ] Task: Обновить `app/package.json`
    - [ ] Убрать зависимости от `@u7-scl/stream`
    - [ ] Убрать зависимости от `@u7-scl/course`
    - [ ] Убрать зависимости от `@u7-scl/onboarding`
- [ ] Task: Обновить импорты во всех файлах, ссылающихся на старые пути
    - [ ] Найти все импорты из `app/ui/` и заменить на `apps/u7-bot/src/`
    - [ ] Найти все импорты `U7BotAppMeta` из `app/domain/` и заменить
    - [ ] Обновить `package.json` exports в затронутых пакетах
- [ ] Task: Удалить старые файлы
    - [ ] Удалить `app/ui/u7-bot-controller.ts`
    - [ ] Удалить `app/ui/u7-bot-user-story.ts`
    - [ ] Удалить `app/domain/u7-bot-app-meta.ts`
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Реализация' (Protocol in workflow.md)

## Фаза 3: Рефакторинг

- [ ] Task: Проверить чистоту переноса
    - [ ] Убедиться, что `app` импортирует только `core`
    - [ ] Убедиться, что ни один доменный модуль не импортирует `app/ui/`
    - [ ] Проверить отсутствие неиспользуемых импортов в затронутых файлах
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Рефакторинг' (Protocol in workflow.md)

## Фаза 4: Проверка качества и документация

- [ ] Task: Прогнать полную проверку качества
    - [ ] `bun run check` — biome + tsc + тесты
    - [ ] `bun test --coverage` — покрытие >80%
- [ ] Task: Обновить документацию
    - [ ] Проверить `conductor/code_styleguides/architecture.md` — структура пакетов
- [ ] Task: Conductor - User Manual Verification 'Фаза 4: Качество' (Protocol in workflow.md)
