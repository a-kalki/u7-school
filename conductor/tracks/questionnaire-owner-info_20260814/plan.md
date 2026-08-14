# План реализации — Трек B: questionnaire ownerInfo + событие

## Фаза 1: ownerInfo в состоянии + фасад

- [ ] Task: Написать падающие тесты на `ownerInfo` в состоянии (`QuestionnaireFactory.createStandard/createMetric` с ownerInfo)
- [ ] Task: Добавить `ownerInfo: Record<string, unknown>` в `QuestionnaireSchema`/`BaseQuestionnaireState`
- [ ] Task: Добавить дженерик `TOwnerInfo` в `QuestionnaireInProcFacade.start`/`start-by-invite` + поле `ownerInfo` в команды UC
- [ ] Task: Conductor - Ручная верификация 'ownerInfo в состоянии и фасаде'

## Фаза 2: Трёхчастное событие + kind в payload

- [ ] Task: Написать падающие тесты на трёхчастное событие (`ownerInfo` + `payload.kind`)
- [ ] Task: Ввести `QuestionnaireKind` и переписать события (`QuestionnaireCompletedEvent<TOwnerInfo>` и т.д.)
- [ ] Task: Обновить `buildCompletedEvent`/`buildDeclinedEvent`/`buildAbandonedEvent` в обоих агрегатах
- [ ] Task: Conductor - Ручная верификация 'Трёхчастное событие'

## Фаза 3: Рефакторинг метрик

- [ ] Task: Написать падающие тесты на метрик-событие после рефакторинга
- [ ] Task: Перенести `MetricAssessment` в `ownerInfo`; `metricScores` оставить в payload; сохранить `computeMetricScores`/`buildEngine`
- [ ] Task: Conductor - Ручная верификация 'Рефакторинг метрик'

## Фаза 4: Прокидка TelegramQuestionnaireBotFacade

- [ ] Task: Заменить `botFacadeStub` на `TelegramQuestionnaireBotFacade` в `create-api-app.ts`
- [ ] Task: Проверить проактивный старт анкеты (`start`/`sendMetricInvite` рендерят экраны)
- [ ] Task: Conductor - Ручная верификация 'TelegramQuestionnaireBotFacade'
