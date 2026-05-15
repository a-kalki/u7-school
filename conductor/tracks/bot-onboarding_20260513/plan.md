# План реализации: Telegram-бот onboarding (bot-onboarding)

## Обзор текущего состояния

### Реализовано
- [x] **Domain** (`@u7/onboarding`): `QuestionnaireAr`, `QuestionPoolService`, entity, policy, `QuestionnaireRepo`, пул из 9 вопросов с ветвлением.
- [x] **API** (`@u7/onboarding`): UC `start-questionnaire`, `submit-answer`, `abandon-questionnaire`, `get-questionnaire`, `list-questionnaires-by-user`. Роль `CANDIDATE` выдаётся при завершении анкеты (автоматически в `submit-answer` после последнего ответа).
- [x] **Controller** (`@u7/onboarding`): `OnboardingController` — чистая прокладка между UI и API.
- [x] **Infra** (`@u7/onboarding`): `QuestionnaireJsonRepo`.
- [x] **User** (`@u7/user`): регистрация (`register-user` → GUEST), поиск по `telegramId`, добавление роли (`add-role-to-user`).

### Не реализовано
- [x] Telegram-обработчики (`/start`, `/cancel`, inline-кнопки).
- [x] Conversation flow (пошаговый опросник с inline-клавиатурами, множественный выбор, ветвление).
- [x] Логика повторного `/start` (разное поведение для CANDIDATE / GUEST / SUBSCRIBER).
- [x] «Быть в курсе» → ссылка на новостную группу.
- [x] Session storage JSON.
- [x] Привязка `grammy` + `@grammyjs/conversations`.

---

## Архитектурные решения

1. **Bot-user (actor)**
   UUID администратора-бота передаётся через env (`BOT_ADMIN_UUID`). Авторегистрация не предусмотрена — администратор должен предварительно создать пользователя-бота через CLI/API. При старте приложения main просто читает `BOT_ADMIN_UUID` из `process.env` и использует как `actorId` во всех запросах.

2. **Dependency Injection через resolve-объект**
   Все компоненты (`ApiApp`, `OnboardingController`, handlers) получают зависимости через конструктор. `main.ts` создаёт репозитории, сервисы, собирает `ApiApp`, `Controller`, `Bot` и передаёт готовые объекты.

3. **Session storage**
   Grammy `session` с JSON-backend (файл `data/bot-session.json`). Session-тип:
   ```ts
   interface BotSession {
     questionnaireUuid?: string;
     selectedAnswers?: Record<string, string[]>;
   }
   ```
   `selectedAnswers` нужен для множественного выбора (multiple choice): пока пользователь тапает варианты, они аккумулируются в session. Кнопка «Далее ➡️» отправляет собранный массив как ответ. Без session пришлось бы хранить состояние inline-клавиатуры только в сообщении Telegram, что усложняет логику обновления ✅.

4. **Flow анкеты (без изменений domain)**
   `submit-answer` автоматически завершает анкету после последнего ответа и выдаёт `CANDIDATE`. Conversation после получения `null` от `getCurrentQuestion` сразу показывает confirmation.

---

## Этапы реализации

### Этап 1. Исправление StartQuestionnaireUc (`@u7/onboarding`)
**Цель**: запретить создание новой анкеты, если у пользователя уже есть активная (`in_progress`).

#### 1.1 `StartQuestionnaireUc`
- Перед созданием анкеты загрузить все анкеты пользователя: `this.resolve.questionnaireRepo.getByUserId(command.userId)`.
- Если среди них есть хотя бы одна со статусом `'in_progress'` — выбросить `errConflict<QuestionnaireActiveUcError>('QUESTIONNAIRE_ACTIVE', ...)`.
- Обновить `StartQuestionnaireCmdError` — добавить `QuestionnaireActiveUcError`.
- Обновить `errors.ts` — добавить `QuestionnaireActiveUcError`.
- Обновить `start-questionnaire-uc.test.ts` — тест на отказ при активной анкете.

---

### Этап 2. Controller (`@u7/onboarding`)
**Цель**: добавить хелперы для бота.

