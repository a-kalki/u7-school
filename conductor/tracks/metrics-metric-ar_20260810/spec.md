# Спецификация — Трек 2.4b: MetricQuestionnaireAr + metricMapping

## Обзор

Расширить модуль `questionnaire` (из Трека 2.4a): добавить `MetricQuestionnaireAr` (наследник `QuestionnaireAr`), интегрировать `metricMapping` в пул вопросов, реализовать вычисление `metricScores` при завершении анкеты.

## FR1 — `MetricQuestionnaireAr`

Событие `QuestionnaireCompleted` генерирует **базовый** `QuestionnaireAr` при завершении анкеты. Payload события **не содержит `answers`** — ответы анкеты при необходимости берутся из самой анкеты по `questionnaireId`. `MetricQuestionnaireAr` расширяет событие: добавляет в payload `metricScores` и оценочный контекст (`context`, `role`, `subjectId`, `triggerEvent?`).

```typescript
// Базовый агрегат
class QuestionnaireAr extends Aggregate<QuestionnaireArMeta> {
  protected onComplete(): void {
    this.addEvent({
      eventId: crypto.randomUUID(),
      eventName: 'questionnaire.completed',
      occurredAt: isoNow(),
      aggregateName: 'Questionnaire',
      aggregateId: this.state.uuid,
      payload: this.buildCompletionPayload(),
    });
  }

  /** Хук расширения payload события завершения (переопределяется в подклассах) */
  protected buildCompletionPayload(): Record<string, unknown> {
    return {
      questionnaireId: this.state.uuid,
      respondentId: this.state.respondentId,
    };
  }
}

// Агрегат метрик: расширяет payload события завершения
class MetricQuestionnaireAr extends QuestionnaireAr {
  protected buildCompletionPayload(): Record<string, unknown> {
    const { context, role, subjectId, triggerEvent } = this.state.assessment;
    return {
      ...super.buildCompletionPayload(),
      context,
      role,
      subjectId,
      ...(triggerEvent ? { triggerEvent } : {}),
      metricScores: this.computeMetricScores(),
    };
  }

  private computeMetricScores(): MetricScore[] {
    // Группирует answers по metricMapping.subcategory
    // Для каждой: Σ(answer × weight) / Σ weight
  }
}
```

**Важно:** `MetricQuestionnaireAr` использует свой компактный `MetricQuestion` (с `metricMapping`, без `type`/`multiple`/`answers`) и `MetricAnswer` (ответ без `answerText` и `choices` — они всегда стандартны для метрик). Это позволяет не хранить мёртвые данные. Состояние метрик-анкеты дополнительно хранит `assessment` — оценочный контекст (кто кого оценивает в каком контексте).

### MetricQuestion

```typescript
// Связь «категория → допустимые подкатегории» жёстко типизирована:
// подкатегорию одной категории нельзя положить в другую.
type MetricMapping =
  | { category: 'professional_skills'; subcategory: 'work_quality' | 'algorithmic_thinking' | 'tooling'; weight: 0.75 | 1 | 1.25 }
  | { category: 'team_skills'; subcategory: 'communication' | 'initiative' | 'honesty' | 'mutual_help'; weight: 0.75 | 1 | 1.25 }
  | { category: 'personal_skills'; subcategory: 'enthusiasm' | 'responsibility' | 'regularity'; weight: 0.75 | 1 | 1.25 };

type MetricCategory = MetricMapping['category'];
type MetricSubcategory = MetricMapping['subcategory'];

// Компактный вопрос метрики: не хранит type/multiple/answers —
// метрики всегда choice, одиночный выбор, шкала Лайкерт 1–5.
interface MetricQuestion {
  questionCode: string;
  question: string;  // текст утверждения
  metricMapping: MetricMapping;
}
```

Перед передачей в движок (`start(pool)`) метрик-вопросы преобразуются в обычные `Question[]` (движок не знает о метриках).

### MetricAssessment — оценочный контекст анкеты

```typescript
interface MetricAssessment {
  context: 'module_completed' | 'pair_programming' | 'code_review' | 'initiative';
  role: 'student_student' | 'mentor_student' | 'student_mentor';
  subjectId: string;  // userId (uuid) — кого оценивают
  triggerEvent?: { type: string; aggregateId: string };  // что спровоцировало запуск
}
```

`MetricAssessment` передаётся в фабрику `createFromMetricPool(respondentId, pool, assessment)` и сохраняется в `state.assessment`.

### MetricAnswer

```typescript
interface MetricAnswer {
  questionCode: string;
  answerCode: string;  // код(ы) выбранного ответа
  answeredAt: string;
  // НЕ хранит answerText, choices — они всегда берутся из MetricQuestion
}
```

Плюсы:
- Не дублируем стандартные тексты ответов (они всегда одинаковы для метрик)
- Меньше размер хранимых данных
- При вычислении `metricScores` используем `metricMapping` из `MetricQuestion`

`QuestionnaireCompleted` payload:

```typescript
// Базовый payload (генерирует QuestionnaireAr)
{
  questionnaireId,
  respondentId
}

// Расширенный payload (генерирует MetricQuestionnaireAr)
{
  questionnaireId,
  respondentId,
  context,
  role,
  subjectId,
  triggerEvent?,      // есть, только если задан в assessment
  metricScores: MetricScore[]
}
```

## FR2 — `metricMapping` в вопросах пула

`metricMapping` хранится только в `MetricQuestion` (компактном типе), а не в базовом `Question`. Базовый `Question` и `QuestionnaireEngine` (движок) **ничего не знают о метриках**.

```typescript
// Вопрос с метриками (для MetricQuestionnaireAr)
// Тип MetricMapping определён в FR1
interface MetricQuestion {
  questionCode: string;
  question: string;  // текст утверждения
  metricMapping: MetricMapping;  // связь категория↔подкатегория гарантирована типом
}
```

При передаче в агрегат через `start(pool)`, метрик-вопросы приводятся к `Question[]` — движок работает с обычными вопросами.

## FR3 — Пул вопросов с метриками

Пул вопросов — ответственность модуля-владельца (onboarding, peer-review, ...).
Каждый модуль передаёт свой пул при вызове `start(pool)` или `startNew(respondentId, pool)`.

Формат конфигурации — в модуле-владельце (например `packages/onboarding/src/domain/questionnaire/question-pool.json`).

## Критерии приёмки

- [ ] Базовый `QuestionnaireAr` генерирует `QuestionnaireCompleted` при завершении (payload без `answers`)
- [ ] `MetricQuestionnaireAr` наследует `QuestionnaireAr` и расширяет payload события полем `metricScores`
- [ ] При завершении вычисляет `metricScores`
- [ ] `metricMapping` в вопросах пула: связь категория↔подкатегория гарантирована типом
- [ ] Unit-тесты на `computeMetricScores`
- [ ] `bun run check:p questionnaire`

## За рамками

- Подписка на `QuestionnaireCompleted` в metrics (→ Трек 3.4)
- Intention-паттерн (→ Трек 3.1)

## Контекст и связанные документы

- [Система сбора метрик (родитель)](../metrics-system.md) — видение, архитектурные решения
- [2. Questionnaire + EventBus](../metrics-questionnaire-and-events.md) — техническая спецификация
- [1. Концепция метрик](../metrics-conception.md) — формулы агрегации, metricMapping
- [Дорожная карта](../development-roadmap.md) — Релиз 3
- [Трек 2.4a — модуль questionnaire](../../archive/metrics-questionnaire_20260810/spec.md) — база
