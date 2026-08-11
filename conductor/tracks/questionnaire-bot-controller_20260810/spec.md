# Спецификация — BotUiApp + контроллер questionnaire

## Обзор

Централизовать `shortIds` в `BotUiApp`, добавить `send()` для инициативной отправки, реализовать `TelegramQuestionnaireBotFacade`, создать контроллер questionnaire со стори.

## FR1 — shortIds → BotUiApp

Перенести сжатие/разжатие ID из `BotController` в `BotUiApp`:
- Единая мапа `shortIds` на всё приложение
- Сжатие при отправке любого `BotCommand` (из контроллера или `send()`)
- Разжатие при входе (callback), до передачи в контроллер
- Контроллеры и UC работают только с реальными ID

## FR2 — BotUiApp.send(userId, BotCommand)

```typescript
class BotUiApp {
  send(telegramId: number, command: BotCommand): Promise<void>;
}
```

- Принимает `BotCommand` (переименованный `BotResponse`) — тот же контракт, что return из контроллера
- Внутри: сжатие shortIds, Grammy API, управление `activeHandler` (captureInput/releaseInput)
- **Не принимает** `controllerName` — `BotCommand` сам содержит всё

## FR3 — TelegramQuestionnaireBotFacade

Реализация в `apps/u7-bot/src/infra/questionnaire-bot-facade.ts`:
- Знает формат callback_data (answer:X, next:Y) и префикс контроллера `questionnaire:`
- Рендерит `QuestionnaireActionResponse` → `BotCommand` (клавиатуры, текст)
- Вызывает `BotUiApp.send(telegramId, command)`
- Принимает `user: User` (telegramId внутри)

## FR4 — Контроллер questionnaire + стори fill

`QuestionnaireController` в `apps/u7-bot/src/controllers/questionnaire/`:
- Стори `fill` — handleCallback (answer:X, next:Y), handleMessage (text), handleCancel (abandon)
- Вызывает UC `handle-action`, `abandon`
- `captureInput: { path: 'questionnaire/fill' }`

## FR5 — Перенос рендеринга + очистка OnboardingController

- Перенести `#formatQuestionMd`, `#getKeyboard`, `#renderActionResponse` из `OnboardingController` в `TelegramQuestionnaireBotFacade`
- Удалить/заглушить старую логику анкет из `OnboardingController`

## Критерии приёмки

- [ ] `shortIds` в `BotUiApp`, контроллеры не знают о сжатии
- [ ] `BotUiApp.send()` работает для инициативной отправки
- [ ] `TelegramQuestionnaireBotFacade` реализован
- [ ] Контроллер questionnaire принимает callback и ведёт диалог
- [ ] `bun run check` — чисто

## За рамками

- Полная миграция onboarding на новый контроллер (→ отдельный трек)
- Доменные изменения в questionnaire (→ первый трек)
