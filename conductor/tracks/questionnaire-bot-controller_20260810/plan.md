# План реализации — BotUiApp + контроллер questionnaire

> **Связанные документы:** [development-roadmap.md](../../development-roadmap.md) (Релиз 3), [bot-ui-refactoring.md](../../bot-ui-refactoring.md) (Трек 7 — заглушка onboarding)

## Фаза 1: shortIds → BotUiApp

- [x] Task: Перенести сжатие/разжатие из BotController в BotUiApp [343f575]
    - [x] Написать тесты на сжатие при отправке BotCommand
    - [x] Написать тесты на разжатие callback_data при входе
    - [x] Перенести shortIds, #shrink, #expandData, #compressResponse в BotUiApp
    - [x] Удалить сжатие из BotController
    - [x] Обновить контроллеры и стори
    - [x] `bun run check:a u7-bot` — чисто
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

## Фаза 5: Интеграционные и E2E тесты

- [ ] Task: Интеграционный тест FillStory (TDD)
    - [ ] Создать `apps/u7-bot/tests/questionnaire/fill.integration.test.ts`
    - [ ] Сценарий: приглашение → «Начать» → первый вопрос → ответ → следующий вопрос
    - [ ] Сценарий: «Зачем это нужно?» → «Хорошо» → приглашение
    - [ ] Сценарий: «Пропустить» → подтверждение → отказ
    - [ ] Сценарий: одиночный выбор
    - [ ] Сценарий: множественный выбор (toggle + «Далее»)
    - [ ] Сценарий: текстовый ответ
    - [ ] Сценарий: /cancel → подтверждение → отмена
    - [ ] Сценарий: завершение анкеты
    - [ ] `bun run test:a u7-bot -- --pattern questionnaire` — чисто
- [ ] Task: E2E тест (TDD)
    - [ ] Создать `apps/u7-bot/tests/e2e/questionnaire.e2e.test.ts`
    - [ ] Сценарий: sendInvite → fill → complete
    - [ ] Сценарий: sendInvite → decline
    - [ ] `bun run test:a u7-bot -- --pattern questionnaire` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 5'

## Фаза 6: Очистка OnboardingController

- [ ] Task: Удалить логику анкет из OnboardingController
    - [ ] Убрать #formatQuestionMd, #getKeyboard, #renderActionResponse
    - [ ] Убрать handleCallback/handleMessage для анкеты
    - [ ] Оставить контроллер с заглушкой
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 5'
