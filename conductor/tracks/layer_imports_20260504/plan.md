# План реализации: Layer-based импорты

## Фаза 1: Layer-based exports для `@u7/core` [checkpoint: 57f593f]

- [x] Task: Создать слойные index.ts (barrel exports)
    - [x] Создать `src/domain/index.ts` — ре-экспорт aggregate, errors, module/types
    - [x] Создать `src/api/index.ts` — ре-экспорт module, use-case
    - [x] Создать `src/ui/index.ts` — ре-экспорт auto-ui, ui-base
    - [x] Создать `src/shared/index.ts` — ре-экспорт iso-now

- [x] Task: Настроить exports и imports в `packages/core/package.json`
    - [x] Добавить `exports`: `./domain`, `./api`, `./ui`, `./shared`
    - [x] Добавить `imports`: `#domain/*`, `#api/*`, `#ui/*`, `#shared/*`

- [x] Task: Обновить корневой `tsconfig.json`
    - [x] Добавить paths: `@u7/core/domain`, `@u7/core/api`, `@u7/core/ui`, `@u7/core/shared`
    - [x] Сохранить `@u7/core` для обратной совместимости

- [x] Task: Заменить внутренние относительные импорты на `#`-импорты
    - [x] `src/api/module/module.ts`: `../../domain/...` → `#domain/...`, `../uc/...` → `#api/uc/...`
    - [x] `src/api/uc/use-case.ts`: `../../domain/...` → `#domain/...`
    - [x] `src/domain/ar/aggregate.ts`: `../errors/...` → `#domain/errors/...`
    - [x] `src/ui/auto-ui/auto-ui-app.ts`: `../../domain/...` → `#domain/...`, `../ui-base/...` → `#ui/ui-base/...`
    - [x] Все тестовые файлы: аналогичная замена

- [x] Task: Обновить корневой `src/index.ts`
    - [x] Заменить прямые пути на импорты из слойных index.ts

- [x] Task: Проверить прохождение тестов и типов
    - [x] `cd packages/core && bun test`
    - [x] `bun run typecheck`

- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: Layer-based exports и миграция `@u7/user` [checkpoint: 534f0df]

- [x] Task: Создать слойные index.ts для `@u7/user`
    - [x] Создать `src/domain/index.ts` — ре-экспорт entity, a-root, policy, roles, repo, types, errors, commands
    - [x] Создать `src/api/index.ts` — ре-экспорт module, use-cases
    - [x] Создать `src/ui/index.ts` — ре-экспорт auto-ui
    - [x] Создать `src/infra/index.ts` — ре-экспорт db

- [x] Task: Настроить exports и imports в `packages/user/package.json`
    - [x] Добавить `exports`: `./domain`, `./api`, `./ui`, `./infra`
    - [x] Добавить `imports`: `#domain/*`, `#api/*`, `#ui/*`, `#infra/*`

- [x] Task: Обновить корневой `tsconfig.json`
    - [x] Добавить paths: `@u7/user/domain`, `@u7/user/api`, `@u7/user/ui`, `@u7/user/infra`

- [x] Task: Заменить импорты `@u7/core` на слойные
    - [x] `a-root.ts`: `@u7/core` → `@u7/core/domain` + `@u7/core/shared`
    - [x] `entity.ts`: `@u7/core` → разделить на domain и shared
    - [x] `commands/errors.ts`: `@u7/core` → `@u7/core/domain`
    - [x] Все use-case файлы: `@u7/core` → `@u7/core/domain` или `@u7/core/api`
    - [x] `api/module.ts`: `@u7/core` → `@u7/core/api`
    - [x] `ui/auto-ui/module.ts`: `@u7/core` → `@u7/core/ui`

- [x] Task: Заменить внутренние относительные импорты на `#`-импорты
    - [x] `api/module.ts`: `../domain/...` → `#domain/...`
    - [x] Все use-case: `../../domain/...` → `#domain/...`
    - [x] `domain/user/a-root.ts`: `./commands/...` → `#domain/user/commands/...`, `./entity` → `#domain/user/entity`

- [~] Task: Проверить прохождение тестов и типов
    - [ ] `cd packages/user && bun test`
    - [ ] `bun run typecheck`

- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Документирование

- [x] Task: Добавить раздел «Layer-based импорты» в `conductor/code_styleguides/architecture.md`
    - [x] Схема слоёв и направление зависимостей
    - [x] Инструкция по настройке `exports`/`imports` для пакетов
    - [x] Примеры внешних и внутренних импортов
    - [x] Правила для `ui/web` vs `ui/auto-ui`

- [x] Task: Обновить `conductor/product-guidelines.md`
    - [x] Добавить ссылку на раздел «Layer-based импорты» в сводке architecture.md

- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)
