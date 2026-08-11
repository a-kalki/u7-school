# Спецификация — Домен и UC слой questionnaire

## Обзор

Перепроектировать UC слой модуля `questionnaire`: `user: User` вместо `telegramId`, передача `pool` при старте, intention+start цепочка, доменный фасад — чистое делегирование в UC, интерфейс `QuestionnaireBotFacade`.

## FR1 — UC слой questionnaire

| UC | Тип | Вход |
|---|---|---|
| `start-new` | command | `{user, pool}` |
| `create-intention` | command | `{user}` |
| `start` | command | `{questionnaireId, pool}` |
| `handle-action` | command | `{questionnaireId, type, value}` |
| `abandon` | command | `{questionnaireId}` |
| `get-current` | query | `{questionnaireId}` |
| `get-questionnaire` | query | `{uuid}` |
| `get-questionnaires-by-user` | query | `{userId}` |

- `start-new` — создаёт и сразу запускает анкету (как текущий `start` UC)
- `create-intention` — создаёт анкету в статусе intention, возвращает `{questionnaireId}`
- `start` — запускает существующую анкету (intention → in_progress)
- Все UC используют `user: User` для команд, `userId` для query
- `start` и `start-new` принимают `pool` напрямую от модуля-владельца
- Из резолвера убрать `questionnaireEngine`
- **Все UC пишутся через TDD: сначала тесты, потом реализация**

## FR2 — QuestionnaireBotFacade (интерфейс)

```typescript
// packages/questionnaire/src/domain/bot-facade.ts
interface QuestionnaireBotFacade {
  startQuestionnaire(user: User, response: QuestionnaireActionResponse): Promise<void>;
}
```

Только интерфейс. Реализация — в треке 2 (`u7-bot/infra`).

## FR3 — Доменный фасад (чистое делегирование)

```typescript
class QuestionnaireInProcFacade implements QuestionnaireFacade {
  constructor(private module: QuestionnaireApiModule) {}

  async startNew(user: User, pool: Question[]): Promise<void> {
    const response = await this.module.execute('start-new', { user, pool });
    await this.botFacade.startQuestionnaire(user, response);
  }

  async createIntention(user: User): Promise<string> {
    return this.module.execute('create-intention', { user });
  }

  async start(user: User, questionnaireId: string, pool: Question[]): Promise<void> {
    const response = await this.module.execute('start', { questionnaireId, pool });
    await this.botFacade.startQuestionnaire(user, response);
  }
}
```

Только делегирование в UC + вызов botFacade для старта. Вся логика — в UC.

## FR4 — Резолвер

```typescript
interface QuestionnaireApiModuleResolver {
  questionnaireRepo: QuestionnaireRepo;
  userFacade: UserFacade;
  botFacade: QuestionnaireBotFacade;
  db: BaseJsonDb;
  appResolver: AppResolver;
}
```

## Критерии приёмки

- [ ] 8 UC реализованы с TDD (тесты → код)
- [ ] `start-new` / `create-intention` / `start` — три отдельных UC
- [ ] Доменный фасад — чистое делегирование, без бизнес-логики
- [ ] Фасады принимают `user: User`
- [ ] Агрегат поддерживает оба пути (intention+start и startNew) — проверить/поправить при необходимости
- [ ] `bun run check:p questionnaire` — чисто

## За рамками

- Реализация `TelegramQuestionnaireBotFacade` (→ трек 2)
- Изменения в `BotUiApp` (→ трек 2)
- Контроллер questionnaire (→ трек 2)
