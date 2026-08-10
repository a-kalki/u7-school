# План реализации — Трек 2.4b: MetricQuestionnaireAr + metricMapping

## Фаза 1: MetricMapping и MetricScore типы

- [ ] Task: Описать `MetricMapping` и `MetricScore` типы в `questionnaire/domain/`
- [ ] Task: Расширить `Question` типы — добавить опциональный `metricMapping`
- [ ] Task: Conductor - Ручная верификация 'Типы'

## Фаза 2: MetricQuestionnaireAr

- [ ] Task: Реализовать `MetricQuestionnaireAr extends BaseQuestionnaireAr`
- [ ] Task: Реализовать `computeMetricScores()` — группировка по subcategory, средневзвешенное
- [ ] Task: Интегрировать генерацию `QuestionnaireCompleted` события
- [ ] Task: Написать unit-тесты:
    - [ ] завершение анкеты → metricScores вычислены
    - [ ] анкета без metricMapping → metricScores = null
    - [ ] разный вес вопросов → корректное средневзвешенное
- [ ] Task: Conductor - Ручная верификация 'MetricQuestionnaireAr'

## Фаза 3: Пул вопросов и фасад

- [ ] Task: Создать конфигурационный файл с вопросами из Трека 1.2 (с metricMapping)
- [ ] Task: Расширить `QuestionPoolService` — `getAllWithMetricMapping()`
- [ ] Task: Расширить `QuestionnaireFacade` — `getAnswers()` возвращает metricScores
- [ ] Task: Проверить `bun run check:p questionnaire`
- [ ] Task: Conductor - Ручная верификация 'Пул и фасад'
