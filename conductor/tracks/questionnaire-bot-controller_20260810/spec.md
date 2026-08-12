# Спецификация — BotUiApp + контроллер questionnaire

## Обзор

Централизовать `shortIds` в `BotUiApp`, добавить `send()` для инициативной отправки, реализовать `TelegramQuestionnaireBotFacade` (интерфейс из первого трека), создать контроллер questionnaire со стори `fill`. Поддерживает 10 экранов: S01 (приглашение), S02a/S02b (выбор), S03 (текст), S04 (завершение), S05a/S05b (отмена), S06a/S06b (отказ).

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
  - `❔ Зачем это нужно?` → `questionnaire:fill:why:{qId}` (только если `whyText` есть)
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
| `fill:start:{qId}` | `start-by-invite` | Render + `captureInput: questionnaire/fill` |
| `fill:why:{qId}` | — | `sendMessage` с whyText |
| `fill:decline:{qId}` | — | `confirm('decline', ...)` → S06a |
| `fill:decline-confirm:{qId}` | `decline-invite` | Render → S06b |
| `fill:cancel-confirm:{qId}` | `abandon` | Render → S05b |
| `fill:current` | — | Возврат к текущему вопросу |
| `fill:invite:{qId}` | — | Возврат к S01 |
| `fill:answer:{qId}:{aCode}` | `handle-action({type:'select'})` | Render |
| `fill:next:{qId}` | `handle-action({type:'next-btn'})` | Render |
| text message | `handle-action({type:'text'})` | Render |
| `/cancel` | — | `confirm('cancel', ...)` → S05a |

### Особенности
- Подтверждение через `confirm()` из `BotUserStory` (S05a, S06a)
- `fill:why` и `fill:decline`/`fill:cancel` (первый клик) — не вызывают UC
- Завершение (S04) — `releaseInput` + `questionnaireCompleted: true`
- Отмена/отказ (S05b/S06b) — `releaseInput` + cancelWarning из pool

## FR5 — Очистка OnboardingController

- Перенести `#formatQuestionMd`, `#getKeyboard`, `#renderActionResponse` → `TelegramQuestionnaireBotFacade`
- Заглушить/удалить старую логику анкет

## Критерии приёмки

- [ ] `shortIds` в `BotUiApp`
- [ ] `BotUiApp.send()` отправляет и управляет activeHandler
- [ ] `TelegramQuestionnaireBotFacade` — оба метода, 10 экранов
- [ ] Контроллер + стори fill — 11 обработчиков, включая why и decline-confirm
- [ ] `bun run check` — чисто

## За рамками

- Полная миграция onboarding → отдельный трек
- Доменные изменения → первый трек
