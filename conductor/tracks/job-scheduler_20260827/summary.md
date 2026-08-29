# Summary: Job — планировщик периодических заданий + брошенные анкеты

Трек реализован полностью, 9 фаз. Подход: TDD (падающие тесты → реализация), контрольная точка после каждой фазы.

> После первых 4 фаз трек был дважды расширен: фазы 5–7 — редизайн v2 (объектная модель планировщика в core, жизненный цикл приложения), фазы 8–9 — уточнение контрактов предупреждения о закрытии.

---

## Фаза 1 — Job в core + JobScheduler в приложении

**Коммиты:** `f920555` (Job в core), `e421732` (JobScheduler + main.ts), checkpoint `ac8616f`.

**Что сделано:**
- В `@u7-scl/core/api` появилась третья категория участников модуля — **Job** (периодическое задание), рядом с UseCase и EventReaction. Контракт: `jobName`, `jobLabel`, `intervalMs`, `init(resolve)`, `execute()`.
- `ApiModule` получил поле `jobs: Job[]` (по умолчанию пустое) и пробрасывает резолвер каждому job'у в `init()` — так же, как UC и ER.
- В приложении — планировщик `startJobScheduler(modules, logger): StopFn`: setInterval по `intervalMs` каждого job'а; ошибка прогона ловится и логируется (`logger.warn`), процесс не падает; `stop()` снимает таймеры.
- `ApiAppBundle.allModules` — полный список модулей, включая standalone `questionnaire` (он не входит в `ApiApp`), чтобы планировщик видел его job'ы.

**Файлы:**

| Действие | Файл |
|---|---|
| создан | `packages/core/src/api/job/job.ts` |
| создан | `packages/core/src/api/job/job.test.ts` (6 тестов) |
| изменён | `packages/core/src/api/module/api-module.ts` — поле `jobs` + проброс резолвера |
| изменён | `packages/core/src/api/index.ts` — экспорт `Job` |
| создан | `apps/u7-bot/src/infra/job-scheduler.ts` |
| создан | `apps/u7-bot/src/infra/job-scheduler.test.ts` (4 теста) |
| изменён | `apps/u7-bot/src/create-api-app.ts` — `allModules` в бандле |
| изменён | `apps/u7-bot/src/main.ts` — запуск планировщика |

**На что посмотреть глазами:**
- **Graceful shutdown отсутствует.** `startJobScheduler(...)` в `main.ts` вызывается, но возвращённая stop-функция отброшена: таймеры живут до завершения процесса. Когда в приложении появится управляемое завершение — сохранить `StopFn` и вызвать его.
- **Первый прогон — после интервала.** Job с интервалом в час впервые отработает через час после старта. Если понадобится прогон «при старте» — это отдельное решение (не делалось осознанно: прогон сразу после деплоя может быть нежелателен).
- **Job'ы standalone-модулей** работают только потому, что `allModules` собирается вручную. Новый standalone-модуль с job'ами нужно не забыть добавить в `create-api-app.ts`.

---

## Фаза 2 — warnedAt + sweep-job в questionnaire

**Коммиты:** `7a40b51` (warnedAt + getActive), `16d6dbf` (SweepAbandonedJob), checkpoint `d3c8710`.

**Что сделано:**
- В состояние анкеты добавлен флаг `warnedAt` (optional, isoDateTime) — «когда отправлено предупреждение о закрытии». Автоматически появился и у likert-анкет (схема наследует через spread `entries`).
- `BaseQuestionnaireAr.markWarned()` — публичный метод для планировщика. Ключевой нюанс: он **обходит `safeUpdate`**, чтобы не сдвигать `updatedAt` — иначе предупреждение сбрасывало бы таймер простоя и анкета никогда не закрылась бы.
- Сброс `warnedAt` при активности респондента: в `start()` и `handleAction()`.
- `abandon(reason?: 'timeout')` — причина пробрасывается в `QuestionnaireAbandonEvent.payload.reason`.
- `QuestionnaireRepo.getActive()` — только `status === 'in_progress'` (реализация в `QuestionnaireJsonRepo`).
- **`SweepAbandonedJob`** (`questionnaire:warning`-механика): пороги `WARN_AFTER_IDLE_MS = 6ч`, `ABANDON_AFTER_IDLE_MS = 8ч` (экспортированы), простой от `updatedAt ?? createdAt`, только `kind: 'standard'`:
  - 6–8ч без предупреждения → `markWarned()` + save + публикация `QuestionnaireWarningEvent` (новое событие; `telegramId` обогащается через user-фасад);
  - ≥8ч → `abandon('timeout')` + save + `flushEvents()` + обогащение `telegramId` + публикация;
  - ошибка одной анкеты не прерывает обход (try/catch на запись + `logger.warn`);
  - job зарегистрирован в `QuestionnaireApiModule.jobs` — запускается планировщиком автоматически.

