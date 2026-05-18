# План реализации: Рефакторинг u7-bot + onboarding-controller

## Фаза 1: Новый UC `get-current-question` (Onboarding)

- [ ] Task: Создать команду `get-current-question-cmd.ts`
    - [ ] Файл: `packages/onboarding/src/domain/questionnaire/commands/get-current-question-cmd.ts`
    - [ ] Схема: `{ telegramId: number }`
    - [ ] Мета-тип с ошибкой `QuestionnaireNotFoundUcError`
    - [ ] Экспорт из `commands/index.ts` (если есть) и `domain/questionnaire/index.ts`

- [ ] Task: Создать UC `get-current-question-uc.ts`
    - [ ] Файл: `packages/onboarding/src/api/questionnaire/get-current-question-uc.ts`
    - [ ] Имя: `get-current-question`, тип: `query`, `requiresAuth: false`
    - [ ] Находит активную анкету по `telegramId`
    - [ ] Если нет — выбрасывает `QUESTIONNAIRE_NOT_FOUND`
    - [ ] Если есть — вызывает `QuestionnaireAr.getQuestionnaireActionResponse()` и возвращает `QuestionnaireActionResponse`

- [ ] Task: Зарегистрировать UC в модуле и обновить экспорты
    - [ ] `packages/onboarding/src/api/module.ts` — добавить `GetCurrentQuestionUc`
    - [ ] `packages/onboarding/src/domain/module.ts` — добавить мета-тип в `OnboardingUcMetas`
    - [ ] `packages/onboarding/src/api/index.ts` — экспорт UC

- [ ] Task: Написать тесты для `GetCurrentQuestionUc`
    - [ ] Файл: `packages/onboarding/src/api/questionnaire/get-current-question-uc.test.ts`
    - [ ] Тест: возвращает `new_question` для активной анкеты
    - [ ] Тест: выбрасывает `QUESTIONNAIRE_NOT_FOUND` без активной

- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Новый UC get-current-question' (Protocol in workflow.md)

## Фаза 2: Типы BotUpdate / BotResponse и рефакторинг контроллера

- [ ] Task: Обновить `BotUpdate` тип
    - [ ] Файл: `packages/onboarding/src/ui/bot/types.ts`
    - [ ] Добавить команды `start`, `start-onboarding`, `cancel` в union

- [ ] Task: Обновить `BotResponse` тип
    - [ ] Файл: `packages/onboarding/src/ui/bot/types.ts`
    - [ ] Добавить поле `questionnaireCompleted?: true`

- [ ] Task: Переписать `OnboardingController` — убрать `actorId` из конструктора
    - [ ] Файл: `packages/onboarding/src/ui/bot/controller/onboarding-controller.ts`
    - [ ] Удалить поле `#actorId` и параметр конструктора
    - [ ] `handleUpdate(update: BotUpdate, botUuid: string): Promise<BotResponse>`
    - [ ] Все вызовы `apiApp.execute` передают `botUuid` как `actorId`

- [ ] Task: Реализовать обработку команды `start` в контроллере
    - [ ] Возвращает статическое меню (текст + пустая клавиатура/без клавиатуры)
    - [ ] Не делает API-вызовов

- [ ] Task: Реализовать обработку команды `start-onboarding` в контроллере
    - [ ] Вызывает `get-current-question` UC
    - [ ] Если ошибка `QUESTIONNAIRE_NOT_FOUND` → вызывает `start-questionnaire` UC
    - [ ] Рендерит вопрос/клавиатуру как раньше
    - [ ] Добавляет подсказку про `/cancel` в текст первого сообщения

- [ ] Task: Реализовать обработку команды `cancel` в контроллере
    - [ ] Вызывает `abandon-questionnaire` UC
    - [ ] Возвращает ответ с `questionnaireCompleted: true`

- [ ] Task: Удалить обработку `become_student` callback из контроллера
    - [ ] Убрать проверку `update.type === 'callback' && update.data === 'become_student'`
    - [ ] Убедиться, что все пути обрабатывают только команды + message/callback для анкеты

- [ ] Task: Добавить `questionnaireCompleted` в ответ при завершении анкеты
    - [ ] В `#renderActionResponse`: если `response.type === 'completed'` → `botRes.questionnaireCompleted = true`

- [ ] Task: Написать/восстановить тесты контроллера
    - [ ] Файл: `packages/onboarding/src/ui/bot/controller/onboarding-controller.test.ts`
    - [ ] Тест: команда `start` возвращает меню (статический текст)
    - [ ] Тест: `start-onboarding` с новой анкетой → возвращает первый вопрос
    - [ ] Тест: `start-onboarding` с активной анкетой → продолжает (resume)
    - [ ] Тест: ответ на вопрос → `editMessage` + `sendMessage`
    - [ ] Тест: завершение анкеты → `questionnaireCompleted: true`
    - [ ] Тест: `cancel` → `questionnaireCompleted: true`
    - [ ] Тест: `botUuid` передаётся в `apiApp.execute`

- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Типы и контроллер' (Protocol in workflow.md)

## Фаза 3: Рефакторинг Telegram-бота (`apps/u7-bot`)

- [ ] Task: Добавить grammy session middleware
    - [ ] Файл: `apps/u7-bot/src/main.ts` (или новый `apps/u7-bot/src/session.ts`)
    - [ ] Тип сессии: `{ menu: 'main' | 'onboarding' }`
    - [ ] Начальное значение: `{ menu: 'main' }`

- [ ] Task: Верификация бота при старте
    - [ ] Файл: `apps/u7-bot/src/main.ts`
    - [ ] До `bot.start()`: проверить `userFacade.getUserByUuid(config.botAdminUuid)` → существует и `ADMIN`
    - [ ] Если нет — `throw new Error(...)` и процесс падает

- [ ] Task: Обновить `main.ts` — фабрика и регистрация
    - [ ] `createApiApp` должна возвращать `controller` (создаётся без actorId)
    - [ ] `createBot` должна принимать `controller` (но не пробрасывать в хендлеры — хендлеры используют `botUuid` из config)
    - [ ] Зарегистрировать session middleware
    - [ ] Вызвать верификацию бота
    - [ ] Зарегистрировать обработчики команд

- [ ] Task: Переписать `start-handler.ts`
    - [ ] Файл: `apps/u7-bot/src/handlers/start-handler.ts`
    - [ ] Вызвать `userFacade.registerGuest(telegramId, name, botUuid)` (или через apiApp)
    - [ ] `ctx.session.menu = 'main'`
    - [ ] Форвард: `controller.handleUpdate({ type: 'command', command: 'start', telegramId, name }, botUuid)`
    - [ ] Исполнить `BotResponse`
    - [ ] Удалить весь старый код (flow определение, кнопки, callback'и)

- [ ] Task: Добавить обработчик `/link-to-school-group`
    - [ ] Файл: `apps/u7-bot/src/handlers/link-handler.ts`
    - [ ] `bot.command('link-to-school-group', ...)` → отправляет `config.newsGroupUrl`
    - [ ] Без контроллера

- [ ] Task: Добавить обработчик `/start-onboarding`
    - [ ] Файл: `apps/u7-bot/src/handlers/start-onboarding-handler.ts`
    - [ ] `ctx.session.menu = 'onboarding'`
    - [ ] Форвард: `controller.handleUpdate({ type: 'command', command: 'start-onboarding', telegramId, name }, botUuid)`
    - [ ] Исполнить `BotResponse`

- [ ] Task: Переписать `bot.ts` — обработка сообщений и callback'ов в onboarding-меню
    - [ ] Убрать глобальный форвардинг
    - [ ] Форвардить в контроллер ТОЛЬКО если `ctx.session.menu === 'onboarding'`
    - [ ] Для `callback_query:data` — аналогично
    - [ ] При `response.questionnaireCompleted` → `ctx.session.menu = 'main'` → показать меню

- [ ] Task: Добавить обработку `/cancel` внутри onboarding-форвардинга
    - [ ] В `bot.ts` или отдельном обработчике: если `ctx.session.menu === 'onboarding'` → форвард в контроллер
    - [ ] Контроллер возвращает `questionnaireCompleted: true` → сброс меню на `'main'`
    - [ ] Удалить `cancel-handler.ts`

- [ ] Task: Удалить `be-in-the-know-handler.ts`
    - [ ] Файл удалён

- [ ] Task: Написать/обновить тесты обработчиков бота
    - [ ] Файл: `apps/u7-bot/src/handlers/start-handler.test.ts` — обновить под новую логику
    - [ ] Файл: `apps/u7-bot/src/handlers/start-onboarding-handler.test.ts` — новый
    - [ ] Тест: `/start` вызывает `registerGuest` + форвардит в контроллер
    - [ ] Тест: `/start-onboarding` устанавливает `session.menu = 'onboarding'`
    - [ ] Тест: `/link-to-school-group` отправляет ссылку
    - [ ] Тест: сообщение в onboarding-меню форвардится в контроллер
    - [ ] Тест: `questionnaireCompleted` сбрасывает меню

- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Рефакторинг бота' (Protocol in workflow.md)

## Фаза 4: Финальная верификация и очистка

- [ ] Task: Проверка типов — `bun run tslint`
- [ ] Task: Линтер — `bun run lint`
- [ ] Task: Все тесты — `bun test`
- [ ] Task: Покрытие >80% — `bun test --coverage`
- [ ] Task: Исправить все ошибки
- [ ] Task: Обновить экспорты `@u7/onboarding` (если нужно)
- [ ] Task: Conductor - User Manual Verification 'Фаза 4: Финальная верификация' (Protocol in workflow.md)
