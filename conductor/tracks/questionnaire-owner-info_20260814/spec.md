# Спецификация — Трек B: questionnaire ownerInfo + явные события + Likert/Skill/PeerReview

## Обзор

Модуль `@u7-scl/questionnaire` получает обобщённый механизм передачи **«инфы хозяина»** (`ownerInfo`). Хозяин анкеты (например, модуль `wish`) при старте передаёт часть данных и получает их обратно в событии завершения. Модулю анкеты **безразлично содержимое** `ownerInfo` — он лишь хранит его и возвращает в событии.

Одновременно в треке:

1. События анкеты становятся **явными** — `questionnaire:complete` и `questionnaire:likert-complete` (и аналогично для decline/abandon), без дискриминатора `kind` в payload.
2. Фасадный метод `start` переименовывается в `startStandard`.
3. **Переименование домена:** в `questionnaire` тип «метрик-анкеты» называется `Likert*` (это анкета по шкале Лайкерта со скорингом), а словарь навыков человека переезжает в модуль `@u7-scl/peer-review` и называется `Skill*`, контекст оценки — `PeerReview*`.
4. **Валидация выходящего словаря** (`likertScores`) остаётся за агрегатом `LikertQuestionnaireAr` — он знает структуру выхода.

Дженерик `TOwnerInfo` вводится **только на границе** (сигнатура фасада и тип события). Внутри цепочки (агрегат/фабрика/UC) `ownerInfo` остаётся непрозрачным `Record<string, unknown>`.

## Текущее состояние (базовая линия)

- `packages/questionnaire/src/domain/questionnaire/entity.ts` — `Questionnaire` (standard), `BaseQuestionnaireState`, `BaseQuestionnaireArMeta`; поле `kind: 'standard' | 'metric'`.
- `packages/questionnaire/src/domain/questionnaire/question.ts` — `QuestionnairePool`.
- `packages/questionnaire/src/domain/questionnaire/metric/metric-questionnaire.ts` — `MetricAssessment`, `MetricQuestionnaire` (с `assessment`).
- `packages/questionnaire/src/domain/questionnaire/metric/metric-question.ts` — полный словарь: `MetricCategory`, `MetricSubcategory`, `MetricWeight`, `MetricMapping`, `MetricScore`, `LIKERT_SCALE`, `MetricQuestion`, `MetricQuestionPool`.
- `packages/questionnaire/src/domain/questionnaire/events.ts` — события `questionnaire.completed/declined/abandoned` + метрик-расширения payload.
- `packages/questionnaire/src/domain/questionnaire/standard/questionnaire-ar.ts` и `metric/metric-questionnaire-ar.ts` — агрегаты.
- `packages/questionnaire/src/domain/questionnaire/questionnaire-factory.ts` — `createStandard/createMetric/restore` (дискриминатор по `kind`).
- `packages/questionnaire/src/domain/facade.ts` — `QuestionnaireInProcFacade.start(actorId, pool)` / `sendMetricInvite(actorId, pool, assessment)`.
- `packages/peer-review/src/domain/metric-question-pool.ts` — конфигурации пулов метрик (импортирует полные типы из questionnaire).
- `apps/u7-bot/src/create-api-app.ts` — `botFacadeStub`; `apps/u7-bot/src/infra/questionnaire-bot-facade.ts` — реальная реализация (ещё не подключена).

## Зафиксированные решения

1. **`ownerInfo: Record<string, unknown>`** — непрозрачное поле состояния; модулю анкет всё равно, что внутри.
2. **Дженерик `TOwnerInfo extends Record<string, unknown>`** — только в фасаде и в типе события.
3. **Явные имена событий, без `kind` в payload:**
   - standard: `questionnaire:complete`, `questionnaire:decline`, `questionnaire:abandon`;
   - likert: `questionnaire:likert-complete`, `questionnaire:likert-decline`, `questionnaire:likert-abandon`.
   - `kind` остаётся runtime-дискриминатором **только в состоянии** (для `restore`), в payload **не попадает**.
