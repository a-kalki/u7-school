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
  eventType: string;        // "questionnaire.completed", "module.completed"
  occurredAt: string;
  aggregateType: string;    // "Questionnaire", "ModuleEnrollment"
  aggregateId: string;
  payload: Record<string, unknown>;
}

interface EventBus {
  publish<E extends DomainEvent>(event: E): void;
  subscribe<E extends DomainEvent>(
    eventType: string,
    handler: (event: E) => Promise<void>,
  ): () => void;  // возвращает unsubscribe
}
```

**Реализация `InProcEventBus`:**
- Хранит `Map<eventType, handler[]>`
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
    eventType: 'questionnaire.completed',
    occurredAt: isoNow(),
    aggregateType: 'Questionnaire',
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

**Новая модель анкеты** (разделение на базовую и метриковую):

> **Примечание:** на этапе реализации типы будут выведены из схем валидации (zod/typebox), а не объявлены вручную. Здесь — концептуальная модель.

```typescript
// Базовая анкета — чистый движок «вопрос-ответ».
// Ничего не знает о контексте, ролях, метриках.
interface Questionnaire {
  uuid: string;
  respondentId: number;              // кто заполняет
  status: 'in_progress' | 'completed' | 'abandoned';
  currentQuestionCode: string | null; // для навигации / продолжения «потом»
  draftAnswers: Record<string, string>;
  answers: Answer[];                  // зафиксированные ответы
  questionPool: Question[];           // снимок пула на момент start() — гарантирует
                                      // консистентность при продолжении «потом»
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// Метрик-анкета — расширяет базовую.
// Добавляет «о ком», контекст, роль, триггер и предвычисленные баллы.
interface MetricQuestionnaire extends Questionnaire {
  subjectId: number;                  // о ком анкета
  context: string;                    // "module_completed" | "pair_programming" | "code_review" | "initiative"
  role: string;                       // "student_student" | "mentor_student" | "student_mentor"
  triggerEvent: {                     // что породило анкету
    type: string;
    aggregateId: string;
  } | null;
  metricScores: MetricScore[] | null; // вычисляется при complete()
}
```

**Пул как состояние:** при `start()` агрегат получает пул вопросов (отфильтрованный по `context`/`roles`) и сохраняет его снимок в `questionPool`. Это гарантирует:
- Навигация (`findAndSetNextQuestion`) не требует внешнего сервиса
- Продолжение «потом» работает даже если конфиг пула изменился между сессиями
- Тот же принцип что у `Answer` — анкета самодостаточна
```

**`metricMapping` в вопросах пула** — опциональные метаданные:

```typescript
// Question.condition дополняется metricMapping
interface MetricMapping {
  category: string;       // "professional_skills" | "team_skills" | "personal_skills"
  subcategory: string;    // "work_quality" | "communication" | ...
  weight: number;         // 0.75 | 1.0 | 1.25, по умолчанию 1.0
}
```

`MetricMapping` не создаёт зависимость `questionnaire → metrics`. Это просто метаданные вопроса.

**Иерархия агрегатов:**

```
QuestionnaireAr                 — абстрактный: start, handleAction, abandon, findAndSetNextQuestion
  └── MetricQuestionnaireAr     — для метрик: computeMetricScores(), события QuestionnaireCompleted
```

`OnboardingAr` (в onboarding) **не наследует** `QuestionnaireAr`. Он использует `QuestionnaireFacade` как внешний сервис и подписывается на событие `QuestionnaireCompleted` через EventBus.

**`MetricQuestionnaireAr`** при завершении:
- Вычисляет баллы по `metricMapping` вопросов → `metricScores: MetricScore[]`
- Кладёт событие `QuestionnaireCompleted` с payload:
  - Базовая часть (всегда): `{ questionnaireId, respondentId, answers }`
  - Метриковая часть (только для MetricQuestionnaire): `{ subjectId, context, role, metricScores, triggerEvent }`

**Фасад `QuestionnaireFacade`:**
- `start(respondentId, questionPool)` → создаёт простую анкету (для онбординга), сохраняет снимок пула, возвращает первый вопрос
- `startMetric(context, role, subjectId, respondentId, questionPool, triggerEvent?)` → создаёт метрик-анкету, сохраняет снимок пула, возвращает первый вопрос
- `createIntention(context, role, subjectId, respondentId)` → создаёт «намерение» (без пула — пул передаётся при `startMetric` после согласия), возвращает `{ intentionId, message }` (см. трек 3.1 в Документе 3)
- `getAnswers(questionnaireId)` → ответы + metricScores (null для простых анкет)

**`QuestionPoolService`** — расширить: `getAllWithMetricMapping()` для отладки.

**Местоположение:** `packages/questionnaire/` (новый пакет, скопировать и переработать из `onboarding`).

**`onboarding` остаётся** — делегирует анкетирование в `questionnaire`, оставляет свою ответственность (желания, привязка к курсам, выдача роли CANDIDATE).

---

### Трек 2.5 — `onboarding` переводится на новый `questionnaire`

**Цель:** модуль `onboarding` становится потребителем `questionnaire`, а не владельцем движка.

**Изменения:**
- Удалить из `onboarding` доменную логику анкет (a-root, entity, question, question-pool-service, commands, repo, policy, errors, types)
- Оставить: `OnboardingAr` (желания, привязка к курсам), `OnboardingApiModule`, контроллер
- `OnboardingAr` использует `QuestionnaireFacade` для старта анкеты
- При `QuestionnaireCompleted` (подписка через EventBus) — выдаёт роль `CANDIDATE`

**Упрощение:** onboarding больше не содержит движок анкет. Вся анкетная логика — в `questionnaire`.

---

## Зависимости между треками

```
2.1 (EventBus) ──┐
                 ├──> 2.3 (publishEvents в UC) ──> 2.4 (questionnaire) ──> 2.5 (onboarding)
2.2 (Aggregate API) ┘
```

Треки 2.1 и 2.2 можно делать параллельно. Трек 2.3 зависит от обоих. Трек 2.4 зависит от 2.3. Трек 2.5 зависит от 2.4.

---

## Связанные документы

- [Система сбора метрик (родитель)](./metrics-system.md)
- [1. Концепция метрик](./metrics-conception.md) — структура metricMapping
- [3. Пайплайн + модули](./metrics-pipeline-and-modules.md) — intention-паттерн, peer-review, metrics
- [DDD Domain](../.pi/skills/ddd-domain/SKILL.md) — правила для Aggregate, Policy
- [DDD Naming](../.pi/skills/ddd-naming/SKILL.md) — именование пакетов, файлов
- [Границы доменной логики](./code_styleguides/domain-boundaries.md)
