# План реализации — Трек: Job + брошенные анкеты

## Фаза 1: Job в core + JobScheduler в приложении [checkpoint: ac8616f]

- [x] Task: Написать падающие тесты на `Job` (контракт, регистрация в ApiModule, проброс резолвера) [f920555]
- [x] Task: Реализовать `Job` в core/api + поле `jobs` в ApiModule [f920555]
- [x] Task: Написать падающие тесты на JobScheduler (сбор jobs, интервалы, устойчивость к ошибкам, stop) [e421732]
- [x] Task: Реализовать `job-scheduler.ts` в apps/u7-bot + запуск в `main.ts` [e421732]
- [x] Task: Conductor - Ручная верификация 'Job + планировщик'

## Фаза 2: warnedAt + sweep-job в questionnaire [checkpoint: d3c8710]

- [x] Task: Написать падающие тесты на `warnedAt` (markWarned, сброс при активности) и `repo.getActive()` [7a40b51]
- [x] Task: Добавить `warnedAt` в схему/состояние анкеты + доменные методы [7a40b51]
- [x] Task: Написать падающие тесты на sweep-job (6ч → warning + warnedAt; 8ч → abandon с reason timeout; идемпотентность; только kind standard) [16d6dbf]
- [x] Task: Реализовать `SweepAbandonedJob` + событие `questionnaire:warning` + `reason` в abandon + регистрация в модуле [16d6dbf]
- [x] Task: Conductor - Ручная верификация 'Sweep-job'

## Фаза 3: UI предупреждения в FillStory [checkpoint: 0f26df7]

- [x] Task: Написать падающие тесты на подписку `questionnaire:warning` (рендер + кнопки) и сообщение таймаут-abandon (без дубля при /cancel) [e1e2e51]
- [x] Task: Реализовать подписки + рендер + ProactiveSender в FillStory [e1e2e51]
- [x] Task: Conductor - Ручная верификация 'UI предупреждения'

## Фаза 4: Документация [checkpoint: 15c6f59]

- [x] Task: Добавить Job в таблицу arch-boundary-design + styleguide `skills/job.md` (по аналогии с usecase.md) [15c6f59]
- [x] Task: Обновить `conductor/index.md` и questionnaire ui-spec (если экраны менялись) [15c6f59]
- [x] Task: Conductor - Ручная верификация 'Документация'

## Фаза 5: Редизайн v2 — контракты и объектная модель планировщика в core [checkpoint: 809ef6ee]

- [x] Task: Написать падающие тесты: `Job` v2 (JobSchedule/JobMeta/publishEvents), abstract `ApiModule.jobs` [2fb09e]
- [x] Task: Реализовать `Job` v2 + abstract `jobs` + порт `JobScheduler`/`JobExecutor` в core/api [3d10410]
- [x] Task: Написать падающие тесты: `JobSchedulePlanner` (все kind, UTC, кламп, alignUtc-сетка), `ScheduledJobRunner` (misfire, runAtStart, стартовая задержка, lastRunAt) [f63a25]
- [x] Task: Реализовать `core/infra`: `JobSchedulePlanner`, `ScheduledJobRunner`, `InProcJobScheduler`, `InProcJobExecutor`, `JobRunStore` + `JsonJobRunStore`/`MemoryJobRunStore` [f63a25]
- [x] Task: Написать падающие тесты: `ApiApp.start()/stop()` (DI-планировщик, job'ы всех модулей) [cff82f9a]
- [x] Task: Реализовать `ApiApp.start()/stop()` + DI планировщика в конструктор [cff82f9a]
- [x] Task: Conductor - Ручная верификация 'Планировщик v2 в core'

## Фаза 6: Редизайн v2 — модули и жизненный цикл приложения [checkpoint: 809ef6ee]

- [x] Task: Questionnaire → обычный модуль: убрать self-init из конструктора, мета в `U7BotAppMeta`, убрать `allModules` из bundle [16fab3e]
- [x] Task: Явные `jobs = []` в user/wish/stream/course (фаза 5); миграция `SweepAbandonedJob` на `schedule` + `publishEvents` [16fab3e]
- [x] Task: Написать падающие тесты: `UiApp.start()/stop()` [16fab3e]
- [x] Task: Реализовать `UiApp.start()/stop()` в core/ui [16fab3e]
- [x] Task: Переписать main.ts: `uiApp.start()` → `apiApp.start()`, graceful shutdown (SIGINT/SIGTERM), удалить старый `apps/u7-bot/src/infra/job-scheduler.ts` [16fab3e]
- [x] Task: Conductor - Ручная верификация 'Жизненный цикл и graceful shutdown'

## Фаза 8: Уточнение контрактов предупреждения о закрытии

- [ ] Task: Переименовать событие `questionnaire:warning` → `questionnaire:abandon-warning` (+ тип `QuestionnaireAbandonWarningEvent`): events.ts, SweepAbandonedJob, FillStory, тесты, spec.md

## Фаза 7: Ревизия v2 — документация

- [x] Task: Обновить styleguide `skills/job.md` (JobSchedule, publishEvents, abstract jobs, объектная модель, misfire/alignUtc) [64cc198a]
- [x] Task: Зафиксировать техдолг: JobExecutor → воркер (предусловие — внешнее хранилище); симметричный жизненный цикл init/start/stop по слоям — кандидат в отдельный трек [bfda592c]
- [ ] Task: Conductor - Ручная верификация 'Документация v2'
