# Спецификация: Рефакторинг u7-bot + onboarding-controller

## Обзор

Привести слой бота и onboarding-контроллера в соответствие с новой архитектурой, где агрегаты уже принимают решения. Бот становится чистым мостом Telegram ↔ Контроллер, контроллер — переводчиком пользовательский язык ↔ API + рендерер. Управление состоянием меню — через grammy session plugin.

## Функциональные требования

### FR1: Grammy Session Plugin
- Добавить `session` middleware от grammy в бота
- Тип сессии: `{ menu: 'main' | 'onboarding' }`
- `/start` → `menu = 'main'`
- `/start-onboarding` → `menu = 'onboarding'`
- Завершение/отмена анкеты → `menu = 'main'`

### FR2: Верификация бота при старте
- При загрузке бот проверяет через `userFacade.getUserByUuid(BOT_ADMIN_UUID)`, что пользователь с `botAdminUuid` существует и имеет роль `ADMIN`
- Если нет — приложение падает с понятной ошибкой
- `BOT_ADMIN_UUID` берётся из `.env` (уже есть)

### FR3: `/start` (бот)
- Вызывает `userFacade.registerGuest(telegramId, name, botUuid)` — напрямую, без контроллера
- `ctx.session.menu = 'main'`
- Форвардит в контроллер: `controller.handleUpdate({ type: 'command', command: 'start', telegramId, name }, botUuid)`
- Исполняет `BotResponse`

### FR4: Контроллер — команда `start`
- Возвращает дружелюбное меню верхнего уровня (статический текст):
  - `/link-to-school-group` — присоединяйся к группе, чтобы быть в курсе новостей, читать отзывы и общаться со студентами
  - `/start-onboarding` — заполни анкету, расскажи о своих целях и ожиданиях от обучения
- Не делает API-вызовов — чистая статика

### FR5: `/link-to-school-group` (бот)
- Обрабатывается ботом напрямую (без контроллера)
- Отправляет `config.newsGroupUrl`

### FR6: `/start-onboarding` (бот)
- `ctx.session.menu = 'onboarding'`
- Форвардит: `controller.handleUpdate({ type: 'command', command: 'start-onboarding', telegramId, name }, botUuid)`
- Исполняет `BotResponse`

### FR7: Контроллер — команда `start-onboarding`
- Вызывает новый UC `get-current-question({ telegramId })`
  - **Есть активная** → UC возвращает `QuestionnaireActionResponse` с типом `new_question` или `wait_next`
  - **Нет активной** → UC выбрасывает ошибку, контроллер ловит → вызывает `start-questionnaire` UC
- Рендерит вопрос, клавиатуру
- Сообщение-подсказка про `/cancel`

### FR8: Новый UC `get-current-question`
- **Имя:** `get-current-question`
- **Тип:** query
- **Вход:** `{ telegramId: number }`
- **Выход:** `QuestionnaireActionResponse` (тип: `new_question` или `wait_next`)
- **Ошибки:** `QUESTIONNAIRE_NOT_FOUND` — если нет активной анкеты
- `requiresAuth: false`

### FR9: Контроллер — явные команды
- Контроллер принимает команды: `start`, `start-onboarding`, `cancel`
- Контроллер НЕ знает про callback `become_student`
- Все решения о маршрутизации — на боте (через `ctx.session.menu`)

### FR10: Сигнал завершения анкеты
- `BotResponse.questionnaireCompleted?: true`
- Контроллер устанавливает при `type: 'completed'` от агрегата
- Бот: `ctx.session.menu = 'main'`, показывает меню через `controller.handleUpdate({ command: 'start' })`

### FR11: `/cancel` в меню анкеты
- Бот проверяет `ctx.session.menu === 'onboarding'` → форвардит `command: 'cancel'` в контроллер
- Контроллер вызывает `abandon-questionnaire` UC → возвращает ответ с `questionnaireCompleted: true`
- На верхнем уровне `/cancel` не существует (handler удалён)

### FR12: `RegisterGuestUc`
- Не менять: `requiresAuth: true` остаётся
- Бот передаёт `botAdminUuid` как `actorId` — у бота роль `ADMIN`, авторизация проходит
- Логика: если пользователь с `telegramId` есть → вернуть; нет → создать с `GUEST`

### FR13: Очистка бота
- Удалить `be-in-the-know-handler.ts` → заменён на `/link-to-school-group`
- Удалить `cancel-handler.ts` → `/cancel` обрабатывается внутри onboarding-форвардинга
- Переписать `start-handler.ts`
- `bot.ts` — убрать глобальный форвардинг, решение принимается в хендлерах
- `main.ts` — добавить session middleware, верификацию бота

### FR14: `handleUpdate` — `botUuid` в каждом запросе
- Сигнатура: `handleUpdate(update: BotUpdate, botUuid: string): Promise<BotResponse>`
- `botUuid` удалён из конструктора
- `botUuid` пробрасывается как `actorId` во все `apiApp.execute`

## Критерии приёмки

1. Бот стартует → проверяет bot → запускается
2. `/start` → регистрация + меню с `/link-to-school-group` и `/start-onboarding`
3. `/link-to-school-group` → ссылка на группу
4. `/start-onboarding` → первый вопрос (новая анкета) или продолжение (активная)
5. Ответы в анкете → агрегат принимает, контроллер рендерит, бот исполняет
6. `questionnaireCompleted` → возврат в меню через `controller.handleUpdate({ command: 'start' })`
7. `/cancel` в анкете → прерывание, возврат в меню
8. `/cancel` в верхнем меню → команда не существует, grammy игнорирует

## За рамками

- Рендеринг вопросов/клавиатур в контроллере (оставить как есть)
- Onboarding domain/API слой (уже отрефакторен)
- Persistence для grammy session (in-memory)
- Изменение `UserFacade`
- Остальные UC user-модуля
