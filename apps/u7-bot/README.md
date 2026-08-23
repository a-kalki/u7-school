# U7 Bot — Telegram-бот школы

Telegram-бот для платформы u7-school. Построен на grammy, использует модульную архитектуру с контроллерами.

## Структура

```
apps/u7-bot/
  src/
    main.ts                       # Точка входа, сборка приложения
    create-api-app.ts             # Фабрика ApiApp (модули + репозитории)
    create-ui-app.ts              # Фабрика UiApp (контроллеры + stories)
    core/                         # Ядро бота
      u7-bot-controller.ts        # U7BotController — базовый контроллер
      u7-bot-app-meta.ts          # U7BotAppMeta — мета-тип приложения
      ui-utils.ts                 # Хелперы UI (экранирование MarkdownV2, форматирование)
    controllers/                  # Контроллеры бота (по функциям)
      app/                        # AppController — системные сценарии
        app-controller.ts         # /start, /help, Сообщество
        stories/
          community.story.ts      # Кнопка «Сообщество школы»
      courses/                    # CourseController — каталог курсов
        course-controller.ts
        stories/
          course-catalog.story.ts # 5-уровневый drill-down по курсам
        ui-spec.md                # Спецификация экранов (S00)
      streams/                    # StreamController — каталог и управление потоками
        stream-controller.ts
        stories/
          stream-catalog.story.ts # S01 — каталог потоков
          view-stream.story.ts    # S02/S02m/S03/S04 — карточка, программа, детали
        ui-spec.md                # Спецификация экранов (S01–S04, S09–S10)
      learning/                   # LearningController — обучение студента
        learning-controller.ts
        hub.ts                    # S05 — хаб «Моя учёба»
        step-view.ts              # S05a — просмотр шага
        nav-tree.ts               # S05b — дерево навигации
        progress.ts               # S06 — прогресс
        transition.ts             # S05c — transition-экраны
        enroll.ts                 # Запись на поток
        shared.ts                 # Общая логика
        ui-spec.md                # Спецификация экранов (S05–S06)
      mentor/                     # MentorController — инструменты ментора
        mentor-controller.ts
        stories/
          my-streams.ts           # Мои потоки
          create-stream.ts        # S09 — wizard создания потока
          monitor.ts              # S07 — мониторинг студентов
          view-stream-mentor.ts   # S02m — карточка (mentor-режим)
          activate-stream.ts      # Активация потока
          submenu.ts              # Подменю
        ui-spec.md                # Спецификация экранов (S07–S08)
      onboarding/                 # OnboardingController — анкета
        controller.ts
    infra/                        # Инфраструктура бота
      logger/                     # Логирование
        telegram-logger.ts        # TelegramLogger (отправка логов в чат)
        index.ts
  tests/                          # Тесты
    helpers/                      # test-app.ts, fixture-loader.ts
    fixtures/                     # JSON-фикстуры
    courses/                      # Интеграционные тесты курсов
    streams/                      # Интеграционные тесты потоков
    learning/                     # Интеграционные тесты обучения
    mentor/                       # Интеграционные тесты ментора
    e2e/                          # E2E тесты
```

## Контроллеры

Каждый контроллер — это класс, наследующий `U7BotController`:

- **`AppController`** — системные сценарии: `/start`, `/help`, главное меню, сообщество.
- **`CourseController`** — каталог курсов (S00).
- **`StreamController`** — потоки: каталог, карточки, программа, детали, создание, запись.
- **`LearningController`** — обучение: хаб, дерево уроков, шаги, прогресс.
- **`MentorController`** — ментор: мои потоки, мониторинг, управление.
- **`OnboardingController`** — анкета (без stories).

Контроллеры регистрируются в `UiApp` при создании (`create-ui-app.ts`). Каждый контроллер владеет своим `name`-префиксом для callback-данных.

## Stories

Story — класс, наследующий `U7BotUserStory`. Инкапсулирует логику одного сценария (каталог, карточка, wizard). Регистрируется в контроллере через массив `stories`.

## Соглашения

- **Callback-данные:** `<controller-name>:<action>:` — префикс контроллера, дефис в snake_case. Пример: `view-stream:program:{id}`, `learning:my-study:continue`.
- **Межмодульные вызовы:** через `this.appApi.execute()` (команды других модулей).
- **Кросс-стори ссылки:** через `this.uiApp.getAction<T>(name)` (публичные действия других контроллеров).
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
bun run test:a u7-bot

# Только конкретный файл
bun test apps/u7-bot/tests/streams/
```

## Связанные документы

- [BotController Styleguide](../../conductor/code_styleguides/skills/bot-controller.md) — иерархия, API
- [BotUserStory Styleguide](../../conductor/code_styleguides/skills/bot-user-story.md) — написание stories
- [Тестирование бота](../../conductor/code_styleguides/bot-test.md) — уровни и правила
- [UI Specs](./src/controllers/) — спецификации экранов по модулям
