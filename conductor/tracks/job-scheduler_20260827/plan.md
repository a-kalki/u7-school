# План реализации — Трек: Job + брошенные анкеты

## Фаза 1: Job в core + JobScheduler в приложении

- [ ] Task: Написать падающие тесты на `Job` (контракт, регистрация в ApiModule, проброс резолвера)
- [ ] Task: Реализовать `Job` в core/api + поле `jobs` в ApiModule
- [ ] Task: Написать падающие тесты на JobScheduler (сбор jobs, интервалы, устойчивость к ошибкам, stop)
- [ ] Task: Реализовать `job-scheduler.ts` в apps/u7-bot + запуск в `main.ts`
- [ ] Task: Conductor - Ручная верификация 'Job + планировщик'

## Фаза 2: warnedAt + sweep-job в questionnaire

- [ ] Task: Написать падающие тесты на `warnedAt` (markWarned, сброс при активности) и `repo.getActive()`
- [ ] Task: Добавить `warnedAt` в схему/состояние анкеты + доменные методы
- [ ] Task: Написать падающие тесты на sweep-job (6ч → warning + warnedAt; 8ч → abandon с reason timeout; идемпотентность; только kind standard)
- [ ] Task: Реализовать `SweepAbandonedJob` + событие `questionnaire:warning` + `reason` в abandon + регистрация в модуле
- [ ] Task: Conductor - Ручная верификация 'Sweep-job'

## Фаза 3: UI предупреждения в FillStory

- [ ] Task: Написать падающие тесты на подписку `questionnaire:warning` (рендер + кнопки) и сообщение таймаут-abandon (без дубля при /cancel)
- [ ] Task: Реализовать подписки + рендер + ProactiveSender в FillStory
- [ ] Task: Conductor - Ручная верификация 'UI предупреждения'

## Фаза 4: Документация

- [ ] Task: Добавить Job в таблицу arch-boundary-design + styleguide `skills/job.md` (по аналогии с usecase.md)
- [ ] Task: Обновить `conductor/index.md` и questionnaire ui-spec (если экраны менялись)
- [ ] Task: Conductor - Ручная верификация 'Документация'