4. **Фасад:** метод `start` → `startStandard`; `sendMetricInvite` → `sendLikertInvite` и принимает `ownerInfo` вместо `assessment`. Внутренний UC `start` не переименовывается.
5. **Именование:** в `questionnaire` все `Metric*`/`metric*` → `Likert*`/`likert*` (файлы, типы, `kind: 'likert'`, UC `send-likert-invite`, события `questionnaire:likert-*`, поле `metricMapping` → `likertMapping`, `metricScores` → `likertScores`). В `peer-review` словарь навыков → `Skill*`/`skill*` (категории, подкатегории, веса, маппинг, балл), контекст оценки → `PeerReview*` (context, role, triggerEvent, assessment).
6. **Модуль `peer-review`** — владелец словаря метрик человека (отдельный модуль `metrics` не создаётся). **`questionnaire` НЕ зависит от `peer-review`**.
7. **`PeerReviewAssessment` переезжает в `ownerInfo`**; `likertScores` остаётся в payload события `questionnaire:likert-complete`.

## Анализ: что нужно агрегату `LikertQuestionnaireAr`

Агрегат likert-анкеты не должен знать словарь метрик (какие категории/роли/контексты допустимы). Он знает только, **как посчитать** баллы по переданным ему данным. Поэтому:

| Что делает агрегат | Узкий тип в `questionnaire` | Уезжает в `peer-review` (полный словарь) |
|---|---|---|
| Преобразует вопрос в `ChoiceQuestion` для движка | `LikertQuestion { questionCode, question, likertMapping }` + `LIKERT_SCALE` (1–5) | — |
| Группирует ответы и считает средневзвешенное | `LikertMapping { category: string; subcategory: string; weight: number }` | `SkillMapping` (дискриминантный union категория↔подкатегория, вес ∈ {0.75, 1, 1.25}) |
| Отдаёт результат в событии | `LikertScore { category: string; subcategory: string; score: number }` | `SkillScore` (дискриминантный union) |
| Хранит ответы | `LikertAnswer { questionCode, answerCode, answeredAt }` — без `answerText` (likert всегда choice) | — |
| Хранит пул | `LikertQuestionPool { inviteText?, whyText?, completionText?, cancelWarning?, questions: LikertQuestion[] }` | — |
| Оценочный контекст | **не нужен** — приходит как `ownerInfo` | `PeerReviewContext`, `PeerReviewRole`, `PeerReviewTriggerEvent`, `PeerReviewAssessment` |

**Валидация:**
- **Вход** (пул и assessment) валидирует владелец `peer-review` на своей границе: полные `SkillMapping`/`PeerReviewAssessment` и т.д.
- **Выход** (`likertScores`) валидирует **сам агрегат** `LikertQuestionnaireAr` схемой `LikertScoreSchema` (структура `category`/`subcategory`/`score ∈ [1;5]`). Он знает структуру выхода и не перекладывает это на владельца.

В `questionnaire` остаются только структурные проверки (`questionCode`/`question` непустые, `weight` — число, хотя бы один вопрос, `score` ∈ [1;5]).

`LIKERT_SCALE` остаётся в `questionnaire`: он нужен агрегату для сборки движка (`toChoiceQuestion`), а импортировать его из `peer-review` нельзя (нарушение границы зависимостей).

## FR1 — `ownerInfo` в состоянии анкеты

- В `QuestionnaireSchema` и `BaseQuestionnaireState` добавить `ownerInfo: v.record(v.string(), v.unknown())`.
- `QuestionnaireFactory.createStandard(respondentId, pool, ownerInfo)` и `createLikert(respondentId, pool, ownerInfo)` принимают и сохраняют `ownerInfo`.
- Значение по умолчанию для обратной совместимости — `{}`.

## FR2 — Фасад `startStandard` + дженерик на границе

