# Спецификация — Домен и UC слой questionnaire

## Обзор

Два пути запуска анкеты, два набора UC. Путь A (инициативный — через фасад): UC вызывает botFacade. Путь B (ответ пользователя — через контроллер): UC возвращает результат, контроллер рендерит.

## FR1 — Агрегат QuestionnaireAr

```typescript
// Фабрика — создаёт агрегат с пулом, статус invited
static create(respondentId: number, pool: Question[]): QuestionnaireAr

// Создать приглашение → InviteResponse (для botFacade)
createInvite(): InviteResponse

// Запустить анкету (invited → in_progress), использует сохранённый pool
start(): QuestionnaireActionResponse
```

- `intention` → `invited`, `IntentionResponse` → `InviteResponse`
- `create()` сохраняет pool сразу
- `start()` без параметров

## FR2 — QuestionnaireBotFacade (интерфейс)

```typescript
interface QuestionnaireBotFacade {
  sendQuestionnaireInvite(user: User, response: InviteResponse): Promise<void>;
  startQuestionnaire(user: User, response: QuestionnaireActionResponse): Promise<void>;
}
```

## FR3 — UC слой

### Путь A — инициативный (через фасад, UC вызывает botFacade)

| UC | Вход | Логика |
|---|---|---|
| `send-invite` | `{user, pool}` | Ar.create → сохранить → ar.createInvite() → botFacade.sendQuestionnaireInvite |
| `start` | `{user, pool}` | Ar.create → ar.start() → сохранить → botFacade.startQuestionnaire |

### Путь B — ответ пользователя (через контроллер, UC возвращает результат)

| UC | Вход | Логика |
|---|---|---|
| `start-by-invite` | `{questionnaireId}` | Загрузить ar → ar.start() → сохранить → **return** |
| `handle-action` | `{questionnaireId, type, value}` | Загрузить ar → ar.handleAction() → сохранить → **return** |
| `abandon` | `{questionnaireId}` | Загрузить ar → ar.abandon() → сохранить |
| `get-current` | `{questionnaireId}` | Загрузить ar → ar.getCurrent() |
| `get-questionnaire` | `{uuid}` | Загрузить → состояние |
| `get-questionnaires-by-user` | `{userId}` | Список анкет пользователя |

## FR4 — Доменный фасад (чистое делегирование)

```typescript
class QuestionnaireInProcFacade {
  // Модуль-владелец хочет пригласить пользователя заполнить анкету
  async sendInvite(user: User, pool: Question[]): Promise<void> {
    await this.module.execute('send-invite', { user, pool });
  }

  // Модуль-владелец хочет сразу запустить анкету для пользователя
  async start(user: User, pool: Question[]): Promise<void> {
    await this.module.execute('start', { user, pool });
  }
}
```

Два метода. Только делегирование.

## Критерии приёмки

- [ ] Агрегат: `create(pool)` + `createInvite()` + `start()` без параметров
- [ ] Статус `invited`, тип `InviteResponse`
- [ ] `send-invite`, `start` — вызывают botFacade
- [ ] `start-by-invite`, `handle-action` — return, без botFacade
- [ ] Фасад: `sendInvite(user, pool)` и `start(user, pool)` — только делегирование
- [ ] Все 8 UC через TDD
- [ ] `bun run check:p questionnaire` — чисто

## За рамками

- Реализация TelegramQuestionnaireBotFacade (→ трек 2)
- Изменения в BotUiApp (→ трек 2)
- Контроллер questionnaire (→ трек 2)
