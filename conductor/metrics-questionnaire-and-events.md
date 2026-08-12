# 2. Модуль Questionnaire + инфраструктура событий

**Назначение:** технический документ. Ядро системы: движок анкет, EventBus в core, API агрегатов для событий, intention-паттерн запуска.

> **Родительский документ:** [Система сбора метрик](./metrics-system.md)
> **Связан с:** [1. Концепция метрик](./metrics-conception.md) — структура `metricMapping`
> **Связан с:** [3. Пайплайн + модули](./metrics-pipeline-and-modules.md) — потребители QuestionnaireCompleted

---

## Текущее состояние (точка старта)

Модуль `onboarding` содержит полноценный движок анкет:

```
packages/onboarding/src/
  domain/questionnaire/
    a-root.ts          — QuestionnaireAr (start, handleAction, abandon, findAndSetNextQuestion)
    entity.ts          — Questionnaire (telegramId, status, answers, currentQuestionCode, draftAnswers)
    question.ts        — ChoiceQuestion, TextQuestion, Condition (ветвление)
    question-pool-service.ts — пул вопросов, валидация, getNextQuestion с учётом условий
    types.ts           — QuestionnaireActionResponse (wait_next, new_question, completed)
    policy.ts          — QuestionnairePolicy (canStart, canRead, canEdit)
    repo.ts            — QuestionnaireRepo (интерфейс)
    errors.ts
    commands/          — StartQuestionnaireCmd, HandleOnboardingActionCmd, ...
  api/questionnaire/
    start-uc.ts        — StartUc (создаёт анкету, выдаёт первый вопрос)
    handle-action-uc.ts — HandleActionUc (обрабатывает callback/text, при completed выдаёт роль CANDIDATE)
    abandon-uc.ts
    get-current-question-uc.ts
  infra/db/
    questionnaire-json-repo.ts
  ui/bot/controller/
    onboarding-controller.ts — рендеринг вопросов в MarkdownV2, инлайн-клавиатуры
```

**Что нужно изменить:** анкета завязана на onboarding (telegramId — заполняющий, completed → роль CANDIDATE). Нужно абстрагировать до универсального движка.

---

## Треки

### Трек 2.1 — EventBus в `core`

**Цель:** создать интерфейс и реализацию шины событий.

**Интерфейс** (новый файл `packages/core/src/domain/events/`):

```typescript
// Базовое доменное событие
interface DomainEvent {
  eventId: string;
  eventName: string;        // "completed", "completed"
  occurredAt: string;
  aggregateName: string;    // "Questionnaire", "ModuleEnrollment"
  aggregateId: string;
  payload: Record<string, unknown>;
}

interface EventBus {
  publish<E extends DomainEvent>(event: E): void;
  subscribe<E extends DomainEvent>(
    eventName: string,
    handler: (event: E) => Promise<void>,
  ): () => void;  // возвращает unsubscribe
}
```

**Реализация `InProcEventBus`:**
- Хранит `Map<eventName, handler[]>`
- `publish` синхронно вызывает все обработчики в цикле
- `subscribe` добавляет обработчик, возвращает функцию отписки
- Добавить в `AppResolver` (чтобы все модули имели доступ)

**Местоположение:** `packages/core/src/domain/events/` → `event-bus.ts` (интерфейс), `in-proc-event-bus.ts` (реализация).

**Тесты:** unit-тесты на подписку, публикацию, отписку, порядок вызова, ошибки в обработчиках.

---

### Трек 2.2 — API событий в `Aggregate`

**Цель:** расширить базовый `Aggregate` чтобы агрегаты могли генерировать события.

**Изменения в `ArMeta`** (см. `packages/core/src/domain/ar/aggregate.ts`):

```typescript
interface ArMeta {
  name: string;
  label: string;
  state: { uuid: string; createdAt: string; updatedAt?: string } & Record<string, unknown>;
  events: DomainEvent;  // ← union доменных событий агрегата
}
```

**Новые методы в `Aggregate`:**

```typescript
abstract class Aggregate<TMeta extends ArMeta> {
  private _events: TMeta['events'][] = [];

  /** Добавить событие. Вызывается методами агрегата при значимых действиях */
  protected addEvent(event: TMeta['events']): void {
    this._events.push(event);
  }

  hasEvents(): boolean { return this._events.length > 0; }

  /** Выдаёт события и очищает коллектор. Вызывается UseCase'ом через publishEvents */
  flushEvents(): TMeta['events'][] {
    const events = [...this._events];
    this._events = [];
    return events;
  }
}
```

**Контракт:**
- Агрегат **не** публикует события сам. Только кладёт через `addEvent()`.
- UseCase после сохранения агрегата вызывает `publishEvents(ar)` (см. трек 2.3).
- `flushEvents()` атомарно выдаёт и очищает — чтобы событие не было опубликовано дважды.

**Пример использования в агрегате:**

```typescript
// QuestionnaireAr (см. трек 2.4)
someMethod(): void {
  // ... бизнес-логика ...
  this.addEvent({
    eventId: crypto.randomUUID(),
    eventName: 'questionnaire.completed',
    occurredAt: isoNow(),
    aggregateName: 'Questionnaire',
    aggregateId: this.state.uuid,
    payload: { /* ... */ },
  });
}
```

---

### Трек 2.3 — `publishEvents` в `UseCase`

**Цель:** добавить в абстрактный `UseCase` метод для публикации событий агрегата.

**Новый protected метод:**

