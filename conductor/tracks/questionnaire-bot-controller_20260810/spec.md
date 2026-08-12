# Спецификация — BotUiApp + контроллер questionnaire

## Обзор

Централизовать `shortIds` в `BotUiApp`, добавить `send()` для инициативной отправки, реализовать `TelegramQuestionnaireBotFacade` (интерфейс из первого трека), создать контроллер questionnaire со стори `fill`.

## FR1 — shortIds → BotUiApp

Перенести сжатие/разжатие ID из `BotController` в `BotUiApp`:
- Единая мапа `shortIds` на всё приложение
- Сжатие при отправке любого `BotCommand` (из контроллера или `send()`)
- Разжатие при входе (callback), до передачи в контроллер
- Контроллеры и UC работают только с реальными ID

## FR2 — BotUiApp.send(telegramId, BotCommand)

```typescript
class BotUiApp {
  send(telegramId: number, command: BotCommand): Promise<void>;
}
```

- Принимает `BotCommand` — тот же контракт, что return из контроллера
- Внутри: сжатие shortIds, Grammy API, управление `activeHandler` (captureInput/releaseInput)
- **Не принимает** `controllerName` — `BotCommand` содержит `captureInput` с полным путём

## FR3 — TelegramQuestionnaireBotFacade

Реализует `QuestionnaireBotFacade` из первого трека. Файл `apps/u7-bot/src/infra/questionnaire-bot-facade.ts`:

```typescript
class TelegramQuestionnaireBotFacade implements QuestionnaireBotFacade {
  sendQuestionnaireInvite(user: User, response: InviteResponse): Promise<void>;
  startQuestionnaire(user: User, response: QuestionnaireActionResponse): Promise<void>;
}
```

- **`sendQuestionnaireInvite`** — рендерит приглашение с кнопкой «Начать»:
  - callback_data: `questionnaire:fill:start:{questionnaireId}`
  - Вызывает `uiApp.send(telegramId, command)`
- **`startQuestionnaire`** — рендерит первый вопрос анкеты:
  - Клавиатура с вариантами ответа / поле ввода для текстового вопроса
  - `captureInput: { path: 'questionnaire/fill' }` — захват управления
  - callback_data: `questionnaire:fill:answer:{qId}:{answerCode}`
  - Вызывает `uiApp.send(telegramId, command)`
- Переносит рендеринг из `OnboardingController` (`#formatQuestionMd`, `#getKeyboard`, `#renderActionResponse`)

## FR4 — Контроллер questionnaire + стори fill

`QuestionnaireController` в `apps/u7-bot/src/controllers/questionnaire/`:

```typescript
export class QuestionnaireController extends U7BotController {
  readonly name = 'questionnaire';
  protected readonly stories = [new FillStory()];
}
```

### Стори fill

| Событие | callback/message | Действие |
|---|---|---|
| Приглашение принято | `fill:start:{qId}` | UC `start-by-invite` → обернуть в `captureInput: questionnaire/fill` |
| Выбран ответ | `fill:answer:{qId}:{aCode}` | UC `handle-action({type:'select', value:aCode})` |
| Текстовый ответ | text message | UC `handle-action({type:'text', value:message})` |
| Отмена | `/cancel` | UC `abandon` → `releaseInput` |

- Вызывает UC через `appApi.execute('questionnaire', 'start-by-invite', ...)` и т.д.
- `start-by-invite` и `handle-action` возвращают `QuestionnaireActionResponse` → рендерит как `BotCommand`

## FR5 — Очистка OnboardingController

- Перенести `#formatQuestionMd`, `#getKeyboard`, `#renderActionResponse` → `TelegramQuestionnaireBotFacade`
- Заглушить/удалить старую логику анкет из `OnboardingController`

## Критерии приёмки

- [ ] `shortIds` в `BotUiApp`, контроллеры не знают о сжатии
- [ ] `BotUiApp.send()` отправляет сообщения и управляет activeHandler
- [ ] `TelegramQuestionnaireBotFacade` реализует оба метода интерфейса
- [ ] Контроллер questionnaire + стори fill обрабатывает invite → start → answer → finish
- [ ] `bun run check` — чисто

## За рамками

- Полная миграция onboarding на новый контроллер (→ отдельный трек)
- Доменные изменения в questionnaire (→ первый трек)
