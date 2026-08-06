# План реализации: Контроллер `streams` — «Потоки курсов»

> **Трек:** `bot_ui_streams_20260807`
> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 5
>
> **Зависимости:** `bot_ui_courses_20260807` (нужен `tree-renderer`)

---

## Фаза 1: Тесты (Red) — Тесты на текущее поведение

- [ ] Task: Зафиксировать поведение `CatalogStory` и `ViewStreamStory` тестами
    - [ ] Тест: S01 — витрина потоков с фильтрами
    - [ ] Тест: S02 — карточка потока
    - [ ] Тест: S03 — программа потока (дерево из contentSnapshot)
    - [ ] Тест: S04 — детали потока
    - [ ] Тест: кросс-ссылки (monitor, enroll, app)
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Тесты' (Protocol in workflow.md)

## Фаза 2: Реализация (Green) — Перенос

- [ ] Task: Создать `apps/u7-bot/src/streams/controller.ts`
    - [ ] Класс `StreamsController extends U7BotController`
    - [ ] Обработчик кнопки «📚 Потоки курсов»
- [ ] Task: Перенести `stream-catalog.ts` (S01)
    - [ ] Витрина потоков с фильтрами
    - [ ] Заменить кросс-ссылки на `this.ui.*`
- [ ] Task: Перенести `view-stream.ts` (S02-S04)
    - [ ] S02: карточка потока
    - [ ] S03: программа из contentSnapshot (через `tree-renderer.ts`)
    - [ ] S04: детали потока
    - [ ] Заменить кросс-ссылки: `cbFor('monitor', ...)` → `this.ui.mentor.monitor.students(streamId)`
    - [ ] Заменить кросс-ссылки: `cbFor('enroll', ...)` → `this.ui.learning.enroll.start(streamId)`
- [ ] Task: Удалить старые файлы
    - [ ] `packages/stream/src/ui/bot/catalog.story.ts`
    - [ ] `packages/stream/src/ui/bot/view-stream.story.ts`
    - [ ] `packages/stream/src/ui/bot/stream-controller.ts`
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Реализация' (Protocol in workflow.md)

## Фаза 3: Рефакторинг

- [ ] Task: Проверить чистоту переноса
    - [ ] Нет импортов story из `packages/stream/src/ui/bot/`
    - [ ] Все кросс-ссылки через `this.ui.*`
    - [ ] `tree-renderer.ts` используется для S03 без модификаций
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Рефакторинг' (Protocol in workflow.md)

## Фаза 4: Проверка качества и документация

- [ ] Task: Прогнать полную проверку качества
    - [ ] `bun run check` — biome + tsc + тесты
    - [ ] `bun test --coverage` — покрытие >80%
- [ ] Task: Создать `apps/u7-bot/src/streams/ui-spec.md`
- [ ] Task: Conductor - User Manual Verification 'Фаза 4: Качество' (Protocol in workflow.md)
