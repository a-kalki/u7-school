# Спецификация — BotUiApp + контроллер questionnaire

## Обзор

Централизовать `shortIds` в `BotUiApp`, добавить `send()` для инициативной отправки, реализовать `TelegramQuestionnaireBotFacade` (интерфейс из первого трека), создать контроллер questionnaire со стори `fill`. Поддерживает 6 экранов: S01 (приглашение), S02a/S02b (выбор), S03 (текст), S04 (завершение), S05 (отмена), S06 (отказ).

## FR1 — shortIds → BotUiApp

Перенести сжатие/разжатие ID из `BotController` в `BotUiApp`:
- Единая мапа `shortIds` на всё приложение
- Сжатие при отправке, разжатие при входе
- Контроллеры работают только с реальными ID

## FR2 — BotUiApp.send(telegramId, BotCommand)

```typescript
class BotUiApp {
  send(telegramId: number, command: BotCommand): Promise<void>;
}
```

- Принимает `BotCommand`, управляет `activeHandler` (captureInput/releaseInput)
- Без параметра `controllerName`

## FR3 — TelegramQuestionnaireBotFacade

Реализует `QuestionnaireBotFacade`. Файл `apps/u7-bot/src/infra/questionnaire-bot-facade.ts`:

### sendQuestionnaireInvite(user, InviteResponse)
- Рендерит S01: `📋 *Анкета*` + `inviteText`
- Кнопки:
  - `▶️ Начать заполнение` → `questionnaire:fill:start:{qId}`
  - `❔ Как заполнять?` → `questionnaire:fill:howto:{qId}` (только если `howToFill` есть)
  - `⏭️ Пропустить` → `questionnaire:fill:decline:{qId}`
- Вызывает `uiApp.send(telegramId, command)`

### startQuestionnaire(user, QuestionnaireActionResponse)
- Рендерит вопрос (S02a/S02b/S03) или S04 (завершение)
- Для вопросов: клавиатура вариантов / поле ввода, `captureInput: { path: 'questionnaire/fill' }`
- Для завершения: `completionText`, кнопка `↩️ Главное меню`, `releaseInput`
- Переносит рендеринг из `OnboardingController`

## FR4 — Контроллер questionnaire + стори fill

`QuestionnaireController` в `apps/u7-bot/src/controllers/questionnaire/`:

```typescript
class QuestionnaireController extends U7BotController {
  readonly name = 'questionnaire';
  protected readonly stories = [new FillStory()];
}
```

### FillStory — обработчики

| Событие | UC | Действие |
|---|---|---|
| `fill:start:{qId}` | `start-by-invite` | Render ответа + `captureInput: questionnaire/fill` |
| `fill:howto:{qId}` | — | `answerCallbackQuery` с howToFill из pool |
| `fill:decline:{qId}` | `decline-invite` | Render cancelWarning |
| `fill:answer:{qId}:{aCode}` | `handle-action({type:'select', value:aCode})` | Render ответа |
| `fill:next:{qId}` | `handle-action({type:'next-btn'})` | Render ответа |
| text message | `handle-action({type:'text', value:text})` | Render ответа |
| `/cancel` | `abandon({questionnaireId})` | Render cancelWarning + releaseInput |

### Особенности
- `fill:howto` — не вызывает UC, показывает текст через `answerCallbackQuery` (popup)
- `fill:decline` — UC `decline-invite` (новый, 9-й UC)
- Завершение (S04) — `releaseInput` + `questionnaireCompleted: true`
- Отмена/отказ (S05/S06) — `releaseInput` + cancelWarning из pool

## FR5 — Очистка OnboardingController

- Перенести `#formatQuestionMd`, `#getKeyboard`, `#renderActionResponse` → `TelegramQuestionnaireBotFacade`
- Заглушить/удалить старую логику анкет

## Критерии приёмки

- [ ] `shortIds` в `BotUiApp`
- [ ] `BotUiApp.send()` отправляет и управляет activeHandler
- [ ] `TelegramQuestionnaireBotFacade` — оба метода, 6 экранов
- [ ] Контроллер + стори fill — 7 обработчиков, включая howto и decline
- [ ] `bun run check` — чисто

## За рамками

- Полная миграция onboarding → отдельный трек
- Доменные изменения → первый трек