```ts
class QuestionnaireInProcFacade {
  async startStandard<
    TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
  >(actorId: string, pool: QuestionnairePool, ownerInfo: TOwnerInfo): Promise<void> {
    await this.module.execute('start', { pool, ownerInfo }, actorId);
  }

  async sendLikertInvite<
    TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
  >(actorId: string, pool: LikertQuestionPool, ownerInfo: TOwnerInfo): Promise<void> {
    await this.module.execute('send-likert-invite', { pool, ownerInfo }, actorId);
  }
}
```

- `start` → `startStandard` (переименование только фасадного метода; UC `start` остаётся).
- `sendMetricInvite` → `sendLikertInvite`; UC `send-metric-invite` → `send-likert-invite`.
- Команды UC `StartCmd`/`SendLikertInviteCmd` получают `ownerInfo: Record<string, unknown>`; `SendLikertInviteCmd` больше не имеет поля `assessment`.

## FR3 — Явные имена событий (без `kind` в payload)

Заменить события на дженерик-варианты с явными именами:

```ts
type QuestionnaireBasePayload = { questionnaireId: string; respondentId: string };

export interface QuestionnaireCompleteEvent<
  TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
> extends DomainEvent {
  eventName: 'questionnaire:complete';
  aggregateName: 'Questionnaire';
  ownerInfo: TOwnerInfo;
  payload: QuestionnaireBasePayload;
}
// QuestionnaireDeclineEvent / QuestionnaireAbandonEvent — аналогично
// ('questionnaire:decline' / 'questionnaire:abandon')

export interface LikertQuestionnaireCompleteEvent<
  TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
> extends DomainEvent {
  eventName: 'questionnaire:likert-complete';
  aggregateName: 'Questionnaire';
  ownerInfo: TOwnerInfo;
  payload: QuestionnaireBasePayload & { likertScores: LikertScore[] };
}
// LikertQuestionnaireDeclineEvent / LikertQuestionnaireAbandonEvent — payload
// без likertScores ('questionnaire:likert-decline' / 'questionnaire:likert-abandon')
```

- `buildCompletedEvent()/buildDeclinedEvent()/buildAbandonedEvent()` в обоих агрегатах формируют `ownerInfo: this.state.ownerInfo` и соответствующий `eventName`.
- `kind` в payload отсутствует; из состояния не удаляется (нужен `restore`), значение `kind: 'likert'`.

## FR4 — Словарь `Skill*` + оценка `PeerReview*` в `peer-review` + узкие `Likert*` в `questionnaire`

Словарь метрик переезжает в **существующий** пакет `packages/peer-review` (новый пакет не создаётся):

```
packages/peer-review/src/
  domain/
    peer-review/
      categories.ts   — SkillCategory, SkillSubcategory, SkillWeight, SkillMapping (полный union) + схемы
      scores.ts       — SkillScore (полный union) + схема
      assessment.ts   — PeerReviewContext, PeerReviewRole, PeerReviewTriggerEvent, PeerReviewAssessment + схемы
      index.ts
    peer-review-question-pool.ts      — конфигурации пулов (был metric-question-pool.ts; импорт из ./peer-review)
    peer-review-question-pool.test.ts
    index.ts
  index.ts
```

**В `questionnaire` остаются узкие типы (папка `likert/`):**

- `likert/likert-question.ts` — узкие `LikertMapping`/`LikertScore`/`LikertQuestion`/`LikertQuestionPool` + `LIKERT_SCALE` (см. таблицу анализа).
- `likert/likert-questionnaire.ts` — `LikertAnswer` (без `answerText`), `LikertQuestionnaire` (без поля `assessment`, `kind: 'likert'`).
- `likert/likert-questionnaire-ar.ts` — `computeLikertScores()`/`buildEngine()`/`toChoiceQuestion()` сохраняются, но на узких типах; `assessmentFields()` удаляется; **валидация выхода `likertScores` — здесь** (`LikertScoreSchema`).