#### 2.1 `OnboardingController`
- **Добавить** `getStartFlow(user, questionnaires)`:
  - `'candidate'` — у пользователя есть роль `CANDIDATE` (приоритет выше SUBSCRIBER).
  - `'subscriber'` — есть роль `SUBSCRIBER`, но **нет** `CANDIDATE`.
  - `'guest'` — только `GUEST` (нет CANDIDATE и SUBSCRIBER) или новый пользователь.
- **Добавить** `restartQuestionnaire(userId, actorId)`:
  - Просто вызывает `start-questionnaire` UC. Если UC бросает `QUESTIONNAIRE_ACTIVE` — пробрасывает ошибку (бот покажет сообщение «У вас уже есть активная заявка»).
- Обновить `onboarding-controller.test.ts` — тесты на `getStartFlow` (включая комбинацию ролей) и `restartQuestionnaire`.

---

### Этап 3. Инфраструктура `apps/u7-bot`
**Цель**: подготовить приложение бота, ApiApp, конфигурацию.

#### 3.1 Зависимости и env
- **`apps/u7-bot/package.json`**:
  - Добавить: `@u7/onboarding`, `@u7/user`, `@grammyjs/conversations`.
  - **Убрать**: `dotenv` (Bun читает `.env` автоматически).
- **`.env.development`** / **`.env.production`**:
  - `BOT_TOKEN`
  - `NEWS_GROUP_URL`
  - `BOT_ADMIN_UUID` (UUID пользователя-бота с ролью ADMIN)
  - `DB_DIR` (опционально, путь к JSON-файлам БД, fallback `./data`)

#### 3.2 Конфигурация
- **`src/config.ts`**:
  - Чтение `process.env` напрямую (Bun загружает `.env` автоматически).
  - Валидация через valibot (`BotConfigSchema`):
    ```ts
    {
      botToken: string,
      newsGroupUrl: string,
      botAdminUuid: string (uuid),
      dbDir: string (fallback './data'),
    }
    ```

#### 3.3 ApiApp бота
- **`src/api-app.ts`**:
  - Экспортирует **фабрику** `createApiApp(config: BotConfig)` → `ApiApp<OnboardingBotAppMeta>`.
  - Фабрика создаёт:
    - `db = new BaseJsonDb()`
    - `userRepo = new UserJsonRepo(...)`
    - `questionnaireRepo = new QuestionnaireJsonRepo(...)`
    - `poolService = new QuestionPoolService()`
    - `userFacade = new UserInProcFacade(userModule)`
    - `userModule = new UserApiModule()` → `init({ userRepo })`
    - `onboardingModule = new OnboardingApiModule()` → `init({ questionnaireRepo, poolService, includedQuestionCodes, userFacade, db })`
    - `apiApp = new ApiApp()` → `register(userModule)`, `register(onboardingModule)`
  - Возвращает `{ apiApp, userRepo, questionnaireRepo, poolService }` (для использования в main).

#### 3.4 Session
- **`src/session.ts`**:
  - Интерфейс `BotSession`:
    ```ts
    interface BotSession {
      questionnaireUuid?: string;
      selectedAnswers?: Record<string, string[]>;
    }
    ```

---

### Этап 4. Telegram UI (grammy + conversations)
**Цель**: реализовать обработчики и conversation flow.

#### 4.1 Инициализация бота
- **`src/bot.ts`**:
  - Экспортирует **фабрику** `createBot(config, controller, apiApp)`.
  - Создаёт `new Bot<BotContext>(config.botToken)`.
  - Подключает `session` middleware с JSON-file storage (`${config.dbDir}/bot-session.json`).
  - Подключает `conversations()` middleware.
  - Регистрирует handlers и conversations (передаёт `config`, `controller`, `apiApp` через closure).
  - Возвращает `bot`.

#### 4.2 Обработчик `/start`
- **`src/handlers/start-handler.ts`**:
  - Экспортирует функцию `registerStartHandler(bot, controller, apiApp, config)`.
  - Получить `telegramId = ctx.from.id`.
  - Вызвать `get-user-by-telegram-id` через `apiApp`.
  - Если пользователя нет — `register-user` (создаётся GUEST).
  - Получить `user` и его анкеты (`list-questionnaires-by-user`).
  - Вызвать `controller.getStartFlow(user, questionnaires)`:
    - `'candidate'` → сообщение «Вы уже заполняли заявку. Хотите подать новую?» + кнопки «Новая заявка» / «Меню».
    - `'subscriber'` → сообщение «Ты уже с нами!».
    - `'guest'` / новый → приветствие + inline-меню «Быть в курсе» / «Стать студентом».
  - Обработка `callback_query` для кнопок меню.
  - При нажатии «Новая заявка»:
    - Проверить активную анкету (`list-questionnaires-by-user` + `status === 'in_progress'`).
    - Если есть — `controller.abandon(uuid, config.botAdminUuid)`.
    - Затем запустить `onboardingConversation`.