**Файлы:**

| Действие | Файл |
|---|---|
| изменён | `packages/questionnaire/src/domain/questionnaire/entity.ts` — `warnedAt` в схеме и `BaseQuestionnaireState` |
| изменён | `packages/questionnaire/src/domain/questionnaire/a-root.ts` — `markWarned()`, `#resetWarning()`, `abandon(reason?)`, сброс при активности |
| изменён | `packages/questionnaire/src/domain/questionnaire/events.ts` — `reason`/`telegramId` в abandon-событии, новый `QuestionnaireWarningEvent` |
| изменён | `packages/questionnaire/src/domain/questionnaire/repo.ts` — контракт `getActive()` |
| изменён | `packages/questionnaire/src/infra/db/questionnaire-json-repo.ts` — реализация `getActive()` |
| изменён | `packages/questionnaire/src/domain/questionnaire/standard/questionnaire-ar.ts` — `buildAbandonedEvent(reason?)` |
| создан | `packages/questionnaire/src/api/questionnaire/sweep-abandoned-job.ts` |
| создан | `packages/questionnaire/src/api/questionnaire/sweep-abandoned-job.test.ts` (9 тестов) |
| создан | `packages/questionnaire/src/domain/questionnaire/warned-at.test.ts` (4 теста) |
| создан | `packages/questionnaire/src/infra/db/questionnaire-repo-active.test.ts` (3 теста) |
| изменён | `packages/questionnaire/src/api/module.ts` — регистрация job'а |
| изменён | `packages/questionnaire/src/api/index.ts` — экспорт job'а |
| изменён | `packages/questionnaire/src/api/module.test.ts` — в мок repo добавлен `getActive` (см. «На что посмотреть») |

**На что посмотреть глазами:**
- **Два исключения из правила «не трогать существующие тесты»**, оба неизбежные (расширялся контракт):
  1. `module.test.ts` — в мок репозитория добавлен метод `getActive` (иначе пакет не компилируется);
  2. в `fill.story.test.ts` (Фаза 3) обновлено ожидание числа подписок (2 → 4).
  Проверки не ослаблялись — только минимальная адаптация моков/ожиданий.
- **`getActive()` в JSON-репозитории — O(n) по всем анкетам.** Для текущих объёмов нормально; при росте хранилища подумать про индекс по статусу или отдельную коллекцию активных.
- **Пороги 6ч/8ч захардкожены** в `sweep-abandoned-job.ts` (экспортированные константы). Если понадобится настройка по окружению — вынести в конфиг.
- **`warnedAt` не чистится при завершении** (`completed`/`abandoned`) — флаг остаётся в истории. Не мешает: job смотрит только на `in_progress`, но если когда-нибудь появится аналитика по полю — иметь в виду.
- **Один warn без повторов:** если пользователь не найден фасадом (удалён), предупреждение не публикуется, но `warnedAt` уже сохранён — повторной попытки не будет (до закрытия по 8ч). Осознанный компромисс.

---

## Фаза 3 — UI предупреждения в FillStory

**Коммит:** `e1e2e51`, checkpoint `0f26df7`.

**Что сделано:**
- Подписка `questionnaire:warning` → `proactiveSender.send`: текст «⏳ Анкета приостановлена… Продолжить?» + кнопки:
  - «▶️ Продолжить» → `Routes.questionnaire.resume(courseId)` — только если в `ownerInfo` есть `courseId` (привязка к курсу);
  - «⏭️ Прервать» → `fill:cancel-confirm:{qId}` (существующее подтверждение отмены).
- Подписка `questionnaire:abandon` → `proactiveSender.notify` (без кнопок) **только** при `reason === 'timeout'` и наличии `telegramId`. Ручное прерывание (/cancel) дубликата не создаёт: у события нет reason, а ответ UC пользователь уже получил.

**Файлы:**

