# Итоговый отчёт: Перенос базовых классов и U7BotAppMeta в u7-bot

> **Трек:** `bot_ui_base_20260807`
> **Релиз:** 1 — Новый Bot UI

## Цель

Создать фундамент в `apps/u7-bot` и разорвать циклическую зависимость `app ↔ onboarding`.

## Выполненные задачи

### Фаза 1: Тесты
- Проверено текущее состояние: `tsc --noEmit` проходит, тесты app и u7-bot работают

### Фаза 2: Перенос
- `U7BotController` → `apps/u7-bot/src/u7-bot-controller.ts`
- `U7BotUserStory` → `apps/u7-bot/src/u7-bot-user-story.ts`
- `U7BotAppMeta` → `apps/u7-bot/src/u7-bot-app-meta.ts`
- Тест `u7-bot-user-story.test.ts` перенесён вместе с классом
- Старые файлы удалены из `packages/app/src/ui/` и `packages/app/src/domain/`

### Фаза 3: Обновление импортов
- Обновлены импорты в ~40 файлах (stream, course, onboarding, tests)
- Добавлены алиасы `@u7-scl/bot/*` в `tsconfig.json`
- `packages/app/package.json`: убраны stream, course, onboarding; добавлен `@u7-scl/bot`

### Фаза 4: Качество
- `tsc --noEmit` — 0 ошибок
- `biome check` — 0 ошибок
- Тесты `app`: 50 pass, 0 fail
- Тесты `u7-bot`: 50 pass, 0 fail

## Изменённые файлы

- `apps/u7-bot/src/u7-bot-controller.ts` (создан)
- `apps/u7-bot/src/u7-bot-user-story.ts` (создан)
- `apps/u7-bot/src/u7-bot-app-meta.ts` (создан)
- `apps/u7-bot/src/u7-bot-user-story.test.ts` (создан)
- `apps/u7-bot/package.json`
- `tsconfig.json`
- `packages/app/package.json`
- `packages/app/src/domain/index.ts`
- `packages/app/src/domain/domain-types.test.ts`
- `packages/app/src/ui/index.ts`
- `packages/app/src/ui/ui-components.test.ts`
- `packages/app/src/ui/app-controller.ts`
- `packages/app/src/ui/stories/community.story.ts`
- ~30 файлов в stream/course/onboarding/tests (импорты)

Удалены:
- `packages/app/src/ui/u7-bot-controller.ts`
- `packages/app/src/ui/u7-bot-user-story.ts`
- `packages/app/src/ui/u7-bot-user-story.test.ts`
- `packages/app/src/domain/u7-bot-app-meta.ts`

## Архитектурные решения

1. **Зависимость `app → bot`** возникла как временное состояние: `AppController` и `CommunityStory` всё ещё в `packages/app`, но импортируют `U7BotController`/`U7BotUserStory` из `@u7-scl/bot`. Разрешится в Треке 3 (перенос AppController).

2. **`User` и `Role` оставлены в `packages/app/src/domain/user.ts`** — они используются слишком широко, перенос преждевременен.

## Известные ограничения

- 3 предсуществующих падающих теста не связаны с треком (`safeConvert`, `StudentAr.isLaggingFromMedian`, `MonitorStory.Сортировка`)
