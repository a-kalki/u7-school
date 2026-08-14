# План реализации — Трек B: questionnaire ownerInfo + явные события + Likert/Skill/PeerReview

## Фаза 1: ownerInfo в состоянии + фасад `startStandard`

- [ ] Task: Написать падающие тесты на `ownerInfo` в состоянии (`QuestionnaireFactory.createStandard/createLikert` с ownerInfo)
- [ ] Task: Добавить `ownerInfo: Record<string, unknown>` в `QuestionnaireSchema`/`BaseQuestionnaireState`
- [ ] Task: Обновить фабрику: `createStandard(respondentId, pool, ownerInfo)`, `createLikert(respondentId, pool, ownerInfo)` (убрать `assessment` из состояния)
- [ ] Task: Переименовать фасад `start` → `startStandard`, добавить дженерик `TOwnerInfo`; `sendMetricInvite` → `sendLikertInvite` и перевести на `ownerInfo` вместо `assessment`
- [ ] Task: Обновить команды UC: `StartCmd`/`SendLikertInviteCmd` получают `ownerInfo` (убрать `assessment` из `SendLikertInviteCmd`)
- [ ] Task: Обновить `module.test.ts` (вызовы фасада/UC, `send-likert-invite` с ownerInfo)
- [ ] Task: Conductor - Ручная верификация 'ownerInfo в состоянии и фасаде'

## Фаза 2: Явные имена событий (без `kind` в payload)

- [ ] Task: Написать падающие тесты на явные имена событий (`questionnaire:complete`, `questionnaire:likert-complete` и decline/abandon)
- [ ] Task: Переписать `events.ts`: 6 дженерик-событий, `ownerInfo` + payload без `kind`
- [ ] Task: Обновить `buildCompletedEvent`/`buildDeclinedEvent`/`buildAbandonedEvent` в обоих агрегатах (явные `eventName`, `ownerInfo` из состояния, payload без `kind`)
- [ ] Task: Обновить подписки/assert'ы в `module.test.ts` и `likert-questionnaire-ar.test.ts`
- [ ] Task: Conductor - Ручная верификация 'Явные события'

## Фаза 3: Переименование `Metric*` → `Likert*` в `questionnaire`

- [ ] Task: Переименовать папку `metric/` → `likert/` и файлы (`metric-question.ts` → `likert-question.ts` и т.д.)
- [ ] Task: Переименовать типы/схемы: `MetricQuestionnaire` → `LikertQuestionnaire`, `MetricQuestion` → `LikertQuestion`, `MetricMapping` → `LikertMapping`, `MetricScore` → `LikertScore`, `MetricAnswer` → `LikertAnswer` (+ `kind: 'likert'`)
- [ ] Task: Переименовать поле `metricMapping` → `likertMapping`, payload `metricScores` → `likertScores`, `computeMetricScores` → `computeLikertScores`
- [ ] Task: Обновить фабрику (`createLikert`), UC (`send-likert-invite`), фасад (`sendLikertInvite`), repo (`kind: 'likert'`)
- [ ] Task: Conductor - Ручная верификация 'Переименование Likert в questionnaire'

## Фаза 4: Словарь `Skill*` + оценка `PeerReview*` в `peer-review` + узкие `Likert*` в `questionnaire`

- [ ] Task: Перенести полные типы/схемы в `packages/peer-review/src/domain/peer-review/`: `categories.ts`, `scores.ts`, `assessment.ts` (словарь навыков `Metric*` → `Skill*`, оценку `Metric*` → `PeerReview*`)
- [ ] Task: Перенести тесты `metric-question.test.ts` и `metric-questionnaire.test.ts` в `peer-review` (валидация словаря `Skill*` и оценки `PeerReview*`)
- [ ] Task: В `questionnaire` оставить узкие `Likert*` типы; удалить полные union'ы и assessment-словарь
- [ ] Task: Обновить `LikertQuestionnaireAr` на узкие типы (убрать `assessmentFields`; **валидация выхода `likertScores` — здесь**, схемой `LikertScoreSchema`)
- [ ] Task: Переименовать и обновить `packages/peer-review/src/domain/metric-question-pool.ts` → `peer-review-question-pool.ts`; импорт полных типов локально (`./peer-review`); `METRIC_POOLS` → `PEER_REVIEW_POOLS`
- [ ] Task: Обновить тесты `questionnaire` (`likert-questionnaire-ar.test.ts` и связанные) под узкие типы и ownerInfo
- [ ] Task: Conductor - Ручная верификация 'Словарь Skill + оценка PeerReview + узкие Likert'

## Фаза 5: Прокидка TelegramQuestionnaireBotFacade

- [ ] Task: Заменить `botFacadeStub` на `TelegramQuestionnaireBotFacade` в `apps/u7-bot/src/create-api-app.ts`
- [ ] Task: Проверить проактивный старт анкеты (`startStandard`/`sendLikertInvite` рендерят экраны, включая `captureInput`)
- [ ] Task: Conductor - Ручная верификация 'TelegramQuestionnaireBotFacade'

## Финал

- [ ] Task: `bun run check:p questionnaire`
- [ ] Task: `bun run check:p peer-review`
- [ ] Task: `bun run check:a u7-bot`
