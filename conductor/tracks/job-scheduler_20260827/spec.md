# Спецификация — Трек: Job — планировщик периодических заданий + брошенные анкеты

## Обзор

Две связанные части:

1. **Сущность `Job`** — новая категория участника ApiModule в core (аналог UseCase): доменная логика, выполняемая планировщиком по интервалу, а не по действию пользователя.
2. **Брошенные анкеты** — job в модуле questionnaire: раз в час проверяет активные анкеты; 6 часов простоя → предупреждение пользователю; 8 часов → прерывание (abandon).

Пользовательская ценность: анкета желания не «зависает» в `pending` навсегда — пользователь получает напоминание с кнопкой продолжения, а брошенная анкета закрывается (wish → abandoned, можно начать заново из карточки курса).

Порядок выполнения: желательно **после трека D (wish UI)** — оба трогают FillStory; D вводит механику `fill:resume`, которую переиспользует предупреждение.

## Текущее состояние (базовая линия)

- `packages/core/src/api/module/api-module.ts` — только `useCases` + `reactions`; категории jobs нет. `init()` пробрасывает резолвер UC и подписывает ER.
- `packages/questionnaire/src/domain/questionnaire/entity.ts` — статусы `invited | in_progress | completed | abandoned`; есть `updatedAt`; поля `warnedAt` нет.
- `packages/questionnaire/src/api/questionnaire/abandon-uc.ts` — UC abandon существует, публикует `questionnaire:abandon`.
- `packages/wish/src/api/er/abandon-wish-er.ts` — ER уже подписан на `questionnaire:abandon` (pending → abandoned). **Модуль wish менять не нужно.**
- `apps/u7-bot/src/controllers/questionnaire/fill.story.ts` — подписки на `questionnaire:start` / `questionnaire:invite`, ProactiveSender.
- `apps/u7-bot/src/create-api-app.ts` / `main.ts` — точки сборки и запуска приложения.

## Зафиксированные решения

1. **`Job` в core/api** — абстрактный класс, аналог UseCase: `jobName`, `jobLabel`, `intervalMs`, `execute()`. Резолвер инъектируется в `init()` модуля (как у UC). Вызывается планировщиком, не пользователем.
2. **`ApiModule.jobs`** — новое поле; в `init()` пробрасывает резолвер джобам.
3. **`JobScheduler` на уровне приложения** (`apps/u7-bot/src/infra/job-scheduler.ts`): собирает `jobs` всех модулей, запускает по `setInterval`. Ошибка одного прогона — лог, процесс не падает.
4. **Sweep-job в модуле questionnaire**: имя `sweep-abandoned-questionnaires`, интервал 60 мин.
5. **Точка отсчёта простоя — `updatedAt` анкеты** (последняя активность): каждый ответ сбрасывает оба таймера и обнуляет `warnedAt`.
6. **Предупреждение (≥6ч)** — событие `questionnaire:abandon-warning`; рендерит FillStory через ProactiveSender, кнопки «▶️ Продолжить анкету» и «⏭️ Прервать».
7. **Abandon (≥8ч)** — через существующий механизм UC abandon; в событие `questionnaire:abandon` добавляется опциональное `reason: 'timeout'` (обратно совместимо), чтобы UI не дублировал сообщение при пользовательском `/cancel`.
8. **v1 — только `kind: 'standard'`** (wish-флоу); likert-анкеты — за рамками.

## FR1 — `Job` в core/api

- `packages/core/src/api/job/job.ts`:
  ```ts
  export abstract class Job<TResolve> {
    abstract readonly jobName: string;
    abstract readonly jobLabel: string;
    /** Интервал запуска в мс. */
    abstract readonly intervalMs: number;
    protected resolve!: TResolve;
    init(resolve: TResolve): void;
    abstract execute(): Promise<void>;
  }
  ```
- `ApiModule`: поле `readonly jobs: Job[] = []`; в `init()` — `job.init(this.resolve)`.
- Тесты: контракт Job, регистрация в модуле, проброс резолвера.

## FR2 — `JobScheduler` в приложении

- `apps/u7-bot/src/infra/job-scheduler.ts`: `startJobScheduler(modules, logger): StopFn`.
  - Для каждого job каждого модуля — `setInterval(job.intervalMs, run)`.
  - `run` обёрнут в `try/catch` → `logger.warn`; ошибка прогона не роняет процесс.
  - Возвращает функцию остановки (clearInterval всех таймеров).
- Запуск в `main.ts` после `createApiApp`; остановка — при завершении процесса (если механизм shutdown есть).
- Тесты: сбор jobs, интервалы, устойчивость к ошибкам, stop.

