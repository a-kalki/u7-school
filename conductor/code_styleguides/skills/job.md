# Периодическое задание (Job) — Styleguide

**Назначение:** файл `api/<entity>/<name>-job.ts` — класс Job, доменная логика, выполняемая планировщиком приложения по расписанию, а не по действию пользователя. Наследуется от `Job<Meta, Resolver>`. Аналог UseCase для фоновых операций: один job — одна фоновая операция.

Контракт: `packages/core/src/api/job/job.ts`. Живой пример: `packages/questionnaire/src/api/questionnaire/sweep-abandoned-job.ts`.

---

## 1. Ключевые правила

1. **Логика job — доменная:** работа с агрегатами, репозиториями и событиями. Никакой UI-логики: уведомления — только через публикацию доменных событий (UI рендерит их в Story-подписках).
2. **Один прогон = `execute()`.** Ошибка прогона перехватывается планировщиком (`ScheduledJobRunner`) и логируется — процесс не падает, остальные job'ы продолжают работать.
3. **Идемпотентность:** повторный прогон не должен дублировать эффекты (флаги состояния — например, `warnedAt` — или проверка статуса).
4. **Пороги и константы** — экспортируйте из файла job'а: тесты и运维 ссылаются на них.
5. **Ошибка одной записи не ломает обход** — try/catch вокруг каждой сущности с `logger.warn`.
6. Репозитории и фасады — через `this.resolve.<name>`; моки в тестах — `as unknown as <реальный тип>`, без `as any`.

## 2. Объектная модель

| Часть | Поля / члены | Комментарий |
|---|---|---|
| `Job<TMeta, TResolve>` | `jobName`, `jobLabel` | Типизируются `JobMeta` (аналог `UcMeta`) |
| | `schedule: JobSchedule` | Расписание — см. ниже |
| | `execute()` | Один прогон задания |
| | `publishEvents(ar)` | Публикация событий агрегата — как `UseCase.publishEvents` (ручной цикл с `eventBus.publish` не используется) |

### JobSchedule (все времена — UTC)

- `interval` — `intervalMs`; `alignUtc` выравнивает запуски по сетке от epoch (6ч + alignUtc → 00:00/06:00/12:00/18:00 UTC), `runAtStart` — прогон сразу при старте.
- `dailyAt` / `weeklyAt` / `monthlyAt` — календарные расписания; `monthlyAt` клампит несуществующий день (31 → последний день месяца).

Резолвер типизируется `<Entity>ApiModuleResolver` — те же зависимости, что у UC модуля; пробрасывается модулем в `init()`.

## 3. Планировщик: порты и реализации

Порты в core/api, реализации в core/infra — приложение не знает о механизме запуска:

- **`JobScheduler`** (`start(jobs)` / `stop()`) — порт управления. Реализация `InProcJobScheduler`: по раннеру на job, первый прогон через `startDelayMs` (по умолчанию 3 минуты).
- **`JobExecutor`** — порт «где выполнять прогон» (точка расширения под будущий воркер; контракт Job не меняется).
- **`JobRunRepo`** (`MemoryJobRunRepo` / `JobRunJsonRepo`) — персистентность `lastRunAt`: планировщик при старте видит последний прогон и **догоняет упущенный запуск** (misfire), интервальные — не раньше `intervalMs` от прошлого прогона.
- **`JobSchedulePlanner`** — чистая календарная математика («следующий запуск строго после»); отдельно тестируется на фиксированных датах.

## 4. Жизненный цикл приложения

Планировщик — техническая зависимость приложения, а не модуля:

```typescript
apiApp.init(new InProcJobScheduler({ logger, store: new JobRunJsonRepo(...) }));
uiApp.start();   // сначала подписки UI — события job'ов находят слушателей
apiApp.start();  // собирает jobs всех модулей и запускает
// SIGINT/SIGTERM: uiApp.stop(); apiApp.stop();
```

Сборка — в `apps/u7-bot/src/create-api-app.ts`, graceful shutdown — в `apps/u7-bot/src/main.ts`.

## 5. Регистрация

`ApiModule.jobs` — **abstract**: каждый модуль объявляет список явно, даже если он пуст (см. `stream`/`wish` модули):

```typescript
override readonly jobs = [new SweepAbandonedJob()];
```

## 6. Тестирование

- `execute()` — как обычный доменный метод: `job.init(mockResolve)` → `await job.execute()` → проверки на моках. Покрывать пороги и идемпотентность. Пример: `sweep-abandoned-job.test.ts`.
- Планировщик и календарная математика — в core/infra: `job-schedule-planner.test.ts` (все kind, UTC, кламп, alignUtc), `scheduled-job-runner.test.ts` (misfire, runAtStart, lastRunAt), `in-proc-job-scheduler.test.ts`, `api-app.test.ts` / `ui-app.test.ts` (start/stop).

## Регресс

**Недопустимо** ломать существующий функционал и тесты, не связанные с текущей задачей: меняй только то, что относится к задаче. Подробные правила — [testing.md, §«Защита от регресса и чистота правок»](../testing.md).

## Связанные файлы

- [UseCase](./usecase.md) — аналогичная абстракция для операций по запросу
- [EventReaction](./event-reaction.md) — реакция на доменное событие
- [Модуль](./module.md) — регистрация UC/ER/Job
