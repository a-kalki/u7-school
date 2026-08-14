# План реализации — Трек 2.4b: MetricQuestionnaireAr + metricMapping

## Фаза 1: MetricMapping и MetricScore типы

- [x] Task: Описать тип `MetricMapping` (связанный категория↔подкатегория) и `MetricScore` в `questionnaire/domain/` [2fb1b25]
- [x] Task: Расширить `Question` типы — `MetricQuestion` с обязательным `metricMapping: MetricMapping` [db92e8c]
- [x] Task: Conductor - Ручная верификация 'Типы'

## Фаза 2: MetricQuestionnaireAr

- [x] Task: Реализовать `MetricQuestionnaireAr extends QuestionnaireAr` [da637978]
- [x] Task: Реализовать `computeMetricScores()` — группировка по subcategory, средневзвешенное [da637978]
- [x] Task: Перенести генерацию `QuestionnaireCompleted` в базовый `QuestionnaireAr` (payload без `answers`); `MetricQuestionnaireAr` расширяет payload полем `metricScores` [94758477]
- [x] Task: Написать unit-тесты: [da637978]
    - [x] завершение анкеты → metricScores вычислены
    - [x] вес ограничен значениями 0.75 / 1 / 1.25
    - [x] разный вес вопросов → корректное средневзвешенное
- [x] Task: Conductor - Ручная верификация 'MetricQuestionnaireAr'

## Фаза 3: Пул вопросов

- [x] Task: Создать конфигурационный файл с вопросами из Трека 1.2 (с metricMapping) [0f6f49d7]
- [x] Task: Проверить `bun run check:p questionnaire` [6b1c966f]
- [x] Task: Conductor - Ручная верификация 'Пул вопросов'
