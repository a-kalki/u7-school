# План реализации Stateless Bot & Controller

- [ ] Task: 1. Определение контрактов UI
    - [ ] Создать в `packages/onboarding/src/ui/bot/types.ts` типы `BotUpdate` (message, callback, command) и `BotResponse` (sendMessage, editMessage, answerCallback).

- [ ] Task: 2. Рефакторинг OnboardingController
    - [ ] Переписать тесты `onboarding-controller.test.ts` с учётом нового контракта `handleUpdate(update)`.
    - [ ] Переписать `OnboardingController`:
        - [ ] Запрашивать текущее состояние через `get-onboarding-state-uc`.
        - [ ] Обрабатывать логику ответов (включая множественный выбор с черновиками).
        - [ ] Формировать `BotResponse[]` на основе изменений.

- [ ] Task: 3. Рефакторинг u7-bot
    - [ ] Удалить файлы `conversations/` из бота.
    - [ ] Изменить `bot.ts`: убрать `bot.use(conversations())`.
    - [ ] Реализовать глобальный middleware/handler в боте для перехвата сообщений:
        - [ ] Если `update.message.text === '/cancel'` и есть активная анкета, прервать.
        - [ ] Получать стейт, маршрутизировать события анкеты в контроллер и выполнять возвращённые `BotResponse`.
    - [ ] Обновить `start-handler.ts`, `cancel-handler.ts` под новую парадигму.

- [ ] Task: Conductor - User Manual Verification 'Stateless Bot & Controller' (Protocol in workflow.md)
