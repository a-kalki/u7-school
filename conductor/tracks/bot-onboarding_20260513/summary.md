# Summary: Telegram-бот onboarding (bot-onboarding)

## Даты
- **Начало:** 2026-05-13
- **Завершение:** 2026-05-13

## Статус
✅ Завершён

## Описание
Реализация Telegram-флоу onboarding в `apps/u7-bot` через grammY + `@grammyjs/conversations`. Бот обрабатывает команду `/start`, проводит пользователя через пошаговую анкету с inline-клавиатурами, выдаёт роль `CANDIDATE` при завершении, поддерживает повторный `/start` с учётом текущих ролей.

## Архитектурные решения

1. **Bot-user (actor):** UUID администратора-бота передаётся через `BOT_ADMIN_UUID` в `.env`. Авторегистрация не предусмотрена — администратор должен предварительно создать пользователя-бота через CLI/API.
2. **Dependency Injection:** Все компоненты получают зависимости через конструктор. `main.ts` создаёт репозитории, сервисы, собирает `ApiApp`, `Controller`, `Bot`.
3. **Session storage:** Grammy `session` с JSON-backend (`data/bot-session.json`).
4. **Flow анкеты:** `submit-answer` автоматически завершает анкету после последнего ответа и выдаёт `CANDIDATE`.

## Что было реализовано

### `@u7/onboarding` (изменения)
- `StartQuestionnaireUc` — запрещает создание новой анкеты, если у пользователя уже есть активная (`in_progress`).
- `QuestionnaireActiveUcError` — новая ошибка для блокировки дублирования анкет.
- `OnboardingController`:
  - `getStartFlow(user, questionnaires)` — определяет flow по ролям (`candidate` | `subscriber` | `guest`).
  - `restartQuestionnaire(userId, actorId)` — запуск новой анкеты (с abandon старой при необходимости).

### `apps/u7-bot` (новое приложение)
- **Конфигурация:** `src/config.ts` — валидация `BOT_TOKEN`, `NEWS_GROUP_URL`, `BOT_ADMIN_UUID`, `DB_DIR` через valibot.
- **ApiApp:** `src/api-app.ts` — фабрика `createApiApp`, собирает `UserModule`, `OnboardingModule`, репозитории.
- **Session:** `src/session.ts` — тип `BotSession` с `questionnaireUuid` и `selectedAnswers`.
- **Bot:** `src/bot.ts` — фабрика `createBot`, подключает `session`, `conversations` middleware.
- **Обработчики:**
  - `/start` — регистрация/поиск пользователя, определение flow, inline-меню.
  - «Быть в курсе» — ссылка на новостную группу.
  - `/cancel` — прерывание conversation, abandon анкеты, очистка session.
- **Conversation:** `src/conversations/onboarding-conversation.ts` — пошаговый опросник:
  - Поддержка `choice` (single/multiple) и `text` вопросов.
  - Множественный выбор с обновлением ✅ и кнопкой «Далее ➡️`.
  - Ветвление после `intensity` → `baseDays`+`baseTime` или `intensiveTime`.
  - Автозавершение анкеты + confirmation + ссылка на группу.
- **Точка входа:** `src/main.ts` — сборка через фабрики и запуск.
- **Тесты:**
  - `config.test.ts` — валидация конфигурации.
  - `start-handler.test.ts` — flow для candidate/subscriber/guest.
  - `onboarding-conversation.test.ts` — прохождение 9 вопросов (choice + text, multiple/single, ветвление).
  - `onboarding-controller.test.ts` — `getStartFlow`, `restartQuestionnaire`.
  - `start-questionnaire-uc.test.ts` — отказ при активной анкете.

### Env-файлы
- `.env.development` / `.env.production` — `BOT_TOKEN`, `NEWS_GROUP_URL`, `BOT_ADMIN_UUID`, `DB_DIR`.

### Зависимости
- Добавлены: `@u7/onboarding`, `@u7/user`, `@grammyjs/conversations`.
- Убран: `dotenv` (Bun читает `.env` автоматически).

## Критерии приёмки (все пройдены)
- [x] Бот отвечает на `/start`, создаёт/находит пользователя.
- [x] Inline-меню «Быть в курсе» / «Стать студентом» работает корректно.
- [x] Conversation проходит все 9 вопросов анкеты (choice + text, multiple/single, ветвление).
- [x] Множественный выбор: кнопки обновляются с ✅, есть кнопка «Далее ➡️`.
- [x] После последнего ответа анкета автоматически завершается, пользователь получает `CANDIDATE`.
- [x] `start-questionnaire` отказывает, если у пользователя уже есть активная анкета.
- [x] `/cancel` прерывает опросник (`abandon-questionnaire`), очищает session.
- [x] Повторный `/start` корректно обрабатывает CANDIDATE, SUBSCRIBER, GUEST.
- [x] Конфигурация через `.env` (Bun загружает автоматически).

## Примечания
- Роль `SUBSCRIBER` выдаётся при вступлении в группу — за рамками этого трека.
- Admin-меню для просмотра заявок — будущий трек.
