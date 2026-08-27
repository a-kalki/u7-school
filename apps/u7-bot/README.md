# U7 Bot — Telegram-бот школы

Telegram-бот для платформы u7-school. Построен на grammy, использует модульную
архитектуру с контроллерами. Слои, ответственности и поток данных — см.
[bot-architecture.md](../../conductor/code_styleguides/bot-architecture.md).

## Структура

```
apps/u7-bot/
  src/
    main.ts                       # Точка входа: config → sessionMap → createBot → createApiApp → createUiApp → BotTransport
    bot.ts                        # createBot() — Grammy-бот + session middleware (общий sessionMap)
    context.ts                    # BotContext = Context & SessionFlavor<SessionData>
    config.ts                     # BotConfig (токен, URL группы школы)
    create-api-app.ts             # Фабрика ApiApp (доменные модули + репозитории)
    create-ui-app.ts              # Фабрика U7BotUiApp (все контроллеры + actorResolver)
    core/
      u7-bot-controller.ts        # U7BotController — базовый контроллер
      u7-bot-user-story.ts        # U7BotUserStory — базовый сценарий
      u7-bot-app-meta.ts          # U7BotAppMeta — мета-тип приложения
      ui-app.ts                   # U7BotUiApp — специализация UiApp
    controllers/
      app/
        app-controller.ts         # AppController — /start, /help, главное меню, сообщество
        stories/community.story.ts
      courses/
        controller.ts             # CoursesController — каталог курсов (S00)
        stories/course-catalog.story.ts
        ui-spec.md
      streams/
        controller.ts             # StreamsController — потоки (S01–S04)
        stories/
          stream-catalog.story.ts # S01 — каталог потоков
          view-stream.story.ts    # S02–S04 — карточка, программа, детали
        ui-spec.md
      learning/
        controller.ts             # LearningController — «Моя учёба» (S05–S06)
        stories/
          hub.ts                  # S05 — хаб
          step-view.ts            # просмотр шага
          nav-tree.ts             # дерево уроков
          progress.ts             # S06 — прогресс
        shared.ts                 # Общая логика (editOrSend, respondInContext)
        ui-spec.md
      mentor/
        controller.ts             # MentorController — инструменты ментора (S07–S09)
        stories/
          my-streams.ts           # Мои потоки
          create-stream.ts        # S09 — wizard создания потока
          monitor.ts              # S07 — мониторинг студентов
          view-stream-mentor.ts   # карточка потока (mentor-режим)
          activate-stream.ts      # Активация потока
          submenu.ts              # Подменю
        ui-spec.md
      questionnaire/
        controller.ts             # QuestionnaireController — анкета (standalone-модуль)
        fill.story.ts
      shared/
        routes.ts                 # Routes — канонические кросс-контроллерные маршруты
        buttons.ts                # Готовые кнопки (buttons.mainMenu и др.)
    infra/
      bot-transport.ts            # BotTransport — транспорт/исполнение (сессии, сжатие UUID, execute/send/notify)
      questionnaire-bot-facade.ts # Proactive-фасад анкеты (transport.send)
      logger/                     # TelegramLogger
  tests/
    helpers/
      test-app.ts                 # createTestApp() — ApiApp с временными репозиториями
      test-bot-transport.ts       # TestBotTransport, makeBotContext, createTestBotTransport
      fixture-loader.ts           # copy-on-write фикстур
    fixtures/templates/           # эталонные JSON-фикстуры
    courses/ streams/ learning/ mentor/   # интеграционные тесты
    e2e/                          # E2E сценарии
```

## Контроллеры

Каждый контроллер — класс, наследующий `U7BotController` (`@u7-scl/bot/u7-bot-controller`):

- **`AppController`** (`name: 'app'`) — системные сценарии: `/start`, `/help`, главное меню, сообщество.
- **`CoursesController`** (`name: 'course'`) — каталог курсов (S00).
- **`StreamsController`** (`name: 'stream'`) — потоки: каталог, карточки, программа, детали.
- **`LearningController`** (`name: 'learning'`) — обучение: хаб, дерево уроков, шаги, прогресс.
- **`MentorController`** (`name: 'mentor'`) — ментор: мои потоки, мониторинг, wizard создания.
- **`QuestionnaireController`** (`name: 'questionnaire'`) — анкета (standalone-модуль).

Контроллеры регистрируются в `U7BotUiApp` при создании (`create-ui-app.ts`). Каждый
контроллер владеет своим `name`-префиксом для `callback_data` и **префиксирует**
коды кнопок своих стори.

## Stories

Story — класс, наследующий `U7BotUserStory` (`@u7-scl/bot/u7-bot-user-story`).
Инкапсулирует логику одного сценария (каталог, карточка, wizard). Регистрируется
в контроллере через массив `stories`.

## Соглашения

- **Callback-данные:** `controller:story:action:...` — префикс `controller:` добавляет `BotController`, сжатие UUID (≤ 64 байта) выполняет `BotTransport`.
- **Межмодульные вызовы:** через `this.appApi.execute()` (команды других модулей).
- **Кросс-стори ссылки:** `this.cbFor(storyName, action, ...args)` — для стори того же контроллера; кросс-контроллерные — адрес из `Routes` (`app:main-menu` → `Routes.app.mainMenu`) или готовая кнопка `buttons.mainMenu(text?)`.
- **MarkdownV2:** экранирование через `this.escapeMarkdown()`, кнопки — всегда plain text.

## Запуск

```bash
# Разработка (с фикстурами)
bun run dev:fixtures

# Продакшен
NODE_ENV=production bun run apps/u7-bot/src/main.ts
```

## Тестирование

```bash
# Все тесты бота
bun test apps/u7-bot/

# Только конкретный файл
bun test apps/u7-bot/tests/streams/
```

## Связанные документы

- [Архитектура bot-level](../../conductor/code_styleguides/bot-architecture.md)
- [BotController Styleguide](../../conductor/code_styleguides/skills/bot-controller.md) — иерархия, API
- [BotUserStory Styleguide](../../conductor/code_styleguides/skills/bot-user-story.md) — написание stories
- [Тестирование бота](../../conductor/code_styleguides/bot-test.md) — уровни и правила
- [UI Specs](./src/controllers/) — спецификации экранов по модулям
