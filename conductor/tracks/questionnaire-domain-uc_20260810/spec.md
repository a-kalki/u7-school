# Спецификация — Домен и UC слой questionnaire

## Обзор

Два пути запуска анкеты: инициативный (через фасад, UC → botFacade) и ответный (через контроллер, UC → return).

## FR1 — Агрегат QuestionnaireAr

```typescript
static create(respondentId: number, pool: Question[]): QuestionnaireAr  // фабрика, статус invited
createInvite(): InviteResponse   // приглашение для botFacade
start(): QuestionnaireActionResponse  // invited → in_progress, без параметров
```

- `intention` → `invited`, `IntentionResponse` → `InviteResponse`
- `create()` сохраняет pool сразу, `start()` использует его
- Старые методы удалить

## FR2 — QuestionnaireBotFacade (интерфейс)

```typescript
interface QuestionnaireBotFacade {
  sendQuestionnaireInvite(user: User, response: InviteResponse): Promise<void>;
  startQuestionnaire(user: User, response: QuestionnaireActionResponse): Promise<void>;
}
```

## FR3 — UC слой

### Путь A — инициативный (фасад → UC → botFacade)

| UC | Вход | Логика |
|---|---|---|
| `send-invite` | `{user, pool}` | Ar.create → save → ar.createInvite() → botFacade.sendQuestionnaireInvite |
| `start` | `{user, pool}` | Ar.create → ar.start() → save → botFacade.startQuestionnaire |

### Путь B — ответный (контроллер → UC → return)

| UC | Вход | Логика |
|---|---|---|
| `start-by-invite` | `{questionnaireId}` | load ar → ar.start() → save → **return** response |
| `handle-action` | `{questionnaireId, type, value}` | load ar → ar.handleAction() → save → **return** response |
| `abandon` | `{questionnaireId}` | load ar → ar.abandon() → save |
| `get-current` | `{questionnaireId}` | load ar → ar.getCurrent() |
| `get-questionnaire` | `{uuid}` | load → состояние |
| `get-questionnaires-by-user` | `{userId}` | список |

`start-by-invite` и `handle-action` НЕ вызывают botFacade — контроллер сам рендерит ответ.

## FR4 — Доменный фасад (чистое делегирование)

```typescript
class QuestionnaireInProcFacade {
  async sendInvite(user: User, pool: Question[]): Promise<void> {
    await this.module.execute('send-invite', { user, pool });
  }

  async start(user: User, pool: Question[]): Promise<void> {
    await this.module.execute('start', { user, pool });
  }
}
```

## FR5 — Резолвер

Убрать `questionnaireEngine`. Добавить `botFacade: QuestionnaireBotFacade`.

## Критерии приёмки

- [ ] Агрегат: `create(pool)`, `createInvite()`, `start()` без параметров
- [ ] Статус `invited`, тип `InviteResponse`
- [ ] `send-invite`/`start` → botFacade; `start-by-invite`/`handle-action` → return
- [ ] Фасад: `sendInvite(user, pool)` и `start(user, pool)` — только `module.execute`
- [ ] Имена: UC ↔ aggregate ↔ facade ↔ botFacade
- [ ] Все 8 UC через TDD
- [ ] `bun run check:p questionnaire` — чисто
