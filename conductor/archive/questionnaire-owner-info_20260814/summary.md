# Итоговый отчёт — Трек B: questionnaire ownerInfo + явные события + Likert/Skill/PeerReview

## Название и цель

Трек `questionnaire-owner-info_20260814` (Трек B).

Модуль `@u7-scl/questionnaire` получил обобщённый механизм передачи «инфы хозяина» (`ownerInfo`). Хозяин анкеты (например, модуль `wish`) при старте передаёт данные и получает их обратно в событии завершения. Модулю анкеты безразлично содержимое `ownerInfo` — он лишь хранит и возвращает его.

Дополнительно в треке:
1. События анкеты стали **явными** (`questionnaire:complete`, `questionnaire:likert-complete` + decline/abandon) — без дискриминатора `kind` в payload.
2. Фасадный метод `start` переименован в `startStandard`, `sendMetricInvite` → `sendLikertInvite`.
3. Переименование домена: в `questionnaire` тип «метрик-анкеты» → `Likert*`; словарь навыков человека переехал в `@u7-scl/peer-review` → `Skill*`, контекст оценки → `PeerReview*`.
4. Валидация выходящего словаря `likertScores` осталась за агрегатом `LikertQuestionnaireAr`.
5. Реальный `TelegramQuestionnaireBotFacade` подключён в `u7-bot` вместо заглушки.

## Выполненные задачи

Все кодовые задачи плана отмечены `[x]`:

- **Фаза 1 — `ownerInfo` в состоянии и фасаде:** поле `ownerInfo: Record<string, unknown>` добавлено в `QuestionnaireSchema`/`BaseQuestionnaireState`; фабрика `createStandard`/`createLikert` принимают и сохраняют `ownerInfo`; фасад `start` → `startStandard`, `sendMetricInvite` → `sendLikertInvite`; команды UC переведены на `ownerInfo` (из `SendLikertInviteCmd` убран `assessment`).
- **Фаза 2 — явные имена событий:** `events.ts` переписан на 6 дженерик-событий с явными именами; `buildCompletedEvent`/`buildDeclinedEvent`/`buildAbandonedEvent` в обоих агрегатах формируют `ownerInfo` и `eventName`; `kind` остался только в состоянии (для `restore`), в payload не попадает.
- **Фаза 3 — переименование `Metric*` → `Likert*`:** папка `metric/` → `likert/`; типы/схемы/поля/payload переименованы (`metricMapping` → `likertMapping`, `metricScores` → `likertScores` и т.д.); UC `send-metric-invite` → `send-likert-invite`, `kind: 'likert'`.
- **Фаза 4 — словарь `Skill*` + оценка `PeerReview*`:** полные типы (`categories.ts`, `scores.ts`, `assessment.ts`) и их тесты переехали в `peer-review/src/domain/peer-review/`; в `questionnaire` остались узкие `Likert*`; `metric-question-pool.ts` → `peer-review-question-pool.ts`, `METRIC_POOLS` → `PEER_REVIEW_POOLS`; `questionnaire` не импортирует `peer-review`.
- **Фаза 5 — прокидка `TelegramQuestionnaireBotFacade`:** `botFacadeStub` заменён на реальный `TelegramQuestionnaireBotFacade` в `create-api-app.ts`; проактивный старт анкеты рендерит экраны, включая `captureInput`.
- **Финал:** `bun run check:p questionnaire` и `bun run check:p peer-review` — зелёные.

## Список созданных/изменённых файлов

### `packages/questionnaire`
- `src/domain/facade.ts` — `startStandard<TOwnerInfo>` / `sendLikertInvite<TOwnerInfo>`.
- `src/domain/index.ts`, `src/domain/module.ts`.
- `src/domain/questionnaire/entity.ts` — `ownerInfo` в состоянии.
- `src/domain/questionnaire/events.ts` — явные дженерик-события.
- `src/domain/questionnaire/questionnaire-factory.ts` (+ `.test.ts`) — `createStandard`/`createLikert` с `ownerInfo`.
- `src/domain/questionnaire/repo.ts`.
- `src/domain/questionnaire/commands/start-cmd.ts`, `commands/send-likert-invite-cmd.ts` (новый), `commands/send-metric-invite-cmd.ts` (удалён).
- `src/domain/questionnaire/likert/likert-question.ts` (новый), `likert-questionnaire.ts` (новый), `likert-questionnaire-ar.ts` (+ `.test.ts`, переименованы из `metric/`).
- `src/domain/questionnaire/metric/` — удалены `metric-question.ts`, `metric-questionnaire.ts` и их тесты.
- `src/domain/questionnaire/standard/questionnaire-ar.ts` (+ `.test.ts`).
- `src/api/index.ts`, `module.ts` (+ `.test.ts`), `questionnaire/start-uc.ts`, `questionnaire/send-likert-invite-uc.ts` (переименован), `questionnaire/uc-metas.ts`.
- `src/infra/db/questionnaire-json-repo.test.ts`.

### `packages/peer-review`
- `src/domain/index.ts`.
- `src/domain/peer-review/categories.ts` (+ `.test.ts`), `scores.ts` (+ `.test.ts`), `assessment.ts` (+ `.test.ts`), `index.ts`.
- `src/domain/peer-review-question-pool.ts` (+ `.test.ts`) — переименован из `metric-question-pool.ts`; `PEER_REVIEW_POOLS`.

### `apps/u7-bot`
- `src/create-api-app.ts` — `botFacadeStub` → `TelegramQuestionnaireBotFacade`.
- `src/infra/bot-transport.ts`, `src/infra/questionnaire-bot-facade.ts`.
- `src/main.ts`.

### Документация
- `apps/u7-bot/src/controllers/questionnaire/ui-spec.md` — актуализированы имена методов фасада в разделе «Путь пользователя».

## Архитектурные решения и обоснование

1. **`ownerInfo: Record<string, unknown>`** — непрозрачное поле состояния; модулю анкеты всё равно, что внутри.
2. **Дженерик `TOwnerInfo` только на границе** (фасад и тип события); внутри цепочки (агрегат/фабрика/UC) — непрозрачный `Record<string, unknown>`.
3. **Явные имена событий, без `kind` в payload:** `kind` остаётся runtime-дискриминатором только в состоянии (нужен `restore`).
4. **`questionnaire` не зависит от `peer-review`** — узкие `Likert*` типы самодостаточны; словарём навыков владеет `peer-review`.
5. **Валидация выхода `likertScores`** — за агрегатом `LikertQuestionnaireAr` (схема `LikertScoreSchema`); вход валидирует владелец `peer-review` на своей границе.
6. **`PeerReviewAssessment` переезжает в `ownerInfo`**; `likertScores` остаётся в payload `questionnaire:likert-complete`.

## Отклонения от первоначального плана

Отклонений нет — реализация соответствует `spec.md` и `plan.md`.

## Известные ограничения и незавершённые задачи

- **Ручные верификации (5 задач)** в `plan.md` (одна на фазу) не выполнялись вручную; закрыты решением пользователя в чате.
- **`bun run check:a u7-bot`:** lint и tsc — зелёные; тесты `397 pass, 4 fail`. Упавшие тесты — pre-existing в `CreateStream` wizard, не связаны с треком (не трогались в рамках трека).
- Экраны анкеты S01–S06 остаются в бэклоге (`📋` в `questionnaire/ui-spec.md`) — перенос рендеринга анкеты в стори выполняется следующим треком `ui-proactive-sender_20260816`.