```typescript
abstract class UseCase<TMeta extends UcMeta, TResolve> {
  /**
   * Публикует все события, накопленные агрегатом.
   * Вызывать после repo.save().
   */
  protected publishEvents(ar: Aggregate<ArMeta>): void {
    if (!ar.hasEvents()) return;
    const events = ar.flushEvents();
    const eventBus = (this.resolve as { eventBus?: EventBus }).eventBus;
    if (!eventBus) return;  // в тестах eventBus может отсутствовать
    for (const event of events) {
      eventBus.publish(event);
    }
  }
}
```

**Требование к `ModuleResolver`:** добавить `eventBus: EventBus` (опционально, для обратной совместимости в тестах).

**Контракт в UC:**
1. Создать/загрузить агрегат
2. Вызвать метод агрегата (может сгенерировать события)
3. `await repo.save(ar.state)`
4. `this.publishEvents(ar)` ← после сохранения
5. Вернуть результат

---

### Трек 2.4 — Модуль `questionnaire` (извлечение из `onboarding`)

**Цель:** создать новый пакет `questionnaire` с универсальным движком анкет.

Трек разбит на подтреки:
- **2.4a** — Доменная модель + агрегат + API + Infra (✅ выполнено)
- **2.4a+** — Перепроектирование UC слоя: `user: User`, `QuestionnairePool`, Invite-паттерн, `QuestionnaireBotFacade`, доменный фасад
- **2.4a++** — `BotUiApp.send()`, `shortIds` в `BotUiApp`, контроллер questionnaire, `TelegramQuestionnaireBotFacade`
- **2.4b** — `MetricQuestionnaireAr` и `metricMapping`

**Текущий дизайн (после 2.4a+):**

```typescript
// QuestionnairePool — объект с метаданными, не просто Question[]
interface QuestionnairePool {
  inviteText?: string;       // для sendInvite (S01). При прямом start не нужен.
  whyText?: string;          // «Зачем это нужно» — влияние на метрики
  completionText?: string;   // текст при завершении
  cancelWarning?: string;    // текст при отмене/отказе
  questions: Question[];     // вопросы анкеты
}

// Статусы анкеты
status: 'invited' | 'in_progress' | 'completed' | 'abandoned';
```

**Агрегат `QuestionnaireAr`:**
```typescript
static create(respondentId, pool: QuestionnairePool): QuestionnaireAr  // фабрика, статус invited
createInvite(): InviteResponse        // приглашение (inviteText, whyText, questionnaireId)
decline(): void                        // invited → abandoned
start(): QuestionnaireActionResponse   // invited → in_progress, engine из pool.questions
getQuestionnaireActionResponse(): QuestionnaireActionResponse  // текущее состояние
handleAction({type, value}): QuestionnaireActionResponse
abandon(): void
```

**Два пути запуска:**
- **Путь A (инициативный):** модуль-владелец → `QuestionnaireFacade.sendInvite(user, pool)` или `start(user, pool)` → UC → `botFacade.sendQuestionnaireInvite()` / `startQuestionnaire()`
- **Путь B (ответный):** контроллер questionnaire (стори `fill`) → UC `start-by-invite` / `handle-action` / `decline-invite` → return response

**Фасад `QuestionnaireFacade`:**
- `sendInvite(user, pool)` → `module.execute('send-invite', ...)`
- `start(user, pool)` → `module.execute('start', ...)`

Чистое делегирование в UC. Вся логика (включая вызов botFacade) — в UC.

**`QuestionnaireEngine`** — чистый движок навигации по вопросам: ветвление, валидация. Не знает о метриках.

**Местоположение:** `packages/questionnaire/` (новый пакет).

**`onboarding` остаётся** — делегирует анкетирование в `questionnaire`, оставляет свою ответственность (желания, привязка к курсам, выдача роли CANDIDATE).

---

### Трек 2.5 — `onboarding` переводится на новый `questionnaire`

**Цель:** модуль `onboarding` становится потребителем `questionnaire`, а не владельцем движка.

**Изменения:**
- Удалить из `onboarding` доменную логику анкет (a-root, entity, question, questionnaire-engine, commands, repo, policy, errors, types)
- Оставить: `OnboardingAr` (желания, привязка к курсам), `OnboardingApiModule`, контроллер
- `OnboardingAr` использует `QuestionnaireFacade.start(user, pool)` для запуска анкеты
- При `QuestionnaireCompleted` (подписка через EventBus) — выдаёт роль `CANDIDATE`

**Упрощение:** onboarding больше не содержит движок анкет. Вся анкетная логика — в `questionnaire`.

---

## Зависимости между треками

```
2.1 (EventBus) ──┐
                 ├──> 2.3 (publishEvents) ──> 2.4a (questionnaire) ──> 2.4a+ (domain-uc)
2.2 (Aggregate API) ┘                                                      │
                                                                           ├──> 2.4b (MetricQuestionnaireAr)
                                                                           │
                                                                           └──> 2.4a++ (bot-controller)
                                                                                    │
                                                                                    └──> 2.5 (onboarding)
```

2.4a+ (domain-uc) и 2.4b (MetricAr) можно делать параллельно после 2.4a. 2.4a++ (bot-controller) зависит от 2.4a+. Трек 2.5 зависит от 2.4a++ (контроллер) или может использовать фасад напрямую.

---

## Связанные документы

- [Система сбора метрик (родитель)](./metrics-system.md)
- [1. Концепция метрик](./metrics-conception.md) — структура metricMapping
- [3. Пайплайн + модули](./metrics-pipeline-and-modules.md) — Invite-паттерн, peer-review, metrics
- [DDD Domain](../.pi/skills/ddd-domain/SKILL.md) — правила для Aggregate, Policy
- [DDD Naming](../.pi/skills/ddd-naming/SKILL.md) — именование пакетов, файлов
- [Границы доменной логики](./code_styleguides/domain-boundaries.md)