## FR3 — Sweep-job `sweep-abandoned-questionnaires` в questionnaire

- `packages/questionnaire/src/api/questionnaire/sweep-abandoned-job.ts`:
  - `intervalMs = 60 * 60 * 1000` (1 час).
  - Получить активные анкеты: новый метод репо `questionnaireRepo.getActive()` (`status = 'in_progress'`); в job — фильтр `kind === 'standard'`.
  - `idleMs = now - (updatedAt ?? createdAt)`.
  - `idleMs >= 8ч` → abandon (п.3.1).
  - `idleMs >= 6ч && !warnedAt` → предупреждение (п.3.2).
- **3.1 abandon:** вызов существующего UC `abandon` от имени респондента (либо доменный `ar.abandon()` + save + publish — единообразно с UC, на усмотрение имплементации). Идемпотентно: статус уже `abandoned` → пропустить. В payload события — `reason: 'timeout'`.
- **3.2 предупреждение:** `warnedAt = now` (доменный метод), save, публикация события:
  ```ts
  interface QuestionnaireAbandonWarningEvent extends DomainEvent {
    eventName: 'questionnaire:abandon-warning';
    ownerInfo: Record<string, unknown>; // как у анкеты (courseId)
    payload: { questionnaireId, respondentId, telegramId };
  }
  ```
- Регистрация: `QuestionnaireApiModule.jobs = [new SweepAbandonedJob()]`.

## FR4 — `warnedAt` в домене анкеты

- `QuestionnaireSchema` + `BaseQuestionnaireState`: `warnedAt: v.optional(v.isoDateTime)` (JSON-миграция не нужна — поле опциональное).
- Доменные методы QuestionnaireAr: `markWarned()` (установка `warnedAt`) и сброс `warnedAt` при активности (там, где обновляется `updatedAt`) — активность обнуляет предупреждение.

## FR5 — UI: предупреждение и таймаут-abandon в FillStory

- Подписка на `questionnaire:abandon-warning` → `ProactiveSender.send`:
  - текст предупреждения (тон «на ты», точная формулировка — на имплементации): «⏳ Ты не закончил анкету. Если не продолжить, она будет прервана автоматически.»
  - кнопки: `▶️ Продолжить анкету` → `fill:resume:{courseId}` из ownerInfo (механика трека D); `⏭️ Прервать` → существующий confirm-флоу отмены.
- Подписка на `questionnaire:abandon`: сообщение «Анкета прервана. Начни заново в карточке курса» — **только при `reason === 'timeout'`** (пользовательский `/cancel` уже рендерит своё сообщение, дубля быть не должно).

## Ревизия v2 — редизайн контракта Job и жизненного цикла приложения

Ревью выполненной фазы 1 выявило архитектурные замечания. Ниже — зафиксированные решения (фазы 5–7 плана; заменяют решения FR1–FR2 в части контракта Job и планировщика).

### Решения

1. **Расписание — свойство-объект с дискриминантом `kind`** (вместо `intervalMs`), всё в **UTC**:
   ```ts
   type JobSchedule =
     | { kind: 'interval'; intervalMs: number; alignUtc?: boolean; runAtStart?: boolean }
     | { kind: 'dailyAt'; hour: number; minute: number }
     | { kind: 'weeklyAt'; weekday: number; hour: number; minute: number } // 0=вс…6=сб
     | { kind: 'monthlyAt'; day: number; hour: number; minute: number };   // 1–31, кламп на последний день месяца
   ```
   - `alignUtc` — сетка от epoch (UTC): «каждые 6ч после 12:00 UTC» = `intervalMs: 6h + alignUtc`. Сценарий «окно запуска» — не вводится.
