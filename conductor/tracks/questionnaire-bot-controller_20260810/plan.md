# План реализации — BotUiApp + контроллер questionnaire

## Фаза 1: shortIds → BotUiApp

- [ ] Task: Перенести сжатие/разжатие из BotController в BotUiApp
    - [ ] Написать тесты на сжатие при отправке BotCommand
    - [ ] Написать тесты на разжатие callback_data при входе
    - [ ] Перенести shortIds, #shrink, #expandData, #compressResponse в BotUiApp
    - [ ] Удалить сжатие из BotController
    - [ ] Обновить контроллеры и стори
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 1'

## Фаза 2: BotUiApp.send()

- [ ] Task: Добавить send(telegramId, BotCommand) в BotUiApp
    - [ ] Написать тесты: sendMessage, editMessage, клавиатуры
    - [ ] Написать тесты: captureInput, releaseInput
    - [ ] Реализовать: сжатие + Grammy API + session
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 2'

## Фаза 3: TelegramQuestionnaireBotFacade

- [ ] Task: Реализовать рендеринг (TDD)
    - [ ] Перенести #formatQuestionMd, #getKeyboard, #renderActionResponse из OnboardingController
    - [ ] Тест: sendQuestionnaireInvite — S01 с тремя кнопками (howToFill опциональна)
    - [ ] Тест: startQuestionnaire — S02a (single), S02b (multiple), S03 (text), S04 (completed)
    - [ ] Реализовать sendQuestionnaireInvite(user, InviteResponse)
    - [ ] Реализовать startQuestionnaire(user, QuestionnaireActionResponse)
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 3'

## Фаза 4: Контроллер questionnaire

- [ ] Task: Создать QuestionnaireController
    - [ ] `apps/u7-bot/src/controllers/questionnaire/controller.ts`, name = 'questionnaire'
- [ ] Task: Создать FillStory (TDD)
    - [ ] Тест: `fill:start:{qId}` → UC start-by-invite → captureInput
    - [ ] Тест: `fill:why:{qId}` → UC get-current → editMessage (убрать кнопки) + sendMessage whyText + «Хорошо»
    - [ ] Тест: `fill:decline:{qId}` → confirm → S06a
    - [ ] Тест: `fill:decline-confirm:{qId}` → UC decline-invite → S06b
    - [ ] Тест: `fill:cancel-confirm:{qId}` → UC abandon → S05b
    - [ ] Тест: `fill:current` → возврат к вопросу (editMessage)
    - [ ] Тест: `fill:invite:{qId}` → UC get-current → sendMessage новый S01
    - [ ] Тест: `fill:answer:{qId}:{aCode}` → UC handle-action(type=select) → render
    - [ ] Тест: `fill:next:{qId}` → UC handle-action(type=next-btn) → render
    - [ ] Тест: text message → UC handle-action(type=text) → render
    - [ ] Тест: /cancel → confirm → S05a
    - [ ] Реализовать FillStory
- [ ] Task: Зарегистрировать в create-ui-app.ts
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 4'

## Фаза 5: Очистка OnboardingController

- [ ] Task: Удалить логику анкет из OnboardingController
    - [ ] Убрать #formatQuestionMd, #getKeyboard, #renderActionResponse
    - [ ] Убрать handleCallback/handleMessage для анкеты
    - [ ] Оставить контроллер с заглушкой
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 5'
