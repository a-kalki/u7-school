# Спецификация — UI (bot): прокидка ProactiveSender через init и перенос рендеринга анкеты в стори

## Обзор

Прокинуть `ProactiveSender` по дереву `BotUiApp → BotController → BotUiStory` через `init(...)`. Проактивные сообщения из стори проходят стандартный путь: префиксация кнопок контроллером → транспорт. Перенести рендеринг S01–S04 анкеты из `TelegramQuestionnaireBotFacade` в `FillStory`.

Зависит от трека `ui-event-subscriptions_20260816`.

## Функциональные требования

- **FR1** `ProactiveSender` перенесён в `@u7-scl/core/ui` (bot-типы).
- **FR2** `BotUiApp` реализует `ProactiveSender` (`send` → transport); transport передаётся через `init`.
- **FR3** `BotController` реализует `ProactiveSender` (`send` → префиксация `#prefixCommand` → `uiApp.send`); передаёт себя стори в `init`.
- **FR4** `BotUiStory` получает `ProactiveSender` третьим аргументом `init` и вызывает его в обработчиках событий.
- **FR5** `FillStory` объявляет подписки на `questionnaire:start`/`questionnaire:invite`, рендерит S01–S04 и запускает диалог через `proactiveSender`.
- **FR6** `createUiApp` разделяет создание и `init`; `main.ts` создаёт transport, затем `uiApp.init(apiApp, actorResolver, transport)` и `uiApp.subscribeEvents(eventBus)`.
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
