# План реализации: Рефакторинг u7-bot + onboarding-controller

## Фаза 1: Новый UC `get-current-question` (Onboarding) [checkpoint: 3c139ab]

- [x] Task: Создать команду `get-current-question-cmd.ts`
    - [x] Файл: `packages/onboarding/src/domain/questionnaire/commands/get-current-question-cmd.ts`
    - [x] Схема: `{ telegramId: number }`
    - [x] Мета-тип с ошибкой `QuestionnaireNotFoundUcError`

- [x] Task: Создать UC `get-current-question-uc.ts`
    - [x] Файл: `packages/onboarding/src/api/questionnaire/get-current-question-uc.ts`
    - [x] Имя: `get-current-question`, тип: `query`, `requiresAuth: false`
    - [x] Находит активную анкету по `telegramId`
    - [x] Если нет — выбрасывает `QUESTIONNAIRE_NOT_FOUND`
    - [x] Если есть — вызывает `QuestionnaireAr.getQuestionnaireActionResponse()` и возвращает `QuestionnaireActionResponse`

- [x] Task: Зарегистрировать UC в модуле и обновить экспорты
    - [x] `packages/onboarding/src/api/module.ts` — добавить `GetCurrentQuestionUc`
    - [x] `packages/onboarding/src/domain/module.ts` — добавить мета-тип в `OnboardingUcMetas`

- [x] Task: Написать тесты для `GetCurrentQuestionUc`
    - [x] Файл: `packages/onboarding/src/api/questionnaire/get-current-question-uc.test.ts`
    - [x] Тест: возвращает `new_question` для активной анкеты
    - [x] Тест: выбрасывает `QUESTIONNAIRE_NOT_FOUND` без активной
    - [x] Тест: отклоняет невалидную команду

- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Новый UC get-current-question' (Protocol in workflow.md)

## Фаза 2: Типы BotUpdate / BotResponse и рефакторинг контроллера [checkpoint: 03a7822]

- [x] Task: Обновить `BotUpdate` тип
    - [x] Файл: `packages/onboarding/src/ui/bot/types.ts`
    - [x] Команды `start`, `cancel` уже поддерживаются через `command: string`

- [x] Task: Обновить `BotResponse` тип
    - [x] Файл: `packages/onboarding/src/ui/bot/types.ts`
    - [x] Добавить поле `questionnaireCompleted?: true`

- [x] Task: Переписать `OnboardingController` — убрать `actorId`, изменить команды
    - [x] `handleUpdate(update: BotUpdate, botUuid: string): Promise<BotResponse>`
    - [x] Команда `start` → начать/продолжить анкету (StartUc возвращает QuestionnaireActionResponse)
    - [x] Команда `cancel` → прервать анкету
    - [x] Сообщения/callback'и → handle-action UC
    - [x] Главное меню рендерит бот (не контроллер)
    - [x] Удалён `become_student` callback

- [x] Task: StartUc и AbandonUc → QuestionnaireActionResponse
    - [x] StartUc возвращает `ar.getQuestionnaireActionResponse()` вместо `ar.state`
    - [x] AbandonUc возвращает `{ type: 'completed' }` вместо `ar.state`
    - [x] Убран лишний `get-current-question` после `start` в контроллере
    - [x] Обновлены тесты

- [x] Task: safeHandleUpdate — try/catch обёртка
    - [x] Файл: `packages/onboarding/src/ui/bot/controller/controller-executor.ts`
    - [x] Гарантирует, что исключение контроллера не просочится в бота
    - [x] Экспортирован из `@u7/onboarding`

- [x] Task: Написать/восстановить тесты
    - [x] 6 тестов контроллера (start новая, start продолжение, ответ, cancel, ошибка)
    - [x] Тесты StartUc и AbandonUc обновлены под новый выходной тип
    - [x] module.test.ts обновлён

- [x] Task: Conductor - User Manual Verification 'Фаза 2: Типы и контроллер' (Protocol in workflow.md)

## Фаза 3: Рефакторинг Telegram-бота (`apps/u7-bot`)

- [x] Task: Добавить grammy session middleware
    - [x] Файл: `apps/u7-bot/src/bot.ts`
    - [x] Тип сессии: `{ menu: 'main' | 'onboarding' }`, инициализация: `{ menu: 'main' }`

- [x] Task: Верификация бота при старте
    - [x] Файл: `apps/u7-bot/src/main.ts`
    - [x] До `bot.start()`: `apiApp.execute('get-user-by-uuid', {uuid: config.botAdminUuid})` → существует и `ADMIN`
    - [x] Если нет — `throw new Error(...)`

- [x] Task: Обновить `main.ts` — фабрика и регистрация
    - [x] `controller = new OnboardingController(apiApp)` — без actorId
    - [x] `createBot(config, controller)` — без apiApp
    - [x] Верификация бота перед стартом
    - [x] Зарегистрированы: start, link, start_onboarding обработчики

- [x] Task: Переписать `start-handler.ts`
    - [x] Вызывает `apiApp.execute('register-guest', ...)` — идемпотентно
    - [x] `ctx.session.menu = 'main'`
    - [x] Бот САМ показывает главное меню (без контроллера)
    - [x] Удалён старый код (flow, кнопки, callback'и)

- [x] Task: Добавить обработчик `/link_to_school_group`
    - [x] Файл: `apps/u7-bot/src/handlers/link-handler.ts`
    - [x] Отправляет `config.newsGroupUrl` — без контроллера

- [x] Task: Добавить обработчик `/start_onboarding`
    - [x] Файл: `apps/u7-bot/src/handlers/start-onboarding-handler.ts`
    - [x] `ctx.session.menu = 'onboarding'`
    - [x] Форвардит `controller.handleUpdate({command: 'start'}, botUuid)`

- [x] Task: Переписать `bot.ts` — session-роутинг
    - [x] Убран глобальный форвардинг
    - [x] Сообщения/callback'и форвардятся только если `menu === 'onboarding'`
    - [x] `response.questionnaireCompleted` → `ctx.session.menu = 'main'`
    - [x] `/cancel` внутри onboarding-меню → форвард в контроллер

- [x] Task: Удалить старые хендлеры
    - [x] Удалён `cancel-handler.ts`
    - [x] Удалён `be-in-the-know-handler.ts`

- [x] Task: Добавить try/catch обёртку
    - [x] Встроена внутрь `controller.handleUpdate` — исключения не просачиваются

- [x] Task: Написать/обновить тесты
    - [x] `start-handler.test.ts`: 4 теста (регистрация, registerGuest, меню, fault tolerance)
    - [x] `start-onboarding-handler.test.ts`: 3 теста (регистрация, menu=onboarding, форвард)

- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Рефакторинг бота' (Protocol in workflow.md)

## Фаза 4: Финальная верификация и очистка

- [ ] Task: Проверка типов — `bun run tslint`
- [ ] Task: Линтер — `bun run lint`
- [ ] Task: Все тесты — `bun test`
- [ ] Task: Покрытие >80% — `bun test --coverage`
- [ ] Task: Исправить все ошибки
- [ ] Task: Обновить экспорты `@u7/onboarding` (если нужно)
- [ ] Task: Conductor - User Manual Verification 'Фаза 4: Финальная верификация' (Protocol in workflow.md)
