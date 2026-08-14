# Спецификация — Трек B: questionnaire ownerInfo + событие

## Обзор

Модуль `@u7-scl/questionnaire` получает обобщённый механизм передачи **«инфы хозяина»** (`ownerInfo`). Хозяин анкеты (например, модуль `wish`) при старте передаёт часть данных и получает их обратно в событии завершения. Модулю анкеты **безразлично содержимое** `ownerInfo` — он лишь хранит его и возвращает в событии; движок анкеты от него не зависит.

Дженерик `TOwnerInfo` вводится **только на границе** (сигнатура фасада и тип события), чтобы вызывающая/подписывающаяся сторона получала типизацию. Внутри цепочки (агрегат/фабрика/UC) `ownerInfo` остаётся непрозрачным `Record<string, unknown>`.

Поле `kind` **остаётся** (нужно самому модулю для дискриминации `restore`/движка) и добавляется в `payload` события — оно сообщает клиенту, какой тип анкеты завершился.

## Текущее состояние (базовая линия)

- `packages/questionnaire/src/domain/questionnaire/entity.ts` — `Questionnaire` (standard), `BaseQuestionnaireState`, `BaseQuestionnaireArMeta`; поле `kind: 'standard' | 'metric'`.
- `packages/questionnaire/src/domain/questionnaire/question.ts` — `QuestionnairePool` (`inviteText?`, `whyText?`, `completionText?`, `cancelWarning?`, `questions[]`).
- `packages/questionnaire/src/domain/questionnaire/metric/metric-questionnaire.ts` — `MetricAssessment` (`context`, `role`, `subjectId`, `triggerEvent?`), `MetricQuestionnaireSchema = { ...QuestionnaireSchema.entries, kind: 'metric', questionPool: MetricQuestionPool, assessment: MetricAssessment }`.
- `packages/questionnaire/src/domain/questionnaire/events.ts` — `QuestionnairePayload = { questionnaireId, respondentId }`; `QuestionnaireCompleted/Declined/Abandoned`; `MetricQuestionnaireCompleted` и др. расширяют payload через `& MetricAssessment & { metricScores }`.
- `packages/questionnaire/src/domain/questionnaire/standard/questionnaire-ar.ts` — `QuestionnaireAr.basePayload()` = `{ questionnaireId, respondentId }`.
- `packages/questionnaire/src/domain/questionnaire/metric/metric-questionnaire-ar.ts` — `MetricQuestionnaireAr` (своя логика: `buildEngine`, `computeMetricScores`, `assessmentFields`).
- `packages/questionnaire/src/domain/questionnaire/a-root.ts` — `BaseQuestionnaireAr` (абстрактный движок).
- `packages/questionnaire/src/domain/questionnaire/questionnaire-factory.ts` — `QuestionnaireFactory.createStandard/createMetric/restore` (дискриминатор по `kind`).
- `packages/questionnaire/src/domain/facade.ts` — `QuestionnaireInProcFacade.start(actorId, pool)` / `sendMetricInvite(actorId, pool, assessment)` (возвращают `void`).
- `packages/questionnaire/src/api/questionnaire/start-uc.ts` — `StartUc` (createStandard).
- `packages/questionnaire/src/api/questionnaire/start-by-invite-uc.ts` — `StartByInviteUc`.
- `packages/questionnaire/src/api/questionnaire/send-metric-invite-uc.ts` — `SendMetricInviteUc` (createMetric, `getInvite`, `botFacade.sendQuestionnaireInvite`).
- `apps/u7-bot/src/create-api-app.ts` — `botFacadeStub` (заглушка `sendQuestionnaireInvite`/`startQuestionnaire`) передаётся в questionnaire-модуль.
- `apps/u7-bot/src/infra/questionnaire-bot-facade.ts` — `TelegramQuestionnaireBotFacade` (реальная реализация, рендерит S01–S04 через `ProactiveSender`; **ещё не подключена**).

## Зафиксированные решения

1. **`ownerInfo: Record<string, unknown>`** — непрозрачное поле в состоянии анкеты; модулю анкет всё равно, что внутри.
2. **Дженерик `TOwnerInfo extends Record<string, unknown>`** — только в фасаде (`start`/`start-by-invite`) и в типе события.
3. **Событие — трёхчастная структура:** (1) поля `DomainEvent`; (2) `ownerInfo: TOwnerInfo`; (3) `payload: { questionnaireId, respondentId, kind }`.
4. **`kind` остаётся** runtime-дискриминатором (для `restore`/движка) и добавляется в `payload`.
5. **Метрика:** `MetricAssessment` переезжает в `ownerInfo`; `metricScores` остаётся в `payload` (метрик-расширение); логика `MetricQuestionnaireAr` сохраняется.
6. **`DomainEvent` НЕ дженерик** — событие сужает `eventName` литералом (см. трек A).

## FR1 — `ownerInfo` в состоянии анкеты

- В `QuestionnaireSchema` (и `BaseQuestionnaireState`) добавить поле `ownerInfo: v.record(v.string(), v.unknown())` (валидация: «любой объект с string-ключами»).
- `QuestionnaireFactory.createStandard(respondentId, pool, ownerInfo)` и `createMetric(respondentId, pool, ownerInfo)` принимают и сохраняют `ownerInfo`.
- Значение по умолчанию для обратной совместимости: `{}` (пустой объект), если хозяин ничего не передал.

