# План реализации: Контроллер `streams` — «Потоки курсов»

> **Трек:** `bot_ui_streams_20260807`
> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 4
>
> **Зависимости:** `bot_ui_courses_20260807` (нужен `tree-renderer`)

---

## Фаза 1: Тесты (Red) — Тесты на текущее поведение

- [x] Task: Зафиксировать поведение `CatalogStory` и `ViewStreamStory` тестами
    - [x] Тест: S01 — витрина потоков с фильтрами
    - [x] Тест: S02 — карточка потока
    - [x] Тест: S03 — программа потока (дерево из contentSnapshot)
    - [x] Тест: S04 — детали потока
    - [x] Тест: кросс-ссылки (monitor, enroll, app)

## Фаза 2: Реализация (Green) — Перенос

- [x] Task: Создать `apps/u7-bot/src/streams/controller.ts`
    - [x] Класс `StreamsController extends U7BotController`
    - [x] Обработчик кнопки «📚 Потоки курсов»
- [x] Task: Перенести `stream-catalog.ts` (S01)
    - [x] Витрина потоков с фильтрами
    - [x] Заменить кросс-ссылки на `this.uiApp.getAction<T>(name)`
- [x] Task: Перенести `view-stream.ts` (S02-S04)
    - [x] S02: карточка потока
    - [x] S03: программа из contentSnapshot (через `tree-renderer.ts`)
    - [x] S04: детали потока
    - [x] Заменить кросс-ссылки: `cbFor(...)` → `this.uiApp.getAction<T>(name)` с try/catch-фолбеком
- [x] Task: Старые файлы сохранены для обратной совместимости тестов

## Фаза 3: Рефакторинг

- [x] Task: Проверить чистоту переноса
    - [x] Нет импортов story из `packages/stream/src/ui/bot/`
    - [x] Все кросс-ссылки через `this.uiApp.getAction<T>(name)`
    - [x] `tree-renderer.ts` используется для S03 без модификаций

## Фаза 4: Проверка качества и документация

- [x] Task: Прогнать полную проверку качества
    - [x] `bun run check` — biome + tsc + тесты (294 pass / 0 fail)
- [x] Task: Создать `apps/u7-bot/src/streams/ui-spec.md`
