# Спецификация: API-слой анкеты onboarding и контроллер бота

## Обзор
Реализовать API-слой (`usecase`, `command`, `module`) для доменного агрегата `Questionnaire` в `@u7/onboarding`. По завершении анкеты (`status === "completed"`) пользователю присваивается роль `CANDIDATE` через вызов `add-role-to-user` модуля `@u7/user`. После генерации всех UC для questionnaire удалить весь устаревший агрегат `Application` (entity, AR, commands, policy, repo, API UC, infra). Контроллер `OnboardingController` в `packages/onboarding/src/ui/bot/controller/` предоставляет удобный интерфейс для Telegram-бота, работающего через `@grammyjs/conversations`.

## Архитектура бота и conversations

### Высокоуровневый контекст через conversations
`@grammyjs/conversations` управляет изолированными диалогами. Бот знает, в каком conversation находится пользователь, и ведёт его по шагам этого диалога. Состояние сохраняется в `session` между сообщениями.

Примеры контекстов:
- `/start` → входит в onboarding-conversation
- `/study` → входит в study-conversation
- `/cancel` → выход из текущего conversation, возврат в главное меню

### Роль controller
`OnboardingController` — это **адаптер между conversation и domain**. Он живёт в пакете `@u7/onboarding` и НЕ знает про `ctx`, `grammy`, `conversations`, `session`.

Controller получает чистые данные и возвращает результат. Conversation решает, когда и как его вызывать, и отвечает за рендеринг (отправку сообщений, inline-клавиатур).

```
┌─────────────────────────────────────────────────────────────┐
│  Бот (apps/u7-bot)                                          │
│  ├─ /start → enter("onboarding")                            │
│  ├─ /cancel → exit conversation                             │
│  └─ Глобальные команды (вне conversation)                   │
├─────────────────────────────────────────────────────────────┤
│  Onboarding Conversation (@grammyjs/conversations)          │
│  ├─ while (!completed) {                                    │
│  │   const q = controller.getCurrentQuestion(uuid)          │
│  │   await ctx.reply(q.text, keyboard)                      │
│  │   const answer = await conversation.waitFor(...)         │
│  │   controller.submitAnswer(uuid, q.code, answer)          │
│  │}                                                         │
│  └─ controller.finish(uuid) → confirmation                  │
├─────────────────────────────────────────────────────────────┤
│  OnboardingController (packages/onboarding/ui/bot/...)      │
│  └─ Знает про UC: start, submit, abandon, preview           │
│     Не знает про Telegram, sessions, conversations          │
└─────────────────────────────────────────────────────────────┘
```

### Методы controller
- `start(userId)` → вызывает `StartQuestionnaireUc`, возвращает `{ questionnaireUuid, firstQuestion }`
- `submitAnswer(uuid, questionCode, value)` → вызывает `SubmitAnswerUc`, возвращает `{ nextQuestion, status, isCompleted }`
- `abandon(uuid)` → вызывает `AbandonQuestionnaireUc`
- `getCurrentQuestion(uuid)` → вызывает `GetQuestionnaireUc`, возвращает текущий вопрос с ответами
- `getAnswersPreview(uuid)` → возвращает текстовый предпросмотр всех ответов
- `canRestart(userId)` → проверяет, можно ли начать новую анкету
- `getKeyboard(question, selectedValues?)` → строит описание inline-клавиатуры (не Telegram-объект, а структуру данных)

## Функциональные требования

### UC анкеты (API)
- `start-questionnaire` — создаёт `QuestionnaireAr.start(userId, poolService, includedQuestionCodes)`, сохраняет в репозиторий, возвращает первый вопрос.
- `submit-answer` — по `questionnaireUuid` загружает анкету, вызывает `submitAnswer(questionCode, value)`, сохраняет состояние. Если после ответа `getNextQuestion()` вернул `null` (completed), вызывает `add-role-to-user` через `UserFacade`, затем сохраняет завершённую анкету. **Явно задокументировать в коде: запись в `QuestionnaireRepo` и вызов `add-role-to-user` выполняются не в транзакции.**
- `get-questionnaire` — получить анкету по UUID.
- `abandon-questionnaire` — прервать анкету (статус `abandoned`).
- `list-questionnaires-by-user` — список всех анкет пользователя (включая completed/abandoned).

### Репозиторий
- `QuestionnaireRepo` — интерфейс: `save`, `getByUuid`, `getByUserId` (возвращает `Questionnaire[]`).
- `QuestionnaireJsonRepo` — реализация на `JsonFileRepo<Questionnaire>`.

### Политика доступа (`QuestionnairePolicy`)
- `canRead(actor, questionnaire)` — владелец, ADMIN, MENTOR.
- `canList(actor)` — ADMIN, MENTOR.
- `canSubmitAnswer(actor, questionnaire)` — только владелец и только если `in_progress`.
- `canAbandon(actor, questionnaire)` — владелец или ADMIN.
- `isOwner(actor, questionnaire)` — проверка по `userId`.

### QuestionPoolService
- Передаётся в `OnboardingApiModule` через `Resolver`.
- Пул вопросов может содержать больше вопросов, чем включается в конкретную анкету. `getIncludedQuestionCodes()` возвращает подмножество кодов вопросов, которые входят в текущую версию анкеты. UC получают список через сервис (`poolService.getIncludedQuestionCodes()`), а не вычисляют сами.
- `StartQuestionnaireUc` и `SubmitAnswerUc` получают сервис из `resolve` и хранят ссылку (не создают каждый раз).

### Обновление роли при завершении
- UC вызывает `UserFacade.addRoleToUser(userId, CANDIDATE)`.
- Нет транзакционной связи между сохранением анкеты и обновлением роли — документировать в комментарии.

### Удаление Application
- Удалить: `domain/application/` (весь), `api/application/*`, `infra/db/application-json-repo*`, `domain/onboarding-ds.ts`.
- Обновить `domain/index.ts`, `api/module.ts`, `infra/index.ts`, `api/index.ts`.
- `CreateApplicationUc` → логика мигрирует в `SubmitAnswerUc` (завершение анкеты = роль CANDIDATE).

## Нефункциональные требования
- TDD: падающие тесты → реализация → зелёные тесты.
- Покрытие >80%.
- Каждый UC тестируется со всеми потоками (успех, not-found, validation, completed).
- `bun run check:p onboarding` проходит без ошибок.

## Критерии приёмки
- [ ] `start-questionnaire` создаёт анкету и возвращает первый вопрос.
- [ ] `submit-answer` валидирует ответ, переходит к следующему вопросу, сохраняет состояние.
- [ ] При завершении анкеты пользователь получает роль `CANDIDATE` через user facade.
- [ ] `get-questionnaire` возвращает анкету по UUID.
- [ ] `abandon-questionnaire` прерывает анкету.
- [ ] `list-questionnaires-by-user` возвращает все анкеты пользователя.
- [ ] `QuestionnairePolicy` корректно проверяет права.
- [ ] Все UC покрыты тестами.
- [ ] Весь код агрегата `Application` удалён.
- [ ] `bun run check:p onboarding` — чисто.
- [ ] `OnboardingController` предоставляет чистый API для conversation.
- [ ] Controller не зависит от Telegram/grammy.

## За рамками
- Telegram-флоу бота (handlers, conversations в `apps/u7-bot`) — отдельный трек.
- Статистика и дашборды.
- Admin-меню.
- SUBSCRIBER роль (вступление в группу).
