# Спецификация — UI (bot): прокидка ProactiveSender через init и перенос рендеринга анкеты в стори

## Обзор

Прокинуть `ProactiveSender` по цепочке `transport → BotUiApp → BotController → BotUiStory`. Каждый уровень реализует `ProactiveSender` и передаёт **себя** дочернему уровню через `init` отдельным аргументом (не через resolve). Вызов `send` идёт по цепочке вверх, и каждый уровень обрабатывает `BotCommand` по-своему: transport исполняет, `BotUiApp` диспетчеризует, `BotController` префиксует кнопки. Перенести рендеринг S01–S04 анкеты из `TelegramQuestionnaireBotFacade` в `FillStory`.

Зависит от трека `ui-event-subscriptions_20260816`.

## Функциональные требования

- **FR1** `ProactiveSender` перенесён в `@u7-scl/core/ui` (bot-типы).
- **FR2** `BotUiApp` реализует `ProactiveSender` (`send` → transport); transport передаёт себя в `init` отдельным аргументом.
- **FR3** `BotController` реализует `ProactiveSender` (`send` → префиксация `#prefixCommand` → `uiApp.send`); передаёт себя стори в `init` отдельным аргументом.
- **FR4** `BotUiStory` получает `ProactiveSender` (родитель-контроллер) в `init` отдельным аргументом и вызывает его в обработчиках событий.
- **FR5** `FillStory` объявляет подписки на `questionnaire:start`/`questionnaire:invite`, рендерит S01–S04 и запускает диалог через `proactiveSender`.
- **FR6** `createUiApp` разделяет создание и `init`; `main.ts` создаёт transport, затем `uiApp.init(resolve, transport)` и `uiApp.subscribeEvents()`.
- **FR7** Удалить `TelegramQuestionnaireBotFacade` и прямые `eventBus.subscribe` из `main.ts`.
- **FR8** `BotTransport` импортирует `ProactiveSender` из `@u7-scl/core/ui`.

## Критерии приёмки

- Проактивный старт/приглашение анкеты рендерятся через стори.
- Кнопки проактивных сообщений имеют полный префикс `questionnaire:...`.
- `bun run check:a u7-bot` зелёный.

## За рамками

- web-ui.
- Подписки на события других модулей.
- Изменения общего `UiApp` (сделаны в треке `ui-event-subscriptions_20260816`).
