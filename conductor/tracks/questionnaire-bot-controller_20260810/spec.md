# Спецификация — BotUiApp + контроллер questionnaire

> **Связанные документы:** [development-roadmap.md](../../development-roadmap.md) (Релиз 3), [bot-ui-refactoring.md](../../bot-ui-refactoring.md) (Трек 7 — заглушка onboarding), [metrics-system.md](../../metrics-system.md)
> **Смежный трек:** [questionnaire-domain-uc](../questionnaire-domain-uc_20260810/spec.md) — домен/UC слой (выполняется первым)

## Обзор

Централизовать `shortIds` в `BotUiApp`, добавить `send()` для инициативной отправки, реализовать `TelegramQuestionnaireBotFacade` (интерфейс из первого трека), создать контроллер questionnaire со стори `fill`. Реализовать экраны с `ui-spec.md`.

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

### Реализация
Обсудить, какова будет реализация если логика рендеринга будет одна и таже для стори и фасада? Как не дублировать логику?

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
| `fill:why:{qId}` | `get-current` | sendMessage whyText + «Хорошо» |
| `fill:invite:{qId}` | `get-current` | sendMessage: новый S01 |
| `fill:decline:{qId}` | — | `confirm('decline', ...)` → S06a |
| `fill:decline-confirm:{qId}` | `decline-invite` | Render → S06b |
| `fill:cancel-confirm:{qId}` | `abandon` | Render → S05b |
| `fill:current` | `get-current` | Возврат к текущему вопросу |
| `fill:answer:{qId}:{aCode}` | `handle-action({type:'select'})` | Render |
| `fill:next:{qId}` | `handle-action({type:'next-btn'})` | Render |
| text message | `handle-action({type:'text'})` | Render |
| `/cancel` | — | `confirm('cancel', ...)` → S05a |

### Особенности
- Подтверждение через `confirm()` из `BotUserStory` (S05a, S06a)
- `fill:why` вызывает `get-current` для получения `InviteResponse`; `fill:decline`/`fill:cancel` (первый клик) — не вызывают UC
- Завершение (S04) — `releaseInput` + `questionnaireCompleted: true`
- Отмена/отказ (S05b/S06b) — `releaseInput` + подтверждение отмены/отказа

## FR6 — Интеграционные и E2E тесты

### Интеграционный: `apps/u7-bot/tests/questionnaire/fill.integration.test.ts`
- Полный путь пользователя через UiApp.handleCallback / handleMessage
- Моки: QuestionnaireJsonRepo с fixture-данными, MockTgFacade
- Сценарии:
  - Приглашение → «Начать» → первый вопрос
  - «Зачем это нужно?» → «Хорошо» → приглашение
  - «Пропустить» → подтверждение → отказ
  - Одиночный выбор → следующий вопрос
  - Множественный выбор (toggle + «Далее»)
  - Текстовый ответ
  - /cancel → подтверждение → отмена
  - Завершение анкеты

### E2E: `apps/u7-bot/tests/e2e/questionnaire.e2e.test.ts`
- Полный стек с реальной JSON-БД (временная директория)
- Реальные QuestionnaireApiModule + QuestionnaireJsonRepo
- Мок QuestionnaireBotFacade (заглушка, т.к. нет Telegram API)
- Сценарий: sendInvite → fill → complete, sendInvite → decline

## FR7 — Очистка OnboardingController

- Перенести `#formatQuestionMd`, `#getKeyboard`, `#renderActionResponse` → `TelegramQuestionnaireBotFacade`
- Заглушить/удалить старую логику анкет

## Критерии приёмки

- [ ] `shortIds` в `BotUiApp`
- [ ] `BotUiApp.send()` отправляет и управляет activeHandler
- [ ] `TelegramQuestionnaireBotFacade` — оба метода, 10 экранов
- [ ] Контроллер + стори fill — 11 обработчиков, включая why и decline-confirm
- [ ] Интеграционный тест: 8 сценариев, все проходят
- [ ] E2E тест: полный цикл sendInvite → fill → complete и sendInvite → decline
- [ ] `bun run check` — чисто

## За рамками

- Полная миграция onboarding → отдельный трек
- Доменные изменения → первый трек
