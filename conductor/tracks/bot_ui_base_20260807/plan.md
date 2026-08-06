# План реализации: Перенос базовых классов в `u7-bot`

> **Трек:** `bot_ui_base_20260807`
> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 1

---

## Фаза 1: Тесты (Red) — Подготовка и тесты на текущее поведение

- [x] Task: Зафиксировать текущее поведение тестами перед переносом
    - [x] Проверить, что `U7BotAppMeta` корректно импортируется из `app/domain/`
    - [x] Проверить, что `U7BotController` доступен из `app/ui/`
    - [x] Проверить, что `U7BotUserStory` доступен из `app/ui/`
    - [x] Проверить отсутствие циклических импортов через `tsc --noEmit`
- [~] Task: Conductor - User Manual Verification 'Фаза 1: Тесты' (пропущено — автоматический режим)

## Фаза 2: Реализация (Green) — Перенос файлов и обновление импортов

- [x] Task: Создать целевую структуру папок в `apps/u7-bot/src/`
    - [x] Создать `apps/u7-bot/src/u7-bot-controller.ts` (перенос из `packages/app/src/ui/`)
    - [x] Создать `apps/u7-bot/src/u7-bot-user-story.ts` (перенос из `packages/app/src/ui/`)
    - [x] Создать `apps/u7-bot/src/u7-bot-app-meta.ts` (перенос из `packages/app/src/domain/`)
- [x] Task: Обновить `packages/app/package.json`
    - [x] Убрать зависимости от `@u7-scl/stream`
    - [x] Убрать зависимости от `@u7-scl/course`
    - [x] Убрать зависимости от `@u7-scl/onboarding`
    - [x] Добавить зависимость от `@u7-scl/bot`
- [x] Task: Обновить импорты во всех файлах, ссылающихся на старые пути
    - [x] Найти все импорты из `@u7-scl/app/ui/` и заменить на `@u7-scl/bot/u7-bot-*`
    - [x] Найти все импорты `U7BotAppMeta`/`U7BotApp` из `@u7-scl/app/domain/` и заменить на `@u7-scl/bot/u7-bot-app-meta`
    - [x] Обновить `tsconfig.json` — добавить алиасы для `@u7-scl/bot/*`
    - [x] Обновить `apps/u7-bot/package.json` — добавить зависимость `@u7-scl/app`
- [x] Task: Удалить старые файлы
    - [x] Удалить `packages/app/src/ui/u7-bot-controller.ts`
    - [x] Удалить `packages/app/src/ui/u7-bot-user-story.ts`
    - [x] Удалить `packages/app/src/domain/u7-bot-app-meta.ts`
    - [x] Перенести `u7-bot-user-story.test.ts` в `apps/u7-bot/src/`
- [~] Task: Conductor - User Manual Verification 'Фаза 2: Реализация' (пропущено — автоматический режим)

## Фаза 3: Рефакторинг

- [x] Task: Проверить чистоту переноса
    - [x] Убедиться, что `app` импортирует только `core` и `user`
    - [x] Убедиться, что ни один доменный модуль не импортирует `app/ui/`
    - [x] Проверить отсутствие неиспользуемых импортов в затронутых файлах (biome organizeImports)
- [~] Task: Conductor - User Manual Verification 'Фаза 3: Рефакторинг' (пропущено — автоматический режим)

## Фаза 4: Проверка качества и документация

- [x] Task: Прогнать полную проверку качества
    - [x] `bun run lint` — 0 ошибок
    - [x] `bun run tslint` — 0 ошибок
    - [x] `bun test` — 3 предсуществующих падающих теста (не связаны с треком)
    - [x] Тесты `app`: 50 pass, 0 fail
    - [x] Тесты `u7-bot`: 50 pass, 0 fail
- [~] Task: Обновить документацию
    - [~] Проверить `conductor/code_styleguides/architecture.md` — будет обновлено в треке 3 (полный перенос)
- [~] Task: Conductor - User Manual Verification 'Фаза 4: Качество' (пропущено — автоматический режим)
