# Спецификация — Трек 2.4b: MetricQuestionnaireAr + metricMapping

## Обзор

Расширить модуль `questionnaire` (из Трека 2.4a): добавить `MetricQuestionnaireAr` (наследник `QuestionnaireAr`), интегрировать `metricMapping` в пул вопросов, реализовать вычисление `metricScores` при завершении анкеты.

## FR1 — `MetricQuestionnaireAr`

```typescript
class MetricQuestionnaireAr extends QuestionnaireAr {
  // При завершении анкеты
  protected onComplete(): void {
    const scores = this.computeMetricScores();
    // сохраняет в state.metricScores
    // добавляет QuestionnaireCompleted событие
  }

  private computeMetricScores(): MetricScore[] {
    // Группирует answers по metricMapping.subcategory
    // Для каждой: Σ(answer × weight) / Σ weight
  }
}
```

**Важно:** `MetricQuestionnaireAr` использует свой `MetricQuestion` (расширение `Question` с `metricMapping`) и `MetricAnswer` (расширение `Answer` без `answerText` и `choices` — они всегда стандартны для метрик). Это позволяет не хранить мёртвые данные.

### MetricQuestion

```typescript
interface MetricQuestion extends Question {
  metricMapping: {
    category: string;
    subcategory: string;
    weight: number;
  };
}
```

Перед передачей в движок (`start(pool)`) метрик-вопросы преобразуются в обычные `Question[]` (движок не знает о метриках).

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
{
  questionnaireId, subjectId, respondentId,
  context, role, triggerEvent,
  answers: Answer[],
  metricScores: MetricScore[]
}
```

## FR2 — `metricMapping` в вопросах пула

`metricMapping` добавляется на уровне `MetricQuestion` (расширение `Question`), а не в базовый `Question`. Базовый `Question` и `QuestionnaireEngine` (движок) **ничего не знают о метриках**.

```typescript
// Вопрос с метриками (для MetricQuestionnaireAr)
interface MetricQuestion extends Question {
  metricMapping?: {
    category: string;       // "professional_skills" | "team_skills" | "personal_skills"
    subcategory: string;    // "work_quality" | "communication" | ...
    weight: number;         // 0.75 | 1.0 | 1.25, по умолчанию 1.0
  };
}
```

При передаче в агрегат через `start(pool)`, метрик-вопросы приводятся к `Question[]` — движок работает с обычными вопросами.

## FR3 — Пул вопросов с метриками

Пул вопросов — ответственность модуля-владельца (onboarding, peer-review, ...).
Каждый модуль передаёт свой пул при вызове `start(pool)` или `startNew(respondentId, pool)`.

Формат конфигурации — в модуле-владельце (например `packages/onboarding/src/domain/questionnaire/question-pool.json`).

## FR4 — `QuestionnaireFacade` расширение

- `getAnswers(questionnaireId)` → `Answer[]` + `MetricScore[] | null`
- `getAllWithMetricMapping()` → для отладки/проверки

## Критерии приёмки

- [ ] `MetricQuestionnaireAr` наследует `QuestionnaireAr`
- [ ] При завершении вычисляет `metricScores`
- [ ] Генерирует `QuestionnaireCompleted` событие
- [ ] `metricMapping` в вопросах пула
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
- [Трек 2.4a — модуль questionnaire](../tracks/metrics-questionnaire_20260810/spec.md) — база
