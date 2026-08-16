# План реализации — UI: канально-независимый слой и механизм подписки стори на доменные события

## Фаза 1: Общий UI-слой core

- [ ] Task: Red — тесты общего слоя. Создать `packages/core/src/ui/ui-app.test.ts` и `ui-controller.test.ts`:
  - `UiApp.subscribeEvents` регистрирует подписку с правильным `eventName`;
  - `publish` события вызывает `handle`;
  - `unsubscribeAll` отписывает (повторный `publish` не вызывает `handle`);
  - повторный `subscribeEvents` не дублирует обработчики;
  - `UiController.getEventSubscriptions` агрегирует подписки всех стори;
  - `UiStory.getEventSubscriptions` по умолчанию возвращает `[]`.
  - Не тестируем чистые типы: интерфейс `UiEventSubscription`, фабрику `eventSubscription` (обёртка без логики).
- [ ] Task: Green — реализовать `packages/core/src/ui/event-subscription.ts`, `ui-story.ts`, `ui-controller.ts`, `ui-app.ts`.
- [ ] Task: Обновить `packages/core/src/ui/index.ts` (экспорт общего слоя).
- [ ] Task: Conductor - Ручная верификация 'Общий UI-слой core' (Protocol in workflow.md)

## Фаза 2: Наследование bot-классов и переименования

- [ ] Task: Переименовать `packages/core/src/ui/bot/ui-app.ts`: класс `UiApp` → `BotUiApp`, наследование от общего `UiApp`.
- [ ] Task: Переименовать `packages/core/src/ui/bot/bot-user-story.ts` → `bot-ui-story.ts`: класс `BotUserStory` → `BotUiStory`, наследование от `UiStory`.
- [ ] Task: Обновить `packages/core/src/ui/bot/controller/bot-controller.ts`: `BotController extends UiController`; типы `uiApp` в bot-классах → `BotUiApp`.
- [ ] Task: Обновить `apps/u7-bot`: `core/ui-app.ts` (`U7BotUiApp extends BotUiApp`), `core/u7-bot-user-story.ts` → `u7-bot-ui-story.ts` (`U7BotUserStory` → `U7BotUiStory`); обновить `tsconfig.json` path `@u7-scl/bot/u7-bot-user-story` → `u7-bot-ui-story`; обновить все импорты стори/контроллеров.
- [ ] Task: Обновить тесты `core/ui/bot` (`ui-app.test.ts`, `bot-user-story.test.ts` → `bot-ui-story.test.ts`, `bot-controller.test.ts`) под новые имена и сигнатуры.
- [ ] Task: Документация: `conductor/code_styleguides/skills/bot-user-story.md` → `bot-ui-story.md`; обновить ссылки в `ddd-api/SKILL.md`, `conductor/index.md`, `bot-controller.md`, `bot-architecture.md` и при необходимости в `architecture.md`.
- [ ] Task: Conductor - Ручная верификация 'Наследование bot-классов' (Protocol in workflow.md)

## Финал

- [ ] Task: `bun run check:p core`
- [ ] Task: `bun run check:a u7-bot`
