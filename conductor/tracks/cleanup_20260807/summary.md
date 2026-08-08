# Итоговый отчёт — Трек 8: Зачистка и обновление документации

**Дата:** 2026-08-08

## Цель

Финальный трек рефакторинга Bot UI (Релиз 1). Удалить весь старый UI-код, оставшийся в доменных пакетах, обновить документацию, проверить целостность проекта.

## Выполненные задачи

### Фаза 1: Удаление старого кода

- Удалены UI-директории:
  - `packages/stream/src/ui/` — stories, ui-spec.md
  - `packages/onboarding/src/ui/types.ts`
  - `packages/app/src/ui/favicon.svg`
- `packages/course/src/ui/` — уже отсутствовала
- `packages/app/src/domain/u7-bot-app-meta.ts` — уже отсутствовал
- Обновлены `package.json` exports:
  - `packages/stream/package.json` — убран `./ui/bot/controller/stream-controller`
  - `packages/course/package.json` — убран `./ui`
  - `packages/onboarding/package.json` — UI-экспортов не было
  - `packages/app/package.json` — уже чист
- Обновлён `tsconfig.json` — убраны paths для удалённых директорий
- Обновлён корневой `package.json` — скрипт `test:bot`
- Исправлены импорты `KeyboardDescription`, `MessageDescription` в onboarding controller
- Добавлен тип `MessageDescription` в `packages/core/src/ui/bot/types.ts`

### Фаза 2: Обновление документации

- **`conductor/code_styleguides/architecture.md`** — убран `ui/` из структуры доменных модулей, обновлены exports, направление зависимостей
- **`conductor/code_styleguides/skills/bot-controller.md`** — иерархия контроллеров обновлена на `apps/u7-bot`
- **`conductor/code_styleguides/skills/bot-user-story.md`** — пути к stories, структура файлов, `uiApp.getAction<T>(name)`
- **`conductor/index.md`** — все ссылки проверены, живые
- **`packages/core/src/ui/bot/README.md`** — правила навигации актуальны
- **`ui-spec.md`** разделён на 4 файла:
  - `apps/u7-bot/src/controllers/courses/ui-spec.md` (S00)
  - `apps/u7-bot/src/controllers/streams/ui-spec.md` (S01–S04, S09–S10)
  - `apps/u7-bot/src/controllers/learning/ui-spec.md` (S05–S06)
  - `apps/u7-bot/src/controllers/mentor/ui-spec.md` (S07–S08)
- **`apps/u7-bot/README.md`** — создан, описывает структуру, контроллеры, соглашения

### Фаза 3: Финальная проверка

- `bun run lint` (biome) — чисто (только warnings)
- `bun run tslint` (tsc --noEmit) — чисто
- `bun test` — 1319 pass, 10 fail (все предсуществующие, не связаны с треком)

## Изменённые файлы

### Удалены
- `packages/stream/src/ui/` (целиком: 6 story-файлов, ui-spec.md)
- `packages/onboarding/src/ui/types.ts`
- `packages/app/src/ui/favicon.svg`
- `packages/app/src/ui/index.ts`
- `packages/app/src/ui/ui-components.test.ts`
- `packages/app/src/app-init.test.ts`
- `packages/app/src/domain/domain-types.test.ts`

### Созданы
- `apps/u7-bot/src/controllers/courses/ui-spec.md`
- `apps/u7-bot/src/controllers/streams/ui-spec.md`
- `apps/u7-bot/src/controllers/learning/ui-spec.md`
- `apps/u7-bot/src/controllers/mentor/ui-spec.md`
- `apps/u7-bot/README.md`

### Изменены
- `packages/stream/package.json`
- `packages/course/package.json`
- `packages/onboarding/src/index.ts`
- `packages/core/src/ui/bot/types.ts`
- `apps/u7-bot/src/controllers/onboarding/controller.ts`
- `apps/u7-bot/src/controllers/onboarding/controller.test.ts`
- `tsconfig.json`
- `package.json` (корневой)
- `conductor/code_styleguides/architecture.md`
- `conductor/code_styleguides/skills/bot-controller.md`
- `conductor/code_styleguides/skills/bot-user-story.md`
- `conductor/tracks.md`
- `conductor/tracks/cleanup_20260807/plan.md`

## Архитектурные решения

- **`MessageDescription` перенесён в `packages/core/src/ui/bot/types.ts`** — был в `packages/onboarding/src/ui/types.ts`, используется в onboarding controller тестах
- **Импорты `KeyboardDescription` и `MessageDescription`** теперь из `@u7-scl/core/ui` вместо `@u7-scl/onboarding`
- **`ui-spec.md` разделён по контроллерам** — каждый контроллер в `apps/u7-bot` теперь имеет свой ui-spec

## Отклонения от плана

- `packages/course/src/ui/` — уже была удалена до трека
- `packages/app/src/domain/u7-bot-app-meta.ts` — уже был удалён до трека
- `packages/app/package.json` — уже был чист (предыдущая работа в параллельной ветке)
- User Manual Verification — пропущена по указанию пользователя («без остановок»)

## Известные ограничения

- 10 предсуществующих падений тестов (8 E2E/интеграционных + 2 unit), не связанных с треком
