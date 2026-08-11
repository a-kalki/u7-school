# Спецификация — Домен и UC слой questionnaire

## Обзор

Перепроектировать UC слой модуля `questionnaire`: `userId` вместо `telegramId`, передача `pool` при старте, доменный фасад через proc-in логику, интерфейс `QuestionnaireBotFacade`.

## FR1 — UC слой questionnaire

| UC | Тип | Вход |
|---|---|---|
| `start` | command | `{userId, pool}` |
| `handle-action` | command | `{questionnaireId, type, value}` |
| `abandon` | command | `{questionnaireId}` |
| `get-current` | query | `{questionnaireId}` |
| `get-questionnaire` | query | `{uuid}` |
| `get-questionnaires-by-user` | query | `{userId}` |

- Все UC используют `userId` вместо `telegramId`
- `start` принимает `pool` напрямую — модуль-владелец передаёт его при вызове
- Из резолвера убрать `questionnaireEngine`

## FR2 — QuestionnaireBotFacade (интерфейс)

```typescript
// packages/questionnaire/src/domain/
interface QuestionnaireBotFacade {
  startQuestionnaire(user: User, response: QuestionnaireActionResponse): Promise<void>;
}
```

Только интерфейс. Реализация — во втором треке (`u7-bot/infra`).

## FR3 — Доменный фасад questionnaire

```typescript
questionnaireFacade.startQuestionnaire(userId: number, pool: Question[]): Promise<void>
```

Внутри:
1. Дёргает UC `start` через proc-in логику (как другие фасады: `this.module.execute(...)`)
2. UC `start` создаёт `QuestionnaireAr.startNew(userId, pool)`, сохраняет, возвращает `QuestionnaireActionResponse`
3. Фасад вызывает `botFacade.startQuestionnaire(user, response)`

## FR4 — Резолвер

```typescript
interface QuestionnaireApiModuleResolver {
  questionnaireRepo: QuestionnaireRepo;
  botFacade: QuestionnaireBotFacade;
  userFacade: UserFacade;
  db: BaseJsonDb;
  appResolver: AppResolver;
}
```

## Критерии приёмки

- [ ] Все 6 UC реализованы с `userId`
- [ ] `start` UC принимает `pool`, создаёт `startNew`
- [ ] `QuestionnaireBotFacade` интерфейс объявлен
- [ ] Доменный фасад `startQuestionnaire` реализован через proc-in
- [ ] Тесты на UC и фасад
- [ ] `bun run check:p questionnaire` — чисто

## За рамками

- Реализация `TelegramQuestionnaireBotFacade` (→ второй трек)
- Изменения в `BotUiApp` (→ второй трек)
- Контроллер questionnaire (→ второй трек)
