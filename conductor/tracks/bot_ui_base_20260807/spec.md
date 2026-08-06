# Спецификация: Перенос базовых классов и `U7BotAppMeta` в `u7-bot`

> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 1
> **Дорожная карта:** [development-roadmap.md](../../development-roadmap.md), Релиз 1

## Обзор

Создать фундамент в `apps/u7-bot` и разорвать циклическую зависимость `app ↔ onboarding`.

## Функциональные требования

1. Создать целевую структуру папок в `apps/u7-bot/src/` согласно целевой архитектуре.
2. Перенести `U7BotAppMeta` из `app/domain/u7-bot-app-meta.ts` → `apps/u7-bot/src/u7-bot-app-meta.ts`.
3. Перенести `U7BotController` из `app/ui/u7-bot-controller.ts` → `apps/u7-bot/src/u7-bot-controller.ts`.
4. Перенести `U7BotUserStory` из `app/ui/u7-bot-user-story.ts` → `apps/u7-bot/src/u7-bot-user-story.ts`.
5. Обновить `app/package.json` — убрать зависимости от `stream`, `course`, `onboarding`.
6. Обновить импорты во всех файлах, ссылающихся на старые пути.
7. После переноса: `app` зависит только от `core` (User, Role остаются в `app/domain/user.ts`).

## Нефункциональные требования

- `tsc --noEmit` проходит без ошибок
- `biome check` проходит
- Все существующие тесты проходят

## Критерии приёмки

- Циклическая зависимость `app ↔ onboarding` разорвана
- `app/package.json` не содержит `@u7-scl/stream`, `@u7-scl/course`, `@u7-scl/onboarding`
- Старые файлы удалены из `app/ui/` и `app/domain/u7-bot-app-meta.ts`
- Импорты по всем пакетам указывают на новые пути

## За рамками

- Изменения в доменной логике
- Изменения в `apps/u7-cli`
- Создание новых контроллеров/стори (только перенос существующих классов)