| Действие | Файл |
|---|---|
| изменён | `apps/u7-bot/src/controllers/questionnaire/fill.story.ts` — подписки + `#handleWarningEvent` + `#handleAbandonEvent` |
| создан | `apps/u7-bot/src/controllers/questionnaire/fill.story.warning.test.ts` (6 тестов) |
| изменён | `apps/u7-bot/src/controllers/questionnaire/fill.story.test.ts` — ожидание подписок 2 → 4 |

**На что посмотреть глазами:**
- **Кнопка «Прервать» в проактивном сообщении работает без сессии** — код `cancel-confirm` несёт `qId`. Но если сессия пользователя в этот момент захвачена другим обработчиком, confirm-экран откроется поверх — поведение стандартное для проактивных сообщений, но стоит проверить руками в боте.
- ** likert-анкеты не предупреждаются** — sweep-job обрабатывает только `kind: 'standard'`. Если likert-анкеты тоже могут «висеть» — это отдельная задача (не входила в скоуп трека).
- **Текст сообщения не берётся из пула** (`cancelWarning`-подобных полей нет) — захардкожен в story. Если понадобится кастомизация на анкету — добавить поле в `questionPool`.

---

## Фаза 4 — Документация

**Что сделано:**
- Создан styleguide **`skills/job.md`** (по образцу `usecase.md`): правила, поля, публикация событий, регистрация, тестирование, живые примеры.
- В **arch-boundary-design** добавлена строка в таблицу принятия решений: «Job (периодическое задание) → `api/<entity>/<name>-job.ts` → skills/job.md».
- **`conductor/index.md`** — добавлена ссылка на styleguide Job.
- **`ui-spec.md` questionnaire** — добавлены экраны S07 (предупреждение ⏳, реализовано) и S08 (закрыто по таймауту ⏱, реализовано), обновлена таблица обработчиков стори fill.

**Файлы:**

| Действие | Файл |
|---|---|
| создан | `conductor/code_styleguides/skills/job.md` |
| изменён | `.pi/skills/arch-boundary-design/SKILL.md` — строка Job в таблице |
| изменён | `conductor/index.md` — ссылка на styleguide |
| изменён | `apps/u7-bot/src/controllers/questionnaire/ui-spec.md` — S07, S08, таблица обработчиков |

---

## Фаза 5 — Редизайн v2: контракты и объектная модель планировщика в core

**Коммиты:** `2fb09e` (Job v2), `3d1041` (порты), `81ff805` (core/infra), `cff82f9` (ApiApp), checkpoint `809ef6e` (общий с фазой 6).

**Что сделано:**
- Контракт **Job v2**: `JobSchedule` (kind + интервал/выражение), `JobMeta`, декларативная публикация событий через `publishEvents`; `ApiModule.jobs` стал abstract-полем — модуль обязан явно объявить свои job’ы (по умолчанию `jobs = []`).
- Порты **`JobScheduler`/`JobExecutor`** в `core/api/job` — планирование отделено от приложения (Liskov-совместимо с будущим внешним воркером).
- `core/infra`: `JobSchedulePlanner` (расчёт следующего прогона: все kind, UTC, кламп, alignUtc-сетка), `ScheduledJobRunner` (misfire, runAtStart, стартовая задержка, lastRunAt), `InProcJobScheduler`/`InProcJobExecutor`, `JobRunStore` (+ Json/Memory).
- `ApiApp.start()/stop()`: DI планировщика в конструктор, запуск job’ов всех модулей.

## Фаза 6 — Редизайн v2: модули и жизненный цикл приложения

**Коммиты:** `16fab3e` (жизненный цикл, BREAKING), `60b4f0f`, `1538435`, `5f8c447` (попутные исправления), checkpoint `809ef6e`.

**Что сделано:**
- `questionnaire` → обычный модуль: убран self-init из конструктора, мета зарегистрирована в `U7BotAppMeta`, `allModules` из бандла удалён.
- `SweepAbandonedJob` мигрирован на `schedule` + `publishEvents` (декларативная публикация вместо ручного flush).
- `UiApp.start()/stop()` в core/ui.
- `main.ts`: `apiApp.start()` вместо ручного планировщика; **graceful shutdown** (SIGINT/SIGTERM) — старый `apps/u7-bot/src/infra/job-scheduler.ts` удалён (техдолг фазы 1 закрыт).

## Фаза 7 — Ревизия v2: документация

**Коммиты:** `64cc198` (styleguide), `bfda592` (техдолг в TODO.md).

