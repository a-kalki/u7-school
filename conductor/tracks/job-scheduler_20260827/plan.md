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

## Фаза 3: UI предупреждения в FillStory

- [ ] Task: Написать падающие тесты на подписку `questionnaire:warning` (рендер + кнопки) и сообщение таймаут-abandon (без дубля при /cancel)
- [ ] Task: Реализовать подписки + рендер + ProactiveSender в FillStory
- [ ] Task: Conductor - Ручная верификация 'UI предупреждения'

## Фаза 4: Документация

- [ ] Task: Добавить Job в таблицу arch-boundary-design + styleguide `skills/job.md` (по аналогии с usecase.md)
- [ ] Task: Обновить `conductor/index.md` и questionnaire ui-spec (если экраны менялись)
- [ ] Task: Conductor - Ручная верификация 'Документация'