2. **`JobMeta = { name; label }`** — без `events` (публикация событий — ответственность агрегата). Job типизируется метой как UC/ER.
3. **`Job.publishEvents(ar)`** — защищённый метод в базовом классе, имя и семантика как у UseCase.
4. **`ApiModule.jobs` — abstract**: каждый модуль явно объявляет свои job'ы (в т.ч. пустой список).
5. **Переживание перезагрузки**: порт `JobRunStore` персистит `lastRunAt` по `jobName` (JSON-файл `db/jobs/last-runs.json`); пишется после каждого прогона (в т.ч. упавшего). При старте упущенный запуск календарного расписания — **один** догоняющий прогон (multi-misfire не воспроизводится, job'ы идемпотентны).
6. **Стартовая задержка** прогонов при старте приложения — 3 мин (константа планировщика, параметр для тестов): не конкурировать с кодом запуска. `runAtStart` уважает `lastRunAt` (без дублей при рестартах).
7. **`questionnaire` — обычный модуль ApiApp**: убрать self-`init()` из конструктора (нарушение каскадной инициализации), включить в `U7BotAppMeta.moduleMetas`, удалить ручной `allModules` из bundle.
8. **Жизненный цикл приложения**: `ApiApp.start()/stop()` (job'ы через DI-планировщик), `UiApp.start()/stop()` (подписки/отписки стори — внутреннее дело UiApp). Порядок в main: `uiApp.start()` → `apiApp.start()` (подписки раньше job'ов). Graceful shutdown по SIGINT/SIGTERM: `uiApp.stop()` → `apiApp.stop()` → bot/server stop; повторный сигнал — форс-выход.
9. **Worker — техдолг**: точка расширения — порт `JobExecutor` (реализация `InProcJobExecutor`). Вынос в отдельный процесс возможен только при внешнем хранилище (in-memory JSON-репо недоступны из воркера).

### Объектная модель планировщика

**Контракты — `core/api/job/`** (их знает ApiApp):
- `Job<TMeta, TResolve>` — abstract: `jobName`, `jobLabel`, `schedule`, `init()`, `execute()`, `publishEvents()`;
- `JobScheduler` — порт: `start(jobs)`, `stop()`;
- `JobExecutor` — порт: `execute(job)` (точка будущего воркера).

**Реализации — `core/infra/`** (аналог InProcEventBus):
- `InProcJobScheduler implements JobScheduler` — оркестратор: создаёт по раннеру на job, делегирует start/stop;
- `ScheduledJobRunner` — инкапсулирует один job: таймер, misfire-политика, стартовая задержка, запись `lastRunAt`;
- `JobSchedulePlanner` — чистая календарная математика: `nextRunAfter(schedule, after)` (UTC, кламп, сетка alignUtc);
- `JobRunStore` (порт, только для infra) + `JsonJobRunStore` / `MemoryJobRunStore`;
- `InProcJobExecutor implements JobExecutor` — прогон в текущем процессе.

Ответственности: ApiApp знает модули и запускает планировщик; JobScheduler координирует; ScheduledJobRunner владеет жизнью одного job; Planner считает время; Store помнит прогоны. Хелпер-функции не раскидываются по пакету — каждая ответственность в своём объекте.

## Критерии приёмки

- [ ] ApiModule регистрирует jobs; резолвер пробрасывается; JobScheduler запускает по интервалу; ошибка прогона логируется, процесс жив.
- [ ] Анкета с простоем ≥6ч: ровно одно предупреждение (`warnedAt` — идемпотентность); активность пользователя сбрасывает `warnedAt` и таймеры.
- [ ] Простой ≥8ч: abandon с `reason: 'timeout'` → ER abandon-wish → wish `abandoned`; пользователю уходит сообщение о прерывании.
- [ ] После таймаут-abandon повторное «Хочу пройти курс» создаёт новую анкету (существующее поведение не ломается).
- [ ] Пользовательский `/cancel` не даёт дубля сообщения об abandon.
- [ ] `bun run check:p core`, `check:p questionnaire`, `check:a u7-bot` проходят.

## За рамками

- Likert-анкеты (v1 — только standard).
- Cron-выражения / запуск в конкретное время суток (только интервалы).
- «Тихие часы» (не слать предупреждения ночью).
- Job приглашений желающим при запуске модуля (отдельная фича wish).
- Метрики/дашборд по брошенным анкетам.

## Контекст и связанные документы

- [arch-boundary-design](../../.pi/skills/arch-boundary-design/SKILL.md) — где размещать логику.
- [ddd-api](../../.pi/skills/ddd-api/SKILL.md) — шаблоны API-слоя (Job — по аналогии с UseCase).
- [Трек D wish-ui](../wish-ui_20260814/spec.md) — механика `fill:resume`, экраны W03–W05.
- [api-module.ts](../../packages/core/src/api/module/api-module.ts) — точка расширения (`jobs`).
- [fill.story.ts](../../apps/u7-bot/src/controllers/questionnaire/fill.story.ts) — подписки и рендер.
- [entity.ts](../../packages/questionnaire/src/domain/questionnaire/entity.ts) — схема анкеты (`warnedAt`).
- [abandon-wish-er.ts](../../packages/wish/src/api/er/abandon-wish-er.ts) — автозакрытие желания (уже готово).
- [Рабочий процесс](../../workflow.md) — жизненный цикл задач.
