# Итоговый отчёт — UI: канально-независимый слой и механизм подписки стори на доменные события

Трек `ui-event-subscriptions_20260816`.

## Цель

Ввести в `@u7-scl/core/ui` канально-независимый слой реакции UI на доменные события по аналогии с API-слоем. Стори объявляют типизированные подписки, `UiApp` агрегирует их и централизованно подписывает на `EventBus`. Telegram-классы стали частным случаем общих баз.

## Выполненные задачи

- **Общий слой core:** `UiEventSubscription<TEvent>` + фабрика `eventSubscription`; `UiStory.getEventSubscriptions()`; `UiController.getEventSubscriptions()`; общий `UiApp` с `getEventSubscriptions()`, `subscribeEvents(eventBus)`, `unsubscribeAll()`.
- **Наследование bot-классов:** `UiApp` → `BotUiApp extends UiApp`; `BotUserStory` → `BotUiStory extends UiStory`; `BotController extends UiController`.
- **u7-bot:** `U7BotUserStory` → `U7BotUiStory`, `U7BotUiApp extends BotUiApp`; обновлены `tsconfig.json` path и все импорты стори/контроллеров.
- **Тесты:** новые `ui-app.test.ts`, `ui-controller.test.ts` (7 тестов); обновлены `bot-ui-story.test.ts`, `bot-controller.test.ts`, `ui-app.test.ts` и `u7-bot-ui-story.test.ts`.
- **Документация:** `bot-user-story.md` → `bot-ui-story.md`; обновлены ссылки в `ddd-api/SKILL.md`, `arch-boundary-design/SKILL.md`, `conductor/index.md`, `bot-controller.md`, `bot-architecture.md`, `architecture.md`, `bot-test.md`.

## Созданные файлы

- `packages/core/src/ui/event-subscription.ts`
- `packages/core/src/ui/ui-story.ts`
- `packages/core/src/ui/ui-controller.ts`
- `packages/core/src/ui/ui-app.ts`
- `packages/core/src/ui/ui-app.test.ts`
- `packages/core/src/ui/ui-controller.test.ts`
- `packages/core/src/ui/bot/bot-ui-story.ts` (переименован из `bot-user-story.ts`)
- `packages/core/src/ui/bot/bot-ui-story.test.ts` (переименован)
- `apps/u7-bot/src/core/u7-bot-ui-story.ts` (переименован из `u7-bot-user-story.ts`)
- `apps/u7-bot/src/core/u7-bot-ui-story.test.ts` (переименован)
- `conductor/code_styleguides/skills/bot-ui-story.md` (переименован из `bot-user-story.md`)

## Удалённые файлы

- `packages/core/src/ui/bot/bot-user-story.ts` (→ `bot-ui-story.ts`)
- `packages/core/src/ui/bot/bot-user-story.test.ts` (→ `bot-ui-story.test.ts`)
- `apps/u7-bot/src/core/u7-bot-user-story.ts` (→ `u7-bot-ui-story.ts`)
- `apps/u7-bot/src/core/u7-bot-user-story.test.ts` (→ `u7-bot-ui-story.test.ts`)
- `conductor/code_styleguides/skills/bot-user-story.md` (→ `bot-ui-story.md`)

## Изменённые файлы (ключевые)

- `packages/core/src/ui/index.ts` — экспорт общего слоя
- `packages/core/src/ui/bot/ui-app.ts` — `BotUiApp extends UiApp`
- `packages/core/src/ui/bot/controller/bot-controller.ts` — `BotController extends UiController`
- `packages/core/src/ui/bot/types.ts`, `README.md` — упоминания `BotUiApp`
- `apps/u7-bot/src/core/ui-app.ts` — `U7BotUiApp extends BotUiApp`
- `apps/u7-bot/src/controllers/**` — все стори переведены на `U7BotUiStory`
- `tsconfig.json` — path `@u7-scl/bot/u7-bot-ui-story`
- `.pi/skills/ddd-api/SKILL.md`, `.pi/skills/arch-boundary-design/SKILL.md` — ссылки на `bot-ui-story.md`
- `conductor/index.md`, `conductor/code_styleguides/{architecture,bot-architecture,bot-test}.md`, `conductor/code_styleguides/skills/bot-controller.md`

## Архитектурные решения

1. **Дженерик на стори в контроллере** — `UiController<TStory extends UiStory>` владеет `stories: TStory[]`; `BotController extends UiController<BotUiStory<...>>` получает корректный тип стори без теневого поля.
2. **Дженерик на контроллере в UiApp** — `UiApp<TController extends UiController>` владеет `controllers: Map<string, TController>`; `BotUiApp extends UiApp<BotController<...>>` сохраняет типизированный доступ к bot-контроллерам.
3. **Идемпотентная подписка** — `UiApp.subscribeEvents` запоминает `subscribed`, повторный вызов не дублирует обработчики; `unsubscribeAll` сбрасывает флаг.
4. **Метод-сигнатура `handle(event: TEvent)`** в `UiEventSubscription` — бивариантность методов позволяет `UiEventSubscription<SpecificEvent>` быть совместимым с `UiEventSubscription<DomainEvent>` при агрегации.

## Отклонения от плана

- Задачи ручной верификации выполнены через автоматические проверки (`bun run check:p core`, `bun run check:a u7-bot`); интерактивный протокол ручной верификации заменён на итоговый отчёт по просьбе пользователя («сделай не останавливаясь»).
- Коммиты сконсолидированы (один feature-коммит вместо потасковых) по той же причине.

## Известные ограничения / незавершённое

- **4 падающих теста wizard создания потока** — НЕ связаны с данным треком (подтверждено: падают и на исходном коде до изменений). Файлы: `apps/u7-bot/tests/mentor/mentor.integration.test.ts` (2), `apps/u7-bot/tests/e2e/mentor-management.e2e.test.ts` (2). Требуют отдельного разбора.
- Механизм подписки введён, но пока не подключён в `main.ts` — это задача следующего трека `ui-proactive-sender` (доставка проактивных сообщений и перенос рендеринга анкеты в стори).

## Шаги ручной верификации

1. `bun run check:p core` — ожидается: 217 тестов зелёные, линт и tsc без ошибок.
2. `bun run check:a u7-bot` — ожидается: 397 зелёных, 4 падающих (wizard, до трека).
3. `bun run dev:fixtures` и запуск бота — убедиться, что навигация, анкета и меню работают как раньше (переименования не должны менять поведение).
