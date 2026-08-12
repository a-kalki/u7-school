# Спецификация — Домен и UC слой questionnaire

## Обзор

Перепроектировать UC слой: `user: User`, pool при создании, статус `invited`, агрегат `create→createInvite/start`, UC сам вызывает botFacade, фасад — чистое делегирование.

## FR1 — Агрегат QuestionnaireAr (доработка)

```typescript
// Фабрика — создаёт агрегат с пулом, статус invited
static create(respondentId: number, pool: Question[]): QuestionnaireAr

// Создать приглашение (возвращает InviteResponse для botFacade)
createInvite(): InviteResponse

// Запустить анкету (invited → in_progress, engine из сохранённого pool)
start(): QuestionnaireActionResponse
```

- Статус `invited` вместо `intention`
- `InviteResponse` вместо `IntentionResponse` (в types.ts)
- `create()` принимает pool сразу — сохраняет снимок в состоянии
- `start()` без параметров — использует сохранённый pool
- Старый `start(pool)` и `createIntention` удалить
- Старый `startNew` оставить (create + start за один шаг) или сделать хелпером

## FR2 — QuestionnaireBotFacade (интерфейс)

```typescript
interface QuestionnaireBotFacade {
  /** Отправить пользователю приглашение заполнить анкету */
  sendQuestionnaireInvite(user: User, response: InviteResponse): Promise<void>;

  /** Отправить первый вопрос анкеты и захватить управление */
  startQuestionnaire(user: User, response: QuestionnaireActionResponse): Promise<void>;
}
```

Только интерфейс в `packages/questionnaire/src/domain/bot-facade.ts`.

## FR3 — UC слой (все TDD)

| UC | Тип | Вход | Логика |
|---|---|---|---|
| `create-invite` | command | `{user, pool}` | Ar.create → сохранить → botFacade.sendQuestionnaireInvite |
| `start-new` | command | `{user, pool}` | Ar.create + ar.start → сохранить → botFacade.startQuestionnaire |
| `start` | command | `{questionnaireId}` | Загрузить ar → ar.start → сохранить → botFacade.startQuestionnaire |
| `handle-action` | command | `{questionnaireId, type, value}` | Загрузить → ar.handleAction → сохранить → вернуть |
| `abandon` | command | `{questionnaireId}` | Загрузить → ar.abandon → сохранить |
| `get-current` | query | `{questionnaireId}` | Загрузить → ar.getCurrent() |
| `get-questionnaire` | query | `{uuid}` | Загрузить → вернуть состояние |
| `get-questionnaires-by-user` | query | `{userId}` | Список анкет пользователя |

- UC `create-invite` и `start-new` вызывают botFacade внутри (логика в UC)
- UC `start` вызывает botFacade.startQuestionnaire
- UC `handle-action` НЕ вызывает botFacade — возвращает результат контроллеру
- UC принимают `user: User` для команд, `userId` для query

## FR4 — Доменный фасад (чистое делегирование)

```typescript
class QuestionnaireInProcFacade implements QuestionnaireFacade {
  constructor(private module: QuestionnaireApiModule) {}

  async createInvite(user: User, pool: Question[]): Promise<void> {
    await this.module.execute('create-invite', { user, pool });
  }

  async startNew(user: User, pool: Question[]): Promise<void> {
    await this.module.execute('start-new', { user, pool });
  }

  async start(user: User, questionnaireId: string): Promise<void> {
    await this.module.execute('start', { questionnaireId });
  }
}
```

Никакой логики. Только `module.execute(...)`.

## FR5 — Резолвер

Убрать `questionnaireEngine`. Добавить `botFacade: QuestionnaireBotFacade`.

## Критерии приёмки

- [ ] Агрегат: `create(pool)` + `createInvite()` + `start()` (без параметров)
- [ ] Статус `invited`, `InviteResponse`
- [ ] 8 UC через TDD (тесты → код)
- [ ] create-invite и start-new вызывают botFacade внутри себя
- [ ] Фасад — чистое делегирование, без логики
- [ ] Имена единообразны: UC ↔ aggregate ↔ facade ↔ botFacade
- [ ] `bun run check:p questionnaire` — чисто

## За рамками

- Реализация TelegramQuestionnaireBotFacade (→ трек 2)
- Изменения в BotUiApp (→ трек 2)
- Контроллер questionnaire (→ трек 2)
