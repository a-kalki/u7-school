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

Расширить `Question` (из 2.4a):

```typescript
interface MetricMapping {
  category: string;       // "professional_skills" | "team_skills" | "personal_skills"
  subcategory: string;    // "work_quality" | "communication" | ...
  weight: number;         // 0.75 | 1.0 | 1.25, по умолчанию 1.0
}
```

`MetricMapping` — опциональные метаданные. Не создают зависимость `questionnaire → metrics`.

## FR3 — Пул вопросов с метриками

Загрузить в `QuestionPoolService` утверждения из Трека 1.2 как конфигурацию. Каждый вопрос содержит `metricMapping` (category + subcategory + weight).

Формат конфигурации: `packages/questionnaire/config/questions.json` (или аналогично).

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
