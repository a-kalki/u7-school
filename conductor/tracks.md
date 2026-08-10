# Реестр треков

> Все треки Релиза 1 выполнены и перемещены в архив: `conductor/archive/`.

## Структура тестов после Треков 0–6

```
apps/u7-bot/
├── src/**/*.test.ts          ← unit-тесты рядом с исходниками
└── tests/
    ├── helpers/              ← test-app.ts, fixture-loader.ts
    ├── fixtures/             ← JSON-шаблоны
    ├── courses/              ← 4 integration-теста
    ├── streams/              ← 2 integration-теста
    ├── learning/             ← 1 integration-тест (Трек 5)
    ├── mentor/               ← 5 integration-тестов (Трек 6)
    └── e2e/                  ← 3 e2e-теста

packages/stream/src/ui/bot/stories/   ← пусто (все стори перенесены)
```

---

- [ ] **Track: Трек 1.1 — Категории, подкатегории и структура анкет метрик**
*Link: [./tracks/metrics-structure_20260810/](./tracks/metrics-structure_20260810/)*

- [ ] **Track: Трек 1.2 — Вопросы и шкалы: утверждения по контекстам анкет**
*Link: [./tracks/metrics-questions_20260810/](./tracks/metrics-questions_20260810/)*

- [ ] **Track: Трек 2.1 — EventBus в core**
*Link: [./tracks/metrics-eventbus_20260810/](./tracks/metrics-eventbus_20260810/)*

- [ ] **Track: Трек 2.2 — API событий в Aggregate**
*Link: [./tracks/metrics-aggregate-api_20260810/](./tracks/metrics-aggregate-api_20260810/)*

- [ ] **Track: Трек 2.3 — publishEvents в UseCase**
*Link: [./tracks/metrics-publish-events_20260810/](./tracks/metrics-publish-events_20260810/)*

- [ ] **Track: Трек 2.4a — Модуль questionnaire (выделение из onboarding)**
*Link: [./tracks/metrics-questionnaire_20260810/](./tracks/metrics-questionnaire_20260810/)*

- [ ] **Track: Трек 2.4b — MetricQuestionnaireAr и metricMapping**
*Link: [./tracks/metrics-metric-ar_20260810/](./tracks/metrics-metric-ar_20260810/)*

- [ ] **Track: Трек 2.5 — onboarding переводится на questionnaire**
*Link: [./tracks/metrics-onboarding-migration_20260810/](./tracks/metrics-onboarding-migration_20260810/)*

## TODO в коде (для будущих треков)

| Что | Где | Трек |
|-----|-----|------|
| — | — | — |