## FR2 — Дженерик на границе фасада

```ts
class QuestionnaireInProcFacade {
  async start<TOwnerInfo extends Record<string, unknown> = Record<string, unknown>>(
    actorId: string,
    pool: QuestionnairePool,
    ownerInfo: TOwnerInfo,
  ): Promise<void> {
    await this.module.execute('start', { pool, ownerInfo }, actorId);
  }

  // аналогично start-by-invite (если фасад его предоставляет)
  // sendMetricInvite — ownerInfo зафиксирован как MetricAssessment:
  async sendMetricInvite(
    actorId: string,
    pool: MetricQuestionPool,
    ownerInfo: MetricAssessment,
  ): Promise<void>;
}
```

- Вызывающая сторона указывает дженерик (`start<{ courseId: string }>(...)`), и компилятор проверяет, что передан ровно этот тип.
- Команды UC (`StartCmd`, `StartByInviteCmd`, `SendMetricInviteCmd`) получают поле `ownerInfo`; на уровне UC тип — `Record<string, unknown>` (дженерик живёт только в фасаде, внутренняя цепочка остаётся непрозрачной).

## FR3 — Трёхчастное событие + `kind` в payload

Заменить текущие события на дженерик-варианты:

```ts
export interface QuestionnaireCompletedEvent<
  TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
> extends DomainEvent {
  eventName: 'questionnaire.completed';
  aggregateName: 'Questionnaire';
  ownerInfo: TOwnerInfo;                          // часть 2 — инфа хозяина
  payload: {                                      // часть 3 — чисто про анкету
    questionnaireId: string;
    respondentId: string;
    kind: 'standard' | 'metric';
  };
}
```

Аналогично `QuestionnaireDeclinedEvent`, `QuestionnaireAbandonedEvent`.

- `buildCompletedEvent()` в `QuestionnaireAr` / `MetricQuestionnaireAr` формирует событие с `ownerInfo: this.state.ownerInfo` и `payload.kind: this.state.kind`.
- `kind` — вынести в отдельный тип `QuestionnaireKind = 'standard' | 'metric'` (переиспользуется в состоянии и событиях).

## FR4 — Рефакторинг метрик

- `MetricQuestionnaire` больше не хранит отдельное поле `assessment` — `MetricAssessment` передаётся как `ownerInfo`.
- `MetricQuestionnaireAr`:
  - `assessmentFields()` читает `this.state.ownerInfo` (кастится к `MetricAssessment`);
  - `computeMetricScores()` сохраняется без изменений;
  - `buildEngine()` сохраняется без изменений.
- `MetricQuestionnaireCompletedEvent` — расширение базового события:
  ```ts
  export interface MetricQuestionnaireCompletedEvent
    extends QuestionnaireCompletedEvent<MetricAssessment> {
    payload: {
      questionnaireId: string;
      respondentId: string;
      kind: 'metric';
      metricScores: MetricScore[];
    };
  }
  ```
  (`metricScores` остаётся в payload как результат анкеты; `ownerInfo` = `MetricAssessment`.)

## FR5 — Прокидка `TelegramQuestionnaireBotFacade`

- В `apps/u7-bot/src/create-api-app.ts` заменить `botFacadeStub` на реальный `TelegramQuestionnaireBotFacade` (он требует `ProactiveSender`/`BotTransport`).
- Проверить, что `start`/`sendMetricInvite` реально рендерят экраны через `transport.send()` (проактивный старт анкеты). Учесть путь `captureInput` для проактивных сообщений.
- ⚠️ Заглушка `startQuestionnaire: async () => {}` сейчас не рендерит первый вопрос — после подключения проактивный старт должен работать.

## Критерии приёмки

- [ ] `ownerInfo` сохраняется в состоянии и возвращается в событии (standard и metric).
- [ ] Фасад `start`/`start-by-invite` принимают дженерик `TOwnerInfo` и строго проверяют тип.
- [ ] Событие завершения — трёхчастное, с `kind` в payload.
- [ ] Метрики работают после рефакторинга (`MetricAssessment` → ownerInfo, `metricScores` в payload).
- [ ] Реальный `TelegramQuestionnaireBotFacade` подключён вместо стаба.
- [ ] `bun run check:p questionnaire` и `bun run check:a u7-bot` проходят.

## За рамками

- Сам модуль `wish` (треки C1/C2).
- UI-экраны каталога курсов (трек D).
- Изменения в `EventBus` (трек A).

## Контекст и связанные документы

- [arch-boundary-design](../../.pi/skills/arch-boundary-design/SKILL.md) — где размещать логику.
- [ddd-domain](../../.pi/skills/ddd-domain/SKILL.md) — шаблоны Domain-слоя (агрегат, события).
- [ddd-api](../../.pi/skills/ddd-api/SKILL.md) — шаблоны API-слоя.
- [questionnaire/ui-spec.md](../../apps/u7-bot/src/controllers/questionnaire/ui-spec.md) — экраны анкеты.
- [course/ui-spec.md](../../apps/u7-bot/src/controllers/courses/ui-spec.md) — раздел «Желание пройти курс» (потребитель ownerInfo).
- [metrics-questionnaire-and-events.md](../../metrics-questionnaire-and-events.md) — релиз 4, описание фасада/событий.
- [Рабочий процесс](../../workflow.md) — жизненный цикл задач.
