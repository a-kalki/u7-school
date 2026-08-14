# Итоговый отчёт — Трек 2.4b: MetricQuestionnaireAr + metricMapping

## Цель

Расширить модуль `questionnaire` метрик-анкетами: компактный тип `MetricQuestion` с `metricMapping`, агрегат `MetricQuestionnaireAr`, вычисление `metricScores` при завершении, события жизненного цикла и пул вопросов из Трека 1.2.

## Выполненные задачи

### Фаза 1 — Типы
- `MetricMapping` — discriminated union «категория → допустимые подкатегории» + обязательный `weight` (`0.75 | 1 | 1.25`)
- `MetricScore` — балл по подкатегории (схема с той же гарантией категория↔подкатегория)
- `MetricQuestion` — компактный тип (`questionCode`, `question`, `metricMapping`), без `type`/`multiple`/`answers`
- `MetricQuestionPool` — пул с метаданными + `MetricQuestion[]`, `LIKERT_SCALE` (шкала 1–5)

### Фаза 2 — Агрегат
- `MetricQuestionnaireAr` — метрик-анкета, `computeMetricScores()` (средневзвешенное по подкатегории)
- Сокращённое состояние: хранит `MetricQuestion[]`, движок получает `ChoiceQuestion[]` на лету
- Оценочный контекст `MetricAssessment` (`context`, `role`, `subjectId`, `triggerEvent?`)
- Unit-тесты на вычисление баллов, веса, преобразование в шкалу Лайкерта

### Фаза 3 — Пул вопросов
- Пакет `peer-review` (заготовка Трека 3.3) с пулами из Трека 1.2: `module_completed` (29), `pair_programming` (13), `code_review` (9) — всего 51 вопрос

### Сверх плана (по итогам ревью)
- Явные события жизненного цикла: `completed` / `declined` / `abandoned` (для метрик — с `assessment`, для `completed` — с `metricScores`)
- Разделение агрегатов: `BaseQuestionnaireAr` (a-root.ts) + `QuestionnaireAr` (standard/) + `MetricQuestionnaireAr` (metric/); `build*Event()` переопределяется в наследниках
- Единая фабрика `QuestionnaireFactory` (`createStandard` / `createMetric` / `restore`)
- Дискриминатор `kind: 'standard' | 'metric'` + union `QuestionnaireState` в репозитории
- UC `send-metric-invite` + метод фасада `sendMetricInvite`; `send-invite` удалён (нет клиентов)

## Созданные файлы
- `packages/peer-review/` — пакет (конфиг пулов + тесты)
- `packages/questionnaire/src/domain/questionnaire/questionnaire-factory.ts`
- `packages/questionnaire/src/domain/questionnaire/events.ts`
- `packages/questionnaire/src/domain/questionnaire/commands/send-metric-invite-cmd.ts`
- `packages/questionnaire/src/api/questionnaire/send-metric-invite-uc.ts`

## Изменённые файлы
- Домен: `entity.ts`, `repo.ts`, `policy.ts`, `a-root.ts`, `standard/questionnaire-ar.ts`, `metric/metric-question.ts`, `metric/metric-questionnaire.ts`, `metric/metric-questionnaire-ar.ts`, `facade.ts`, `module.ts`, команды `get-questionnaire-cmd` / `get-questionnaires-by-user-cmd`
- API: `module.ts`, `index.ts`, `uc-metas.ts`, `questionnaire-uc.ts`, все UC
- Infra: `db/questionnaire-json-repo.ts`
- Тесты: агрегатов, API-модуля, infra-репозитория

## Удалённые файлы
- `api/questionnaire/send-invite-uc.ts`, `commands/send-invite-cmd.ts`

## Архитектурные решения
- **`kind`-дискриминатор** вместо проверки `'assessment' in state` — явное и типобезопасное различие обычной и метрик-анкеты
- **Фабрика агрегатов** вместо статических `create` на агрегатах — единая точка создания/восстановления
- **События в метатипе как union** трёх типов — `build*Event()` сужаются без кастов
- **Payload без `answers`** — ответы берутся из анкеты по `questionnaireId`

## Отклонения от плана
- `weight` ограничен `0.75 | 1 | 1.25` (по концепции §6), а не произвольный number
- Пулы вопросов вынесены в отдельный пакет `peer-review`, а не в `questionnaire` (FR3: пул — ответственность модуля-владельца)

## Известные ограничения
- Контекст `initiative` — свободная форма, фиксированного пула не имеет
- Полный поток intention → startMetric (Трек 3.1) и подписка на события (Трек 3.4) — вне рамок трека
