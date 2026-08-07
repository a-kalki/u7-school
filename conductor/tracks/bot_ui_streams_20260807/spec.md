# Спецификация: Контроллер `streams` — «Потоки курсов»

> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 4
> **Дорожная карта:** [development-roadmap.md](../../development-roadmap.md), Релиз 1
>
> **Зависимости:** Трек 3 (bot_ui_courses_20260807 — нужен `tree-renderer`)

## Обзор

Перенос `CatalogStory` + `ViewStreamStory` из `packages/stream/src/ui/bot/` в новый контроллер `streams`. Экраны S01-S04.

## Функциональные требования

1. Создать `apps/u7-bot/src/streams/controller.ts` — `StreamsController`.
2. Создать `apps/u7-bot/src/streams/ui-spec.md` — документация экранов.
3. Перенести `stream-catalog.ts` (S01: витрина потоков с фильтрами).
4. Перенести `view-stream.ts` (S02: карточка потока, S03: программа из contentSnapshot, S04: детали).
5. Использовать `shared/tree-renderer.ts` для S03.
6. Заменить все кросс-ссылки на `this.uiApp.getAction<T>(name)`.
7. Перенести тесты в `apps/u7-bot/tests/streams/`.

## Нефункциональные требования

- Все тесты проходят
- `tsc --noEmit` и `biome check` проходят

## Критерии приёмки

- Кнопка «📚 Потоки курсов» работает как раньше
- S01: витрина потоков с фильтрами
- S02: карточка потока
- S03: программа потока (дерево из contentSnapshot)
- S04: детали потока
- Кросс-ссылки `this.uiApp.getAction<MonitorActions>('students')(streamId)` работают (после Трека 6)
- Кросс-ссылки `this.uiApp.getAction<EnrollActions>('start')(streamId)` работают (после Трека 5)
- Старые `CatalogStory` и `ViewStreamStory` удалены из `packages/stream/src/ui/bot/`

## За рамками

- Mentor-стори (Трек 7)
- Learning-стори (Трек 6)
