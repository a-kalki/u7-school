# Спецификация — UI: канально-независимый слой и механизм подписки стори на доменные события

## Обзор

Ввести в `@u7-scl/core/ui` канально-независимый слой для реакции UI на доменные события по аналогии с API-слоем. Стори объявляют типизированные подписки; `UiApp` агрегирует их и централизованно подписывает на `EventBus`. Telegram-классы становятся частным случаем общих баз.

Механика подписки не содержит ни доставки наружу (bot), ни получения снаружи (web) — только объявление подписки, агрегацию и физическую подписку на шину.

## Функциональные требования

- **FR1** `UiEventSubscription<TEvent>`: `eventName: TEvent['eventName']`, `handle(event: TEvent): Promise<void>`; фабрика `eventSubscription<TEvent>(eventName, handle)`.
- **FR2** `UiStory`: базовый класс с `getEventSubscriptions(): UiEventSubscription[]` (по умолчанию пусто).
- **FR3** `UiController`: базовый класс с `name`, `stories`, `getEventSubscriptions()` (агрегация подписок всех стори).
- **FR4** `UiApp` (общий): реестр контроллеров, `getEventSubscriptions()` (агрегация по контроллерам), `subscribeEvents(eventBus)`, `unsubscribeAll()`. Без знаний о Telegram и транспорте.
- **FR5** Переименовать bot-класс `UiApp` → `BotUiApp` (наследует общий `UiApp`); `BotController extends UiController`; `BotUserStory` → `BotUiStory` (`extends UiStory`). В `u7-bot`: `U7BotUserStory` → `U7BotUiStory`, `U7BotUiApp extends BotUiApp`.
- **FR6** Экспорт общего слоя из `@u7-scl/core/ui`; все импорты в `u7-bot` обновлены.

## Критерии приёмки

- Общий слой компилируется; bot-классы наследуют общие базы.
- Подписка/отписка на `EventBus` работает на уровне общего `UiApp`.
- Все существующие тесты `core` и `u7-bot` зелёные после переименований.
- `bun run check:p core` и `bun run check:a u7-bot` зелёные.

## За рамками

- Доставка проактивных сообщений (`ProactiveSender`) — трек `ui-proactive-sender`.
- Перенос рендеринга анкеты в стори — трек `ui-proactive-sender`.
- Реализация web-ui.
