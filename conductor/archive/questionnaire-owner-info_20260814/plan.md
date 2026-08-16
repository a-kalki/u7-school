# План реализации — Трек B: questionnaire ownerInfo + явные события + Likert/Skill/PeerReview

## Фаза 1: ownerInfo в состоянии + фасад `startStandard`

- [x] Task: Написать падающие тесты на `ownerInfo` в состоянии (`QuestionnaireFactory.createStandard/createLikert` с ownerInfo) (76c223f)
- [x] Task: Добавить `ownerInfo: Record<string, unknown>` в `QuestionnaireSchema`/`BaseQuestionnaireState` (76c223f)
- [x] Task: Обновить фабрику: `createStandard(respondentId, pool, ownerInfo)`, `createLikert(respondentId, pool, ownerInfo)` (убрать `assessment` из состояния) (76c223f)
- [x] Task: Переименовать фасад `start` → `startStandard`, добавить дженерик `TOwnerInfo`; `sendMetricInvite` → `sendLikertInvite` и перевести на `ownerInfo` вместо `assessment` (76c223f)
- [x] Task: Обновить команды UC: `StartCmd`/`SendLikertInviteCmd` получают `ownerInfo` (убрать `assessment` из `SendLikertInviteCmd`) (76c223f)
- [x] Task: Обновить `module.test.ts` (вызовы фасада/UC, `send-likert-invite` с ownerInfo) (76c223f)
- [ ] Conductor - Ручная верификация 'ownerInfo в состоянии и фасаде'

## Фаза 2: Явные имена событий (без `kind` в payload)

- [x] Task: Написать падающие тесты на явные имена событий (`questionnaire:complete`, `questionnaire:likert-complete` и decline/abandon) (76c223f)
- [x] Task: Переписать `events.ts`: 6 дженерик-событий, `ownerInfo` + payload без `kind` (76c223f)
- [x] Task: Обновить `buildCompletedEvent`/`buildDeclinedEvent`/`buildAbandonedEvent` в обоих агрегатах (явные `eventName`, `ownerInfo` из состояния, payload без `kind`) (76c223f)
- [x] Task: Обновить подписки/assert'ы в `module.test.ts` и `likert-questionnaire-ar.test.ts` (76c223f)
- [ ] Conductor - Ручная верификация 'Явные события'

## Фаза 3: Переименование `Metric*` → `Likert*` в `questionnaire`

- [x] Task: Переименовать папку `metric/` → `likert/` и файлы (`metric-question.ts` → `likert-question.ts` и т.д.) (76c223f)
- [x] Task: Переименовать типы/схемы: `MetricQuestionnaire` → `LikertQuestionnaire`, `MetricQuestion` → `LikertQuestion`, `MetricMapping` → `LikertMapping`, `MetricScore` → `LikertScore`, `MetricAnswer` → `LikertAnswer` (+ `kind: 'likert'`) (76c223f)
- [x] Task: Переименовать поле `metricMapping` → `likertMapping`, payload `metricScores` → `likertScores`, `computeMetricScores` → `computeLikertScores` (76c223f)
- [x] Task: Обновить фабрику (`createLikert`), UC (`send-likert-invite`), фасад (`sendLikertInvite`), repo (`kind: 'likert'`) (76c223f)
- [ ] Conductor - Ручная верификация 'Переименование Likert в questionnaire'

## Фаза 4: Словарь `Skill*` + оценка `PeerReview*` в `peer-review` + узкие `Likert*` в `questionnaire`

- [x] Task: Перенести полные типы/схемы в `packages/peer-review/src/domain/peer-review/`: `categories.ts`, `scores.ts`, `assessment.ts` (словарь навыков `Metric*` → `Skill*`, оценку `Metric*` → `PeerReview*`) (a3ad00b)
- [x] Task: Перенести тесты `metric-question.test.ts` и `metric-questionnaire.test.ts` в `peer-review` (валидация словаря `Skill*` и оценки `PeerReview*`) (a3ad00b)
- [x] Task: В `questionnaire` оставить узкие `Likert*` типы; удалить полные union'ы и assessment-словарь (76c223f)
- [x] Task: Обновить `LikertQuestionnaireAr` на узкие типы (убрать `assessmentFields`; **валидация выхода `likertScores` — здесь**, схемой `LikertScoreSchema`) (76c223f)
- [x] Task: Переименовать и обновить `packages/peer-review/src/domain/metric-question-pool.ts` → `peer-review-question-pool.ts`; импорт полных типов локально (`./peer-review`); `METRIC_POOLS` → `PEER_REVIEW_POOLS` (a3ad00b)
- [x] Task: Обновить тесты `questionnaire` (`likert-questionnaire-ar.test.ts` и связанные) под узкие типы и ownerInfo (76c223f)
- [ ] Conductor - Ручная верификация 'Словарь Skill + оценка PeerReview + узкие Likert'

## Фаза 5: Прокидка TelegramQuestionnaireBotFacade

- [x] Task: Заменить `botFacadeStub` на `TelegramQuestionnaireBotFacade` в `apps/u7-bot/src/create-api-app.ts` (4f8d013)
- [x] Task: Проверить проактивный старт анкеты (`startStandard`/`sendLikertInvite` рендерят экраны, включая `captureInput`) (4f8d013)
- [ ] Conductor - Ручная верификация 'TelegramQuestionnaireBotFacade'

## Финал

- [x] Task: `bun run check:p questionnaire` (76c223f)
- [x] Task: `bun run check:p peer-review` (a3ad00b)
- [~] Task: `bun run check:a u7-bot` — lint и tslint зелёные; тесты: 397 pass, 4 fail (pre-existing в CreateStream wizard, не связаны с треком)
