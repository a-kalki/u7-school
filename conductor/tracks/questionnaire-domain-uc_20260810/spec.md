# Спецификация — Домен и UC слой questionnaire

## Обзор

Два пути запуска анкеты: инициативный (через фасад, UC → botFacade) и ответный (через контроллер, UC → return).
Pool — объект с метаданными, а не просто `Question[]`.

## Контекст — зачем эти изменения

Текущий UC слой questionnaire спроектирован под onboarding: жёстко завязан на `telegramId`, использует `IntentionResponse`/`intention`, не разделяет инициативный и ответный пути. Для интеграции с метриками и контроллером нужно:

| Что меняется | Было | Стало | Причина |
|---|---|---|---|
| Статус | `intention` | `invited` | Система приглашает, а не пользователь «намеревается» |
| Тип ответа | `IntentionResponse` | `InviteResponse` | Согласованность со статусом |
| Тип пула | `Question[]` | `QuestionnairePool` | Метаданные (тексты) должны идти вместе с вопросами |
| Параметр UC | `telegramId` | `user: User` | Единообразие с другими модулями |
| Инициативный запуск | `start` UC делает всё сам | `send-invite` + `start` через фасад → botFacade | Разделение ответственности: UC вызывает UI-слой |
| Ответный запуск | не было | `start-by-invite`, `decline-invite` | Пользователь управляет через контроллер |
| Имена | разнобой | UC = aggregate = facade = botFacade | Единообразие |

## FR1 — QuestionnairePool

```typescript
// packages/questionnaire/src/domain/questionnaire/question.ts
type QuestionnairePool = {
  /** Текст приглашения — для send-invite (S01). Не нужен при прямом start. */
  inviteText?: string;
  /** Объяснение «Зачем это нужно» — как это влияет на метрики других. */
  whyText?: string;
  /** Текст при успешном завершении */
  completionText?: string;
  /** Текст при отмене / выходе. Как это повлияет на твои метрики */
  cancelWarning?: string;
  /** Вопросы анкеты */
  questions: Question[];
};
```

Валидация через valibot. Все поля кроме `inviteText` и `questions` — опциональны.

## FR2 — Агрегат QuestionnaireAr

```typescript
// Создать агрегат с пулом, статус invited
static create(respondentId: number, pool: QuestionnairePool): QuestionnaireAr

// Создать приглашение → InviteResponse (для botFacade) — включает inviteText, howToFill
createInvite(): InviteResponse

// Отказаться от приглашения (при клике «Пропустить») — invited → abandoned
decline(): void

// Запустить анкету (invited → in_progress), использует сохранённый pool
start(): QuestionnaireActionResponse
```

- `intention` → `invited`, `IntentionResponse` → `InviteResponse`
- `InviteResponse` включает `inviteText` и `whyText` из pool
- `create()` сохраняет весь `QuestionnairePool`
- `decline()` — invited → abandoned, выбрасывает событие для модуля-владельца
- Старые методы удалить

## FR3 — QuestionnaireBotFacade (интерфейс)

```typescript
interface QuestionnaireBotFacade {
  sendQuestionnaireInvite(user: User, response: InviteResponse): Promise<void>;
  startQuestionnaire(user: User, response: QuestionnaireActionResponse): Promise<void>;
}
```

## FR4 — UC слой

### Путь A — инициативный (фасад → UC → botFacade)

| UC | Вход | Логика |
|---|---|---|
| `send-invite` | `{user, pool}` | Ar.create → save → ar.createInvite() → botFacade.sendQuestionnaireInvite |
| `start` | `{user, pool}` | Ar.create → ar.start() → save → botFacade.startQuestionnaire |

### Путь B — ответный (контроллер → UC → return)

| UC | Вход | Логика |
|---|---|---|
| `start-by-invite` | `{questionnaireId}` | load ar → ar.start() → save → **return** response |
| `decline-invite` | `{questionnaireId}` | load ar → ar.decline() → save → **return** cancelWarning |
| `handle-action` | `{questionnaireId, type, value}` | load ar → ar.handleAction() → save → **return** response |
| `abandon` | `{questionnaireId}` | load ar → ar.abandon() → save |
| `get-current` | `{questionnaireId}` | load ar → ar.getCurrent() |
| `get-questionnaire` | `{uuid}` | load → состояние |
| `get-questionnaires-by-user` | `{userId}` | список |

`start-by-invite` и `handle-action` НЕ вызывают botFacade — контроллер сам рендерит ответ.

## FR5 — Доменный фасад (чистое делегирование)

```typescript
class QuestionnaireInProcFacade {
  async sendInvite(user: User, pool: QuestionnairePool): Promise<void> {
    await this.module.execute('send-invite', { user, pool });
  }
  async start(user: User, pool: QuestionnairePool): Promise<void> {
    await this.module.execute('start', { user, pool });
  }
}
```

## FR6 — Резолвер

Убрать `questionnaireEngine`. Добавить `botFacade: QuestionnaireBotFacade`.

## Критерии приёмки

- [ ] `QuestionnairePool` — объект с inviteText, howToFill, completionText, cancelWarning, questions
- [ ] Агрегат: `create(pool)`, `createInvite()`, `decline()`, `start()` без параметров
- [ ] Статус `invited`, тип `InviteResponse`
- [ ] `send-invite`/`start` → botFacade; `start-by-invite`/`decline-invite`/`handle-action` → return
- [ ] Фасад: `sendInvite(user, pool)` и `start(user, pool)` — только `module.execute`
- [ ] 9 UC через TDD (добавлен `decline-invite`)
- [ ] `bun run check:p questionnaire` — чисто
