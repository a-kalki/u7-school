# Итоговый отчёт трека ui-proactive-sender_20260816

## Цель

Прокинуть `ProactiveSender` по цепочке `transport → BotUiApp → BotController → BotUiStory`: каждый уровень реализует `ProactiveSender` и передаёт себя дочернему уровню через `init` отдельным аргументом (не через resolve). Перенести рендеринг S01–S04 анкеты из `TelegramQuestionnaireBotFacade` в `FillStory`.

## Выполненные задачи

### Фаза 1 — Прокидка ProactiveSender через init
- Red-тесты прокидки в `packages/core/src/ui/bot` (bot-ui-story, bot-controller, ui-app).
- Green: `ProactiveSender` перенесён в `packages/core/src/ui/bot/types.ts`; реализован в `BotUiApp` (send → transport) и `BotController` (send → `#prefixCommand` → родитель).
- Вынесен `#prefixCommand(command: BotCommand)` из `#prefixResponse`.
- Разделены создание и `init` в `create-ui-app.ts`; `main.ts` создаёт transport, затем `uiApp.init(resolve, transport)` и `uiApp.subscribeEvents()`.

### Фаза 2 — Рендеринг анкеты в FillStory
- Red-тест подписок `FillStory` (`fill.story.test.ts`).
- Green: `FillStory.getEventSubscriptions()` объявляет подписки на `questionnaire:start`/`questionnaire:invite`; рендер S01–S04 перенесён из фасада в стори; отправка через `this.proactiveSender.send(...)`.
- Удалён `TelegramQuestionnaireBotFacade` и прямые `eventBus.subscribe` из `main.ts`.

## Файлы

### Созданы
- `apps/u7-bot/src/controllers/questionnaire/fill.story.test.ts`

### Изменены
- `packages/core/src/ui/bot/types.ts` — интерфейс `ProactiveSender` (FR1).
- `packages/core/src/ui/bot/ui-app.ts` — `BotUiApp implements ProactiveSender`; `init(resolve, transport)`; `send()`.
- `packages/core/src/ui/bot/bot-controller.ts` — `BotController implements ProactiveSender`; `init(resolve, proactiveSender)`; `send()`; `#prefixCommand`.
- `packages/core/src/ui/bot/bot-ui-story.ts` — `BotUiStory.init(resolve, proactiveSender)`.
- `packages/core/src/ui/bot/*.test.ts` — Red-тесты прокидки.
- `apps/u7-bot/src/core/ui-app.ts` — `U7BotUiApp.init(resolve, transport)`.
- `apps/u7-bot/src/core/u7-bot-controller.ts` — прокидка `proactiveSender` в `super.init`.
- `apps/u7-bot/src/infra/bot-transport.ts` — `ProactiveSender` импортируется из `@u7-scl/core/ui` (FR8).
- `apps/u7-bot/src/create-ui-app.ts` — создание/init разделены; возвращается `resolve`.
- `apps/u7-bot/src/main.ts` — transport создаётся до `init`; удалены фасад и прямые подписки.
- `apps/u7-bot/src/controllers/questionnaire/fill.story.ts` — подписки на события + рендер S01–S04.
- `conductor/code_styleguides/bot-architecture.md` — обновлён §3.5 и §2.6 под цепочку ProactiveSender.
- `apps/u7-bot/src/controllers/questionnaire/ui-spec.md` — обновлён рендеринг S01.

### Удалены
- `apps/u7-bot/src/infra/questionnaire-bot-facade.ts`

## Архитектурные решения

1. **`init` с отдельным аргументом, а не через resolve.** Прокидка отправителя — сквозная цепочка, не «зависимость уровня приложения». Второй (опциональный) параметр `init(resolve, sender)` сохраняет совместимость с канально-независимыми базовыми классами `UiApp`/`UiController`/`UiStory`, которые остаются без изменений.
2. **Каждый уровень передаёт себя вниз.** `BotUiApp` передаёт `this` контроллерам, `BotController` — `this` стори. Вызов `send` идёт вверх: стори → контроллер (префиксация) → uiApp (делегирование) → transport (исполнение).
3. **`#prefixCommand` вынесен из `#prefixResponse`.** Префиксация кнопок нужна и для callback-ответов (с `delegate`), и для проактивного `send` (без `delegate`). `#prefixResponse` теперь = `#prefixCommand` + обработка `delegate.path`.
4. **Рендеринг S01–S04 переехал в `FillStory` как обработчики событий.** Подписки объявлены через `getEventSubscriptions()`, обработчики шлют проактивно с полным `captureInput.path = 'questionnaire/fill'` (транспорт не префиксирует путь).

## Отклонения от плана

- Ручная верификация выполнена в автономном режиме (по запросу пользователя «сделай весь трек полностью»): шаги верификации зафиксированы в git-заметках контрольных точек и в финальном отчёте ассистента.

## Известные ограничения

- `bun run check:a u7-bot` содержит 4 **pre-existing** падения в сценарии «Создание потока (wizard)» (интеграционные и E2E тесты), не связанные с этим треком. Подтверждено на коммите `186f14ec` до внесения изменений: те же 4 теста падают. Мои изменения полностью зелёные (`check:p core` → 208 pass / 0 fail; `tsc --noEmit` и `biome check` — чисто).
