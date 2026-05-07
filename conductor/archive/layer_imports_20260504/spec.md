# Спецификация: Layer-based импорты

### Обзор
Реорганизовать структуру импортов/экспортов пакетов `@u7/core` и `@u7/user` на послойную (layer-based) архитектуру в соответствии с DDD. Вместо плоских импортов уровня пакета (`@u7/core`) ввести точки входа по слоям: `@u7/core/domain`, `@u7/core/api`, `@u7/core/ui`.

Для внешних потребителей каждый слой предоставляет единственную точку входа (barrel export) — например `@u7/core/domain`. Внутри пакета используются приватные импорты через `#domain/...`.

### Функциональные требования

**FT-1: Layer-based exports через package.json**
- Каждый пакет (`@u7/core`, `@u7/user`) определяет поле `exports` в `package.json` с субпутями:
  - `./domain` → `./src/domain/index.ts` (barrel export для слоя)
  - `./api` → `./src/api/index.ts`
  - `./ui` → `./src/ui/index.ts`
  - `./shared` → `./src/shared/index.ts` (только для `@u7/core`)
  - `./infra` → `./src/infra/index.ts` (только для `@u7/user`)
- Каждый слой имеет `index.ts`, ре-экспортирующий все публичные классы/типы слоя.

**FT-2: Внутренние импорты через `imports`**
- Каждый пакет определяет поле `imports` в `package.json`:
  - `#domain/*` → `./src/domain/*.ts`
  - `#api/*` → `./src/api/*.ts`
  - `#ui/*` → `./src/ui/*.ts`
  - `#shared/*` → `./src/shared/*.ts` (при наличии)
  - `#infra/*` → `./src/infra/*.ts` (при наличии)
- Внутренние импорты внутри пакета используют префикс `#`: `import { Aggregate } from '#domain/ar/aggregate'`.

**FT-3: Правила кросс-слойных импортов**
- Зависимости слоёв: `shared` → `domain` → (`api`, `ui`).
- `domain` не импортирует `api` или `ui`.
- `api` может импортировать `domain`.
- `ui/web` (браузерный) не импортирует `api`.
- `ui/auto-ui` (бот, консоль) может импортировать `api`.
- Правила документируются в `conductor/code_styleguides/architecture.md`.

**FT-4: Документирование решения**
- Обновить `conductor/code_styleguides/architecture.md`: добавить раздел «Layer-based импорты» с описанием:
  - Схема слоёв и направление зависимостей.
  - Как настраивать `exports` и `imports` для новых пакетов.
  - Примеры внешних (`@u7/core/domain`) и внутренних (`#domain/ar/aggregate`) импортов.
  - Правила для `ui/web` vs `ui/auto-ui`.
- Обновить `conductor/product-guidelines.md`: добавить ссылку на раздел «Layer-based импорты» в сводке `architecture.md`.

**FT-5: Миграция существующего кода**
- Все плоские импорты `@u7/core` заменяются на соответствующие layer-based импорты (`@u7/core/domain`, `@u7/core/api`, `@u7/core/ui`, `@u7/core/shared`).
- Внутренние импорты внутри пакетов меняются с относительных путей на `#domain/...`, `#api/...` и т.д.
- Пакет `@u7/user` мигрируется с аналогичной структурой.

### Нефункциональные требования
- TypeScript 5.x+ — нативные `exports`/`imports` без дополнительных `paths` в tsconfig.
- Bun runtime — полная поддержка `exports`/`imports`.
- Минимальное изменение структуры файлов — только `package.json`, `index.ts` и пути импортов.

### Критерии приёмки
- [ ] `bun test` проходит для всех пакетов после миграции.
- [ ] `bun run typecheck` без ошибок.
- [ ] Внешний импорт: `import { UseCase } from '@u7/core/domain'` работает.
- [ ] Внутренний импорт: `import { UseCase } from '#api/uc/use-case'` работает внутри `@u7/core`.
- [ ] Ни одного плоского импорта `@u7/core` не осталось в кодовой базе.
- [ ] Правила слоёв зафиксированы в `code_styleguides/architecture.md`.
- [ ] Решение задокументировано в `architecture.md` и `product-guidelines.md`.

### За рамками
- Автоматическая проверка кросс-слойных импортов (ESLint) — будет в отдельном треке.
- Создание слоя `ui` для пакетов, где его ещё нет.
- Миграция других пакетов (кроме `core` и `user`).
