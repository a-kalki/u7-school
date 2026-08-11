# Спецификация — Интеграция questionnaire с ботом + рефакторинг BotUiApp

## Обзор

Сделать модуль `questionnaire` полноценным: контроллер бота, инициативная отправка через `BotUiApp.send()`, единый `BotCommand`-контракт. Попутно — централизовать `shortIds` на уровне `BotUiApp`.

## FR1 — shortIds → BotUiApp

Перенести сжатие/разжатие ID из `BotController` в `BotUiApp`:
- Единая мапа `shortIds` на всё приложение
- Сжатие при отправке любого `BotCommand` (из контроллера или `send()`)
- Разжатие при входе (callback), до передачи в контроллер
- Контроллеры и UC работают только с реальными ID

## FR2 — BotUiApp.send(userId, BotCommand)

```typescript
class BotUiApp {
  /** Инициативная отправка сообщения пользователю (минуя контроллер) */
  send(telegramId: number, command: BotCommand): Promise<void>;
}
```

- Принимает `BotCommand` (переименованный `BotResponse`) — тот же контракт, что и return из контроллера
- Внутри: сжатие shortIds, Grammy API, управление `activeHandler` (captureInput/releaseInput)
- **Не принимает** `controllerName` — `BotCommand` сам содержит всё необходимое

## FR3 — QuestionnaireBotFacade

Интерфейс в `packages/questionnaire/src/domain/`:

```typescript
interface QuestionnaireBotFacade {
  startQuestionnaire(userId: number, response: QuestionnaireActionResponse): Promise<void>;
}
```

Реализация — в `apps/u7-bot/src/infra/questionnaire-bot-facade.ts`:
- Знает формат callback_data (answer:X, next:Y) и префикс контроллера `questionnaire:`
- Рендерит `QuestionnaireActionResponse` → `BotCommand` (клавиатуры, текст)
- Вызывает `BotUiApp.send(telegramId, command)`
- Запрашивает `User` через `UserFacade` для получения `telegramId`

## FR4 — Контроллер questionnaire + стори fill

`QuestionnaireController` в `apps/u7-bot/src/controllers/questionnaire/`:
- Стори `fill` — обрабатывает callback и сообщения внутри анкеты
- Вызывает UC `handle-action`, рендерит ответы
- `captureInput: { path: 'questionnaire/fill' }`

## FR5 — Фасад questionnaire (доменный)

Модуль-владелец (onboarding, metrics) вызывает:

```typescript
questionnaireFacade.startQuestionnaire(userId: number, pool: Question[]): Promise<void>
```

Фасад внутри:
1. Создаёт `QuestionnaireAr.startNew(userId, pool)`
2. Сохраняет в репо
3. Вызывает `botFacade.startQuestionnaire(userId, ar.getCurrent())`

Пул передаётся **за один вызов** — без отдельного createIntention. Агрегат сам решает, нужен ли статус intention.

## FR6 — UC слой questionnaire

| UC | Тип | Вход |
|---|---|---|
| `start` | command | `{userId, pool}` |
| `handle-action` | command | `{questionnaireId, type, value}` |
| `abandon` | command | `{questionnaireId}` |
| `get-current` | query | `{questionnaireId}` |
| `get-questionnaire` | query | `{uuid}` |
| `get-questionnaires-by-user` | query | `{userId}` |

- `start` принимает `pool` напрямую, без PoolRegistry
- Все UC используют `userId` вместо `telegramId`
- Из резолвера убрать `questionnaireEngine`

## FR7 — Перенос рендеринга

Рендеринг `QuestionnaireActionResponse → BotCommand` (клавиатуры, форматирование) перенести из `OnboardingController` в `TelegramQuestionnaireBotFacade`.

## Критерии приёмки

- [ ] `shortIds` в `BotUiApp`, контроллеры не знают о сжатии
- [ ] `BotUiApp.send()` работает для инициативной отправки
- [ ] `QuestionnaireBotFacade` реализован в `u7-bot/infra`
- [ ] Контроллер questionnaire принимает callback и ведёт диалог
- [ ] UC слой без `telegramId`, с `userId`, pool передаётся в `start`
- [ ] `bun run check` — чисто
- [ ] Старый `OnboardingController` удалён или оставлен заглушкой

## За рамками

- Полная миграция onboarding на новый контроллер questionnaire (→ отдельный трек)
- Метрики (MetricQuestionnaireAr) — отдельный трек 2.4b