#### 4.3 Обработчик «Быть в курсе»
- **`src/handlers/be-in-the-know-handler.ts`**:
  - `registerBeInTheKnowHandler(bot, config)`.
  - Отправить сообщение с `NEWS_GROUP_URL`.
  - Inline-кнопка «Вернуться в меню» (триггерит `/start` логику).

#### 4.4 Обработчик `/cancel`
- **`src/handlers/cancel-handler.ts`**:
  - `registerCancelHandler(bot, controller, config)`.
  - Если в session есть `questionnaireUuid` — вызвать `controller.abandon(uuid, config.botAdminUuid)`.
  - Очистить session (`ctx.session = {}`).
  - Отправить сообщение «Опросник прерван» + кнопка «В меню».

#### 4.5 Conversation «Стать студентом»
- **`src/conversations/onboarding-conversation.ts`**:
  - `registerOnboardingConversation(bot, controller, config)`.
  - `onboardingConversation(conv, ctx)`:
    1. `controller.start(userId, config.botAdminUuid)` → получаем `questionnaireUuid`, `firstQuestion`.
    2. Сохранить `uuid` в session.
    3. Цикл `while (true)`:
       - Получить текущий вопрос: `controller.getCurrentQuestion(uuid, config.botAdminUuid)`.
       - Если `null` — все вопросы пройдены (анкета уже `completed`, роль `CANDIDATE` выдана) → break.
       - Если `choice`:
         - Построить inline-клавиатуру через `controller.getKeyboard(question, selected)`.
         - Для `multiple`: при каждом нажатии обновлять сообщение с ✅ и кнопкой «Далее ➡️». Выбранные значения сохранять в `ctx.session.selectedAnswers[questionCode]`.
         - По нажатию «Далее» — собрать `value` из session и очистить.
         - Для `single` — сразу переход после выбора.
       - Если `text`:
         - `await conv.waitFor('message:text')`.
         - Взять `ctx.msg.text`.
       - Вызвать `controller.submitAnswer(uuid, questionCode, value, config.botAdminUuid)`.
    4. После цикла (анкета уже завершена):
       - Отправить confirmation + ссылка на группу (`NEWS_GROUP_URL`).
       - Inline-кнопка «Вернуться в меню».

---

### Этап 5. Точка входа и тесты

#### 5.1 `main.ts`
- **`src/main.ts`**:
  ```ts
  import { loadConfig } from './config';
  import { createApiApp } from './api-app';
  import { OnboardingController } from '@u7/onboarding';
  import { createBot } from './bot';
  import { registerStartHandler } from './handlers/start-handler';
  import { registerBeInTheKnowHandler } from './handlers/be-in-the-know-handler';
  import { registerCancelHandler } from './handlers/cancel-handler';
  import { registerOnboardingConversation } from './conversations/onboarding-conversation';

  const config = loadConfig();
  const { apiApp, poolService } = createApiApp(config);
  const controller = new OnboardingController(apiApp, poolService);
  const bot = createBot(config, controller, apiApp);

  registerStartHandler(bot, controller, apiApp, config);
  registerBeInTheKnowHandler(bot, config);
  registerCancelHandler(bot, controller, config);
  registerOnboardingConversation(bot, controller, config);

  bot.start();
  ```

#### 5.2 Тесты `apps/u7-bot`
- `src/config.test.ts` — валидация конфигурации (валидный env, отсутствующие поля).
- `src/handlers/start-handler.test.ts` — моки grammy `Context`, проверка flow для всех трёх состояний (candidate, subscriber, guest).
- `src/conversations/onboarding-conversation.test.ts` — моки `conversation` API, прохождение вопросов.

