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

## Фаза 2: Layer-based exports и миграция `@u7/user`

- [ ] Task: Создать слойные index.ts для `@u7/user`
    - [ ] Создать `src/domain/index.ts` — ре-экспорт entity, a-root, policy, roles, repo, types, errors, commands
    - [ ] Создать `src/api/index.ts` — ре-экспорт module, use-cases
    - [ ] Создать `src/ui/index.ts` — ре-экспорт auto-ui
    - [ ] Создать `src/infra/index.ts` — ре-экспорт db

- [ ] Task: Настроить exports и imports в `packages/user/package.json`
    - [ ] Добавить `exports`: `./domain`, `./api`, `./ui`, `./infra`
    - [ ] Добавить `imports`: `#domain/*`, `#api/*`, `#ui/*`, `#infra/*`

- [ ] Task: Обновить корневой `tsconfig.json`
    - [ ] Добавить paths: `@u7/user/domain`, `@u7/user/api`, `@u7/user/ui`, `@u7/user/infra`

- [ ] Task: Заменить импорты `@u7/core` на слойные
    - [ ] `a-root.ts`: `@u7/core` → `@u7/core/domain`
    - [ ] `entity.ts`: `@u7/core` → разделить на domain и shared
    - [ ] `commands/errors.ts`: `@u7/core` → `@u7/core/domain`
    - [ ] Все use-case файлы: `@u7/core` → `@u7/core/api`
    - [ ] `api/module.ts`: `@u7/core` → `@u7/core/api`
    - [ ] `ui/auto-ui/module.ts`: `@u7/core` → `@u7/core/ui`

- [ ] Task: Заменить внутренние относительные импорты на `#`-импорты
    - [ ] `api/module.ts`: `../domain/...` → `#domain/...`
    - [ ] Все use-case: `../../domain/...` → `#domain/...`
    - [ ] `domain/user/a-root.ts`: `./commands/...` → `#domain/user/commands/...`, `./entity` → `#domain/user/entity`

- [ ] Task: Проверить прохождение тестов и типов
    - [ ] `cd packages/user && bun test`
    - [ ] `bun run typecheck`

- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Документирование

- [ ] Task: Добавить раздел «Layer-based импорты» в `conductor/code_styleguides/architecture.md`
    - [ ] Схема слоёв и направление зависимостей
    - [ ] Инструкция по настройке `exports`/`imports` для пакетов
    - [ ] Примеры внешних и внутренних импортов
    - [ ] Правила для `ui/web` vs `ui/auto-ui`

- [ ] Task: Обновить `conductor/product-guidelines.md`
    - [ ] Добавить ссылку на раздел «Layer-based импорты» в сводке architecture.md

- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)