**Перенос и границы:**

- Полные схемы/типы (categories, scores, assessment) и их тесты (`metric-question.test.ts`, `metric-questionnaire.test.ts`) переезжают в `peer-review/src/domain/peer-review/` и переименовываются: словарь навыков — в `Skill*`, оценка — в `PeerReview*`.
- `packages/peer-review/src/domain/peer-review-question-pool.ts` импортирует полные типы локально (`./peer-review`), вместо `@u7-scl/questionnaire/domain`; константа `METRIC_POOLS` → `PEER_REVIEW_POOLS`.
- Новый пакет не создаётся → корневой `tsconfig.json` не меняется.
- Зависимость `peer-review → questionnaire` в package.json сохраняется (фасад), но полные типы пулов больше не импортируются оттуда.
- **`questionnaire` не импортирует `peer-review`** — узкие типы самодостаточны.

## FR5 — Прокидка `TelegramQuestionnaireBotFacade`

- В `apps/u7-bot/src/create-api-app.ts` заменить `botFacadeStub` на реальный `TelegramQuestionnaireBotFacade` (требует `ProactiveSender`/`BotTransport`).
- Проверить, что `startStandard`/`sendLikertInvite` реально рендерят экраны через `transport.send()` (проактивный старт), включая путь `captureInput`.
- ⚠️ Заглушка `startQuestionnaire: async () => {}` сейчас не рендерит первый вопрос — после подключения проактивный старт должен работать.

## Критерии приёмки

- [ ] `ownerInfo` сохраняется в состоянии и возвращается в событии (standard и likert).
- [ ] Фасад предоставляет `startStandard<TOwnerInfo>` и `sendLikertInvite<TOwnerInfo>` со строгой проверкой типа.
- [ ] События явные: `questionnaire:complete`, `questionnaire:likert-complete` (+ decline/abandon); `kind` отсутствует в payload.
- [ ] Выход `likertScores` валидирует агрегат `LikertQuestionnaireAr` (схема `LikertScoreSchema`).
- [ ] Метрики работают: `PeerReviewAssessment` — в `ownerInfo`, `likertScores` — в payload `questionnaire:likert-complete`.
- [ ] Модуль `peer-review` владеет словарём `Skill*` и оценкой `PeerReview*`; `questionnaire` использует узкие `Likert*` и не импортирует `peer-review`.
- [ ] `peer-review` больше не импортирует полные типы пулов из `questionnaire`.
- [ ] Реальный `TelegramQuestionnaireBotFacade` подключён вместо стаба.
- [ ] `bun run check:p questionnaire`, `bun run check:p peer-review`, `bun run check:a u7-bot` проходят.

## За рамками

- Сам модуль `wish` (треки C1/C2).
- UI-экраны каталога курсов (трек D).
- Агрегация метрик студента (`StudentMetrics`) — будущий трек.
- Изменения в `EventBus` (трек A).

## Контекст и связанные документы

- [arch-boundary-design](../../.pi/skills/arch-boundary-design/SKILL.md) — где размещать логику.
- [ddd-domain](../../.pi/skills/ddd-domain/SKILL.md) — шаблоны Domain-слоя.
- [ddd-api](../../.pi/skills/ddd-api/SKILL.md) — шаблоны API-слоя.
- [Границы доменной логики](../../code_styleguides/domain-boundaries.md) — межмодульные взаимодействия.
- [Пайплайн + модули](../../metrics-pipeline-and-modules.md) — контекст модулей `peer-review` и метрик.
- [questionnaire/ui-spec.md](../../apps/u7-bot/src/controllers/questionnaire/ui-spec.md) — экраны анкеты.
- [course/ui-spec.md](../../apps/u7-bot/src/controllers/courses/ui-spec.md) — потребитель ownerInfo («Желание пройти курс»).
- [Рабочий процесс](../../workflow.md) — жизненный цикл задач.
