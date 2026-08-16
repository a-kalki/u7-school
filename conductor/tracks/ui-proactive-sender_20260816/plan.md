# План реализации — UI (bot): прокидка ProactiveSender через init и перенос рендеринга анкеты в стори

## Фаза 1: Прокидка ProactiveSender через init [checkpoint: 5fe142e]

- [x] Task: Red — тесты прокидки в `packages/core/src/ui/bot`: (5349386)
  - `BotUiStory.init(resolve, proactiveSender)` сохраняет `proactiveSender` (родитель-контроллер);
  - `BotController.send(tgId, command)` префиксирует коды кнопок (`fill:...` → `name:fill:...`) и вызывает `uiApp.send` (mock);
  - `BotUiApp.send(tgId, command)` делегирует в transport (mock `ProactiveSender`);
  - `BotUiApp.init(resolve, transport)` передаёт себя контроллерам; `BotController.init(resolve, uiApp)` передаёт себя стори (spy на контроллерах/стори).
  - Не тестируем чистый тип: интерфейс `ProactiveSender`.
- [x] Task: Green — перенести `ProactiveSender` в `packages/core/src/ui/bot/types.ts`; реализовать `ProactiveSender` в `BotUiApp` и `BotController`; прокидка по цепочке: каждый уровень передаёт себя вниз через `init`. (5349386)
- [x] Task: Вынести `#prefixCommand(command: BotCommand)` из `#prefixResponse` в `BotController`. (5349386)
- [x] Task: Разделить создание/init в `apps/u7-bot/src/create-ui-app.ts`; в `main.ts` создать transport, затем `uiApp.init(resolve, transport)` и `uiApp.subscribeEvents()`. (5349386)
- [x] Task: Conductor - Ручная верификация 'Прокидка ProactiveSender' (Protocol in workflow.md) (5fe142e)

## Фаза 2: Рендеринг анкеты в FillStory

- [x] Task: Red — тесты подписок `FillStory` в новом `apps/u7-bot/src/controllers/questionnaire/fill.story.test.ts`: (3b7b2ad)
  - `getEventSubscriptions()` возвращает 2 подписки: `questionnaire:start`, `questionnaire:invite`;
  - обработчик `questionnaire:invite` рендерит S01 (текст + кнопки `fill:start`/`fill:why`/`fill:decline`) и вызывает `proactiveSender.send` с правильным `telegramId`;
  - обработчик `questionnaire:start` рендерит S02–S04 и вызывает `send` с `captureInput` (путь `questionnaire/fill`).
  - Не тестируем типы событий questionnaire.
- [x] Task: Green — объявить подписки в `FillStory`; перенести рендер S01–S04 из `TelegramQuestionnaireBotFacade` в стори; вызов `this.proactiveSender.send(...)`. (3b7b2ad)
- [x] Task: Удалить `apps/u7-bot/src/infra/questionnaire-bot-facade.ts` и прямые `eventBus.subscribe` из `main.ts`. (3b7b2ad)
- [ ] Task: Conductor - Ручная верификация 'Рендеринг анкеты в стори' (Protocol in workflow.md)

## Финал

- [ ] Task: `bun run check:a u7-bot`
