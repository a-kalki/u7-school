# План реализации — BotUiApp + контроллер questionnaire

## Фаза 1: shortIds → BotUiApp

- [ ] Task: Перенести сжатие/разжатие из BotController в BotUiApp
    - [ ] Написать тесты на сжатие при отправке BotCommand
    - [ ] Написать тесты на разжатие callback_data при входе
    - [ ] Перенести shortIds, #shrink, #expandData, #compressResponse в BotUiApp
    - [ ] Удалить сжатие из BotController (оставить только маршрутизацию по stories)
    - [ ] Обновить все контроллеры и стори
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 1'

## Фаза 2: BotUiApp.send()

- [ ] Task: Добавить send(telegramId, BotCommand) в BotUiApp
    - [ ] Написать тесты: sendMessage, editMessage, клавиатуры
    - [ ] Написать тесты: captureInput устанавливает activeHandler
    - [ ] Написать тесты: releaseInput сбрасывает activeHandler
    - [ ] Реализовать send() — сжатие + Grammy API + управление session
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 2'

## Фаза 3: TelegramQuestionnaireBotFacade

- [ ] Task: Реализовать TelegramQuestionnaireBotFacade (TDD)
    - [ ] Написать тест: sendQuestionnaireInvite рендерит invite + кнопку «Начать»
    - [ ] Написать тест: startQuestionnaire рендерит вопрос + captureInput
    - [ ] Перенести рендеринг из OnboardingController (#formatQuestionMd, #getKeyboard, #renderActionResponse)
    - [ ] Реализовать sendQuestionnaireInvite(user, InviteResponse)
    - [ ] Реализовать startQuestionnaire(user, QuestionnaireActionResponse)
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 3'

## Фаза 4: Контроллер questionnaire

- [ ] Task: Создать QuestionnaireController
    - [ ] Контроллер `apps/u7-bot/src/controllers/questionnaire/controller.ts`
    - [ ] name = 'questionnaire'
- [ ] Task: Создать FillStory (TDD)
    - [ ] Тест: callback `fill:start:{qId}` → UC start-by-invite → captureInput
    - [ ] Тест: callback `fill:answer:{qId}:{aCode}` → UC handle-action → render response
    - [ ] Тест: text message → UC handle-action(type='text')
    - [ ] Тест: cancel → UC abandon → releaseInput
    - [ ] Реализовать FillStory
- [ ] Task: Зарегистрировать контроллер в create-ui-app.ts
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 4'

## Фаза 5: Очистка OnboardingController

- [ ] Task: Удалить логику анкеты из OnboardingController
    - [ ] Убрать #formatQuestionMd, #getKeyboard, #renderActionResponse (уже перенесены в фазу 3)
    - [ ] Убрать handleCallback/handleMessage для анкеты
    - [ ] Оставить контроллер с заглушкой
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 5'
