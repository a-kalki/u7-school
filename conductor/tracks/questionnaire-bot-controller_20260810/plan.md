# План реализации — BotUiApp + контроллер questionnaire

## Фаза 1: shortIds → BotUiApp

- [ ] Task: Перенести сжатие/разжатие из BotController в BotUiApp
    - [ ] Написать тесты на сжатие BotCommand при отправке
    - [ ] Написать тесты на разжатие callback_data
    - [ ] Перенести shortIds, #shrink, #expandData, #compressResponse в BotUiApp
    - [ ] Удалить сжатие из BotController (оставить только cb())
    - [ ] Обновить все контроллеры
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 1'

## Фаза 2: BotUiApp.send()

- [ ] Task: Добавить send(telegramId, BotCommand) в BotUiApp
    - [ ] Написать тесты — sendMessage, editMessage, клавиатуры, captureInput/releaseInput
    - [ ] Реализовать send() — сжатие + Grammy API + управление session
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 2'

## Фаза 3: TelegramQuestionnaireBotFacade

- [ ] Task: Реализовать TelegramQuestionnaireBotFacade
    - [ ] Создать `apps/u7-bot/src/infra/questionnaire-bot-facade.ts`
    - [ ] Перенести рендеринг из OnboardingController (#formatQuestionMd, #getKeyboard, #renderActionResponse)
    - [ ] Реализовать startQuestionnaire(user, response) → BotCommand → uiApp.send()
    - [ ] Написать unit-тесты с моком BotUiApp
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 3'

## Фаза 4: Контроллер questionnaire

- [ ] Task: Создать QuestionnaireController + стори fill
    - [ ] Контроллер `apps/u7-bot/src/controllers/questionnaire/controller.ts`
    - [ ] Стори fill: handleCallback, handleMessage, handleCancel
    - [ ] Интеграция с UC: handle-action, get-current, abandon
    - [ ] captureInput: questionnaire/fill
    - [ ] Написать тесты
    - [ ] Зарегистрировать в create-ui-app.ts
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 4'

## Фаза 5: Очистка OnboardingController

- [ ] Task: Удалить логику анкеты из OnboardingController
    - [ ] Убрать #formatQuestionMd, #getKeyboard, #renderActionResponse
    - [ ] Убрать handleCallback/handleMessage для анкеты
    - [ ] Оставить контроллер с заглушкой
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 5'