**Что сделано:**
- `skills/job.md` переписан под v2: JobSchedule, publishEvents, abstract jobs, объектная модель, misfire/alignUtc.
- Техдолг зафиксирован в TODO.md: JobExecutor → внешний воркер (предусловие — внешнее хранилище); симметричный жизненный цикл init/start/stop по слоям — кандидат в отдельный трек.

## Фаза 8 — Уточнение контрактов предупреждения о закрытии

**Коммиты:** `caa65ad` (переименование события, BREAKING), `db946968` (reason + getIdle), `115c45e` (техдолг таймзон).

**Что сделано:**
- Событие `questionnaire:warning` → **`questionnaire:abandon-warning`** (+ тип `QuestionnaireAbandonWarningEvent`) — по всему стеку (events, job, FillStory, тесты, ui-spec).
- Доменный тип **`AbandonReason`** (`'timeout' | 'by_user'`): `abandon(reason?)` персистирует причину в состоянии (`abandonReason` в схеме) и в payload события `questionnaire:abandon`; `AbandonUc` передаёт `'by_user'`.
- Репозиторий: явный метод **`getIdle(params)`** — все фильтры (порог простоя от `updatedAt ?? createdAt`, kinds, статусы по умолчанию `invited+in_progress`) в запросе; json-impl + тесты; `SweepAbandonedJob` переведён с `getActive()` на `getIdle()`.
- Техдолг таймзон (`Date.parse` дат `isoNow()` без маркера зоны) зафиксирован в TODO.md — прод в UTC, проявляется только при переезде окружения.

## Фаза 9 — Обязательный reason прерывания

**Коммит:** `271e037` (BREAKING), checkpoint `c70e26a`.

**Что сделано:**
- `abandon(reason: AbandonReason)` — причина **обязательна**: параметр обязателен на уровне типов + рантайм-валидация через `AbandonReasonSchema` (без валидного reason прерывание невозможно, состояние не меняется).
- **Инвариант агрегата**: статус `abandoned` ⇒ `abandonReason` заполнен — проверяется в `checkInvariant()` (конструирование/restore и каждое обновление состояния).
- `decline()` проставляет `'by_user'` — отказ от приглашения тоже ручное действие, инвариант соблюдается для всех abandoned-анкет.
- Обратная совместимость со старыми abandoned-записями без reason не сохранялась (новый агрегат, ломать данные безопасно — решение зафиксировано в плане).

---

## Итоговые метрики

- **Новых тестов: 28** в фазах 1–4; в фазах 5–9 добавлены тесты объектной модели планировщика (planner/runner/job-run-store), жизненного цикла UiApp, getIdle и обязательного reason (в т.ч. инвариант restore).
- Полный прогон на момент завершения: `bun run lint` ✅, `bun run tslint` ✅, `bun test` ✅ **1761 pass / 0 fail** (188 файлов, 3779 expect).
- TDD соблюдён: в фазах 8–9 сначала падающие тесты (Red), затем реализация (Green).
- Ни один существующий тест не был удалён; существующие вызовы `abandon()` обновлены на явные reason (разрешено задачей фазы 9, зафиксировано в git notes).
- Ручная верификация фаз 1–8 подтверждена пользователем по ходу трека; фаза 9 — подтверждена командой на завершение трека (полный автопрогон зелёный).
- Обратные совместимости сознательно ломались дважды (фаза 6 — жизненный цикл; фаза 9 — abandon), обе помечены `!` в сообщениях коммитов.

## Технический долг / идеи на будущее

1. ~~Graceful shutdown: сохранить и вызывать `StopFn` планировщика~~ — **закрыто в фазе 6** (SIGINT/SIGTERM в main.ts).
2. Настройка порогов 6ч/8ч через конфиг окружения (константы в `sweep-abandoned-job.ts`).
3. Предупреждения для likert-анкет (sweep вызывает `getIdle` с `kinds: ['standard']`).
4. Индекс/коллекция активных анкет в JSON-репо при росте данных (`getIdle` фильтрует в запросе, но читает весь файл).
5. Кастомные тексты предупреждений через `questionPool`.
6. Таймзоны в расчёте простоя (`Date.parse` дат `isoNow()` без маркера зоны) — в TODO.md, раздел «Планировщик Job».
7. JobExecutor → внешний воркер (предусловие — внешнее хранилище) — в TODO.md.
8. Симметричный жизненный цикл init/start/stop по слоям — кандидат в отдельный трек (TODO.md).
