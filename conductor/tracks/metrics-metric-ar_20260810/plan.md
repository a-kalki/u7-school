# План реализации — Трек 2.4b: MetricQuestionnaireAr + metricMapping

## Фаза 1: MetricMapping и MetricScore типы

- [x] Task: Описать тип `MetricMapping` (связанный категория↔подкатегория) и `MetricScore` в `questionnaire/domain/` [2fb1b25]
- [x] Task: Расширить `Question` типы — `MetricQuestion` с обязательным `metricMapping: MetricMapping` [db92e8c]
- [ ] Task: Conductor - Ручная верификация 'Типы'

## Фаза 2: MetricQuestionnaireAr

- [ ] Task: Реализовать `MetricQuestionnaireAr extends QuestionnaireAr`
- [ ] Task: Реализовать `computeMetricScores()` — группировка по subcategory, средневзвешенное
- [x] Task: Перенести генерацию `QuestionnaireCompleted` в базовый `QuestionnaireAr` (payload без `answers`); `MetricQuestionnaireAr` расширяет payload полем `metricScores` [94758477]
- [ ] Task: Написать unit-тесты:
    - [ ] завершение анкеты → metricScores вычислены
    - [ ] анкета без metricMapping → metricScores = null
    - [ ] разный вес вопросов → корректное средневзвешенное
- [ ] Task: Conductor - Ручная верификация 'MetricQuestionnaireAr'

## Фаза 3: Пул вопросов

- [ ] Task: Создать конфигурационный файл с вопросами из Трека 1.2 (с metricMapping)
- [ ] Task: Проверить `bun run check:p questionnaire`
- [ ] Task: Conductor - Ручная верификация 'Пул вопросов'
