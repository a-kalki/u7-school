# План реализации — Интеграция questionnaire с ботом

## Фаза 1: shortIds → BotUiApp

- [ ] Task: Перенести сжатие/разжатие ID из BotController в BotUiApp
    - [ ] Написать тесты на `BotUiApp` — сжатие `BotCommand` при отправке
    - [ ] Написать тесты на `BotUiApp` — разжатие callback_data
    - [ ] Перенести `shortIds`, `#shrink`, `#expandData`, `#compressResponse` в `BotUiApp`
    - [ ] Удалить сжатие из `BotController` (оставить только `cb()` с префиксом контроллера)
    - [ ] Обновить все контроллеры — убрать `#compressAction` из return
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 1'

## Фаза 2: BotUiApp.send()

- [ ] Task: Добавить `send(telegramId, BotCommand)` в BotUiApp
    - [ ] Написать тесты — sendMessage, editMessage, клавиатуры
    - [ ] Написать тесты — captureInput / releaseInput через send
    - [ ] Реализовать `send()` — сжатие shortIds + Grammy API + управление session
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 2'

## Фаза 3: UC слой questionnaire

- [ ] Task: Перепроектировать UC слой
    - [ ] Убрать `telegramId`, заменить на `userId` во всех UC
    - [ ] Убрать `questionnaireEngine` из резолвера
    - [ ] `start` UC — принимает `{userId, pool}`, создаёт `startNew`, сохраняет
    - [ ] `handle-action` — принимает `{questionnaireId, type, value}`
    - [ ] `abandon` — принимает `{questionnaireId}`
    - [ ] Добавить `get-current` query UC
    - [ ] Обновить `uc-metas.ts` — типизировать output
    - [ ] Написать/обновить тесты
    - [ ] `bun run check:p questionnaire` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 3'

## Фаза 4: QuestionnaireBotFacade

- [ ] Task: Интерфейс QuestionnaireBotFacade
    - [ ] Объявить `QuestionnaireBotFacade` в `domain/facade.ts` или отдельным файлом
    - [ ] Один метод: `startQuestionnaire(userId, QuestionnaireActionResponse)`
- [ ] Task: Реализация TelegramQuestionnaireBotFacade
    - [ ] Создать `apps/u7-bot/src/infra/questionnaire-bot-facade.ts`
    - [ ] Реализовать `startQuestionnaire` — UserFacade для telegramId, рендеринг → BotCommand, uiApp.send()
    - [ ] Перенести рендеринг из OnboardingController (#formatQuestionMd, #getKeyboard)
    - [ ] Написать тесты (unit, с моком BotUiApp)
    - [ ] Добавить `botFacade` в резолвер questionnaire
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 4'

## Фаза 5: Контроллер questionnaire

- [ ] Task: Создать QuestionnaireController + стори fill
    - [ ] Контроллер `apps/u7-bot/src/controllers/questionnaire/controller.ts`
    - [ ] Стори `fill` — handleCallback (answer:X, next:Y), handleMessage (text), handleCancel (abandon)
    - [ ] Интеграция с UC: handle-action, get-current
    - [ ] captureInput: `questionnaire/fill`
    - [ ] Написать тесты контроллера и стори
    - [ ] Зарегистрировать контроллер в `create-ui-app.ts`
    - [ ] `bun run check:a u7-bot` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 5'

## Фаза 6: Доменный фасад questionnaire

- [ ] Task: QuestionnaireFacade.startQuestionnaire(userId, pool)
    - [ ] Реализовать метод фасада: создать Ar, сохранить, дёрнуть botFacade
    - [ ] Написать тесты
    - [ ] `bun run check:p questionnaire` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 6'

## Фаза 7: Очистка onboarding

- [ ] Task: Удалить/заглушить старый OnboardingController
    - [ ] Удалить логику анкеты из OnboardingController
    - [ ] Оставить контроллер с заглушкой (или удалить полностью если не нужен)
    - [ ] Обновить регистрацию контроллеров
    - [ ] `bun run check` — чисто
- [ ] Task: Conductor - Ручная верификация 'Фаза 7'