#### 5.3 Тесты controller (`packages/onboarding`)
- `src/ui/bot/controller/onboarding-controller.test.ts`:
  - `getStartFlow` — для CANDIDATE, SUBSCRIBER, GUEST, комбинации ролей.
  - `restartQuestionnaire` — создание второй анкеты.
  - `restartQuestionnaire` — ошибка `QUESTIONNAIRE_ACTIVE` если уже есть активная.

#### 5.4 Тесты UC (`packages/onboarding`)
- `src/api/questionnaire/start-questionnaire-uc.test.ts` — тест на отказ при наличии активной анкеты.

#### 5.5 Проверки
- [x] `bun run check` в `packages/onboarding` — проходит (101 тест, 0 fail).
- [x] `bun run check` в `apps/u7-bot` — проходит (16 тестов, 0 fail).
- [x] `bun run check` во всём проекте — проходит (530 тестов, 0 fail).

---

## Критерии приёмки
- [x] Бот отвечает на `/start`, создаёт/находит пользователя (`register-user` / `get-user-by-telegram-id`).
- [x] Inline-меню «Быть в курсе» / «Стать студентом» работает корректно.
- [x] Conversation проходит все 9 вопросов анкеты (choice + text, multiple/single, ветвление после `intensity`).
- [x] Множественный выбор: кнопки обновляются с ✅, есть кнопка «Далее ➡️».
- [x] После последнего ответа анкета автоматически завершается, пользователь получает `CANDIDATE`.
- [x] `start-questionnaire` отказывает, если у пользователя уже есть активная анкета.
- [x] `/cancel` прерывает опросник (`abandon-questionnaire`), очищает session.
- [x] Повторный `/start`:
  - `CANDIDATE` (в т.ч. с SUBSCRIBER) → предложение создать новую заявку.
  - `SUBSCRIBER` без `CANDIDATE` → «Ты уже с нами!».
  - `GUEST` без CANDIDATE/SUBSCRIBER → меню.
- [x] Конфигурация через `.env` (Bun загружает автоматически).

---

## Сводка изменений по файлам

### packages/onboarding
| Файл | Действие |
|---|---|
| `src/api/questionnaire/start-questionnaire-uc.ts` | Добавить проверку активной анкеты (`getByUserId` + `status === 'in_progress'`) |
| `src/api/questionnaire/start-questionnaire-uc.test.ts` | Тест на отказ при активной анкете |
| `src/domain/questionnaire/commands/start-questionnaire-cmd.ts` | Добавить `QuestionnaireActiveUcError` в errors |
| `src/domain/questionnaire/errors.ts` | Добавить `QuestionnaireActiveUcError` |
| `src/ui/bot/controller/onboarding-controller.ts` | Добавить `getStartFlow`, `restartQuestionnaire` |
| `src/ui/bot/controller/onboarding-controller.test.ts` | Дополнить тесты |
| `src/index.ts` | Добавить экспорт `OnboardingBotAppMeta`, `OnboardingBotApp` |
| `package.json` | Добавить экспорт корня `.` |

### apps/u7-bot
| Файл | Действие |
|---|---|
| `package.json` | Добавить `@u7/onboarding`, `@u7/user`, `@grammyjs/conversations`; убрать `dotenv` |
| `.env.development` | **Создать** (BOT_TOKEN, NEWS_GROUP_URL, BOT_ADMIN_UUID, DB_DIR) |
| `.env.production` | **Создать** |
| `src/config.ts` | **Создать** — чтение `process.env`, валидация valibot |
| `src/config.test.ts` | **Создать** |
| `src/session.ts` | **Создать** |
| `src/context.ts` | **Создать** — тип `BotContext` |
| `src/session-storage.ts` | **Создать** — JSON-file storage для Grammy session |
| `src/api-app.ts` | **Создать** — фабрика `createApiApp` |
| `src/bot.ts` | **Создать** — фабрика `createBot` |
| `src/handlers/start-handler.ts` | **Создать** |
| `src/handlers/start-handler.test.ts` | **Создать** |
| `src/handlers/be-in-the-know-handler.ts` | **Создать** |
| `src/handlers/cancel-handler.ts` | **Создать** |
| `src/conversations/onboarding-conversation.ts` | **Создать** |
| `src/conversations/onboarding-conversation.test.ts` | **Создать** |
| `src/main.ts` | **Переписать** — сборка через фабрики, запуск |
