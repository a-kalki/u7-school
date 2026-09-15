# Система задач — Сценарии и решения проработки (сессия по слоям)

> v1 (2026-09-04). Проработка перед запуском треков этапа B: вертикальные
> сценарии «от лица пользователя», решения по местам логики, manual-задачи.
> Бизнес-концепция — [tasks-system.md](./tasks-system.md), архитектура слоёв —
> [tasks-system-architecture.md](./tasks-system-architecture.md). Сценарии
> заземлены в живой код: `InactivitySweepJob`, `StudentAr`, `MarkAbandonedUc`,
> `InactivityStory`, `NotifyStory`, `UiApp.handleCallback`.

---

## Решения сессии (сводка)

1. **Рождение системной задачи — ER, не job.** `InactivitySweepJob` не меняется
   вообще: он публикует `student.inactivity-remove-candidate` как сегодня.
   Новый ER stream-модуля слушает событие и делает `taskFacade.upsert`.
   Job — детектор факта, ER — side-effect «создать задачу» (ER-паттерн).
2. **Персистится только стабильное.** kind, dedupeKey, ownerInfo — в задаче.
   Имя студента и число дней НЕ в задаче: `resolveRenderInfo` вычисляет их
   на лету (из `ownerInfo.studentId` → агрегат), тексты всегда свежие.
3. **dedupeKey вычислимый** (`stream.inactivity-candidate:<studentId>`), upsert
   по нему = обновление (повтор sweep 7→9 дней — та же задача). Close
   идемпотентен: задача есть — закрыта, нет — no-op. UC владельца не знает,
   откуда вызов (задача, мониторинг, CLI).
4. **Память об отказе — только в ER владельца на `task.skipped`** (единая
   точка): закрыться со skip могут три пути — кнопка владельца, стандартный
   [Пропустить], авто-истечение окна. Если память пишет только UC кнопки —
   два остальных пути остаются без памяти.
5. **Расширения `StudentAr`:** `acknowledge()` — сброс notices без смены
   статуса («Продолжить» = осознанный сигнал, сброс каскада; без него sweep
   через 2 дня создаст задачу ментору); `markKept()` — запись
   `{ kind: 'inactivity_mentor_kept', sentAt }` в notices (сбрасывается
   теми же путями: `activate`/`completeStep` — «новый повод»). Guard в
   sweep: `getLastNotice('inactivity_mentor_kept')` есть → пропуск.
6. **Manual-задачи — в том же модуле** (`origin: 'system' | 'manual'`),
   см. раздел ниже. Разделение при росте — не второй модуль задач, а новый
   домен-владелец kind.

---

## Сценарий 1. Ментор: «Снять с учёбы» — полный цикл

```
InactivitySweepJob (stream, без изменений)
  │ событие student.inactivity-remove-candidate
  ▼
InactivityCandidateTaskEr [новый, stream api/er]        ← рождение
  │ taskFacade.upsert({ kind: 'stream.inactivity-candidate',
  │   assigneeId: mentorUserId, dedupeKey, title: 'Кандидат на снятие с учёбы',
  │   ownerInfo: { studentId, userId, streamId }, mandatory: true })
  ▼
task-модуль → userFacade.notify(ментор, '🛑 Есть дело — /tasks')
  → user.notified → NotifyStory → текст без кнопок

Ментор: /tasks → GetMyTasksUc + TaskTypeMeta(stream) [регистрация в api/module.ts]
  │ resolveRenderInfo: Student+User+Stream по ownerInfo → дни из lastActivityAt
  ▼ TaskRenderInfo { actions: [ {id:'mark-abandoned', danger, confirm},
  │                            {id:'keep-student'} ] }
Ментор: [Снять] → kind-рендерер streams → cbFor('streams','inactivity-abandon',taskId)
  → UiApp (штатная маршрутизация) → сторя → confirm с именем → [Да, снять]
  ▼
MarkAbandonedUc (существует)
  │ StudentAr.markAbandoned('inactivity')          ← АГРЕГАТ: active → abandoned
  │ save → событие student.abandoned → кик из TG-группы, notify студенту
  │ + taskFacade.close(dedupeKey, 'completed')     ← добавление в UC
  ▼ task.completed → задача исчезла из списка
```

**Вариация 1б (студент, [Продолжить]):** задача `stream.inactivity-warning`,
кнопка → `AckInactivityUc` → `StudentAr.acknowledge()` — notices = [],
статус не меняется → close. «Покинуть учёбу» — существующий `drop()` + close,
симметрично.

## Сценарий 2. Ментор: «Оставить» — отказ с памятью

```
Ментор: [Оставить] → сторя → appApi.execute('keep-student', {…})
KeepStudentUc [новый, тонкий: права + close]
  │ taskFacade.close(dedupeKey, 'skipped')
  ▼ событие task.skipped { kind, ownerInfo }
InactivityKeptEr [новый, stream api/er]                  ← память
  │ грузит Student по ownerInfo.studentId
  ▼ StudentAr.markKept()  ← АГРЕГАТ: notices += {kind:'inactivity_mentor_kept'}
Guard в InactivitySweepJob: есть kept-маркер → кандидат-ветка пропускается
  до «нового повода» (notices сброшены возобновлением учёбы)
```

**Вариация 2б (стандартный [Пропустить], анкета):** UC skip task-модуля →
`task.skipped` → ER questionnaire → `QuestionnaireAr`: invite → declined
(агрегат владельца меняется тем же событием, ноль кода в task-модуле).

---

## Manual-задачи («лицом к лицу»)

Ручная задача ментора («проведи сессию ПП со студентом A») = тип «внешнее
действие» из архитектуры + `authorId`. Выполняется человеком вне системы,
`[Выполнено]` — легальный финал (меты/actions нет → стандартные кнопки).

| Аспект | system | manual |
|---|---|---|
| рождение | job/ER → upsert по dedupeKey | человек → `CreateManualTaskUc` |
| тексты | домен, рендер на лету | автора, персистится |
| dedupeKey | вычислимый | nullable, upsert запрещён |
| кнопки | actions из меты | [Выполнено]/[Отказаться] стандартные |
| закрытие | UC домена + close | assignee: done / skip; author: cancel |
| отказ | ER владельца (память) | notify автору (task-модуль) |
| отмена автором | невозможна | `task.cancelled` → notify исполнителю |

Права: skip/done — assignee; cancel — author (только manual); close — фасад
домена с валидацией assignee. Единый список `/tasks` — продуктовое ядро,
поэтому НЕ два модуля: механика (статусы, окна, напоминания, notify) общая,
различия поведенческие и покрыты правилами стандартного контракта.

### Фиксация результата manual-задачи (спектр уровней)

Пример: «проведи сессию ПП, по окончании вручную заведи анкету ПП» — задача
даёт видимость, анкета фиксирует метрики. Разрыв «Выполнено ≠ анкета создана»
держит человек; потеря молчаливая — осознанный trade-off.

1. **Развязано** (старт): текст инструкции + ручная анкета. Цена 0.
2. **Связка через ownerInfo**: анкете передаём `{ taskId, studentId }` —
   механизм уже есть; потеря видима в отчётах. Цена ~0.
3. **UI-склейка**: после [Выполнено] кнопка «Завести анкету» → делегирование
   в questionnaire-контроллер (предзаполнение + ownerInfo). Story-уровень.
4. **Домен `session`**: kind-задача, close только по факту
   `questionnaire.completed` (ER). Инвариант держит система.

**Критерий перехода на 4:** финал задачи по смыслу — не «провёл», а «создан
артефакт-оценка», и наличие оценки становится входом в решения (движение по
потоку, дашборды). Тогда появляется домен-владелец kind — как questionnaire
и peer-review. Task-модуль не меняется.

---

## По слоям: новые/изменяемые артефакты

| Слой | Артефакт | Роль |
|---|---|---|
| домен task | `Task` (+origin, authorId, nullable dedupeKey), `TaskAr`, события `task.completed/skipped/cancelled`, `facade.ts` (upsert/close/getMyTasks) | механика задач |
| домен stream | `StudentAr.acknowledge()`, `StudentAr.markKept()` | изменения агрегата по кнопкам задач |
| api stream | `er/inactivity-candidate-task-er.ts`, `er/inactivity-kept-er.ts` | рождение задачи; память отказа |
| api stream | `api/module.ts` — регистрация `TaskTypeMeta` | контракт [Снять]/[Оставить] |
| api stream | `mark-abandoned-uc` (+close), `keep-student-uc`, `ack-inactivity-uc` | действия владельца |
| api stream | `inactivity-sweep-job` (+guard по kept-маркеру) | детектор фактов |
| api task | `get-my-tasks-uc`, `skip-uc`, `done-uc`, `create-manual-task-uc`, `cancel-task-uc`, реестр TaskTypeMeta | список, стандартные и manual-действия |
| ui bot | контроллер tasks (`/tasks`, меню, дефолт-рендерер, реестр kind-рендереров) | список задач |
| ui bot | kind-рендерер streams, сторя inactivity (умирают проактив-подписки с кнопками, остаются confirm + кик по `student.abandoned`) | доменные кнопки |

Вертикальные срезы: см. трассировки сценариев выше. Направления зависимостей:
`stream → task → user`; UI знает всех; никто не знает UI.

## Открытые технические вопросы (с рекомендациями)

1. Close из UC stream (`taskFacade.close(dedupeKey)`) vs close task-модулем по
   событию `student.abandoned`. Рекомендация: первый (проще, уже в доке);
   второй хрупок («догадайся, какую задачу закрыть»).
2. Валидация assignee в `taskFacade.close` (защита от закрытия чужой задачи
   прямым вызовом UC). Рекомендация: да.
3. Окно жизни задачи-кандидата: до конца бездействия или N дней? Влияет на
   сущность и трек reminders.
4. Дайджест: N задач одним sweep → одна склейка «Появилось N дел»? Точка
   склейки — task-модуль, но усложняет ER-поток рождения.

## Влияние на трек 1 (`task-module`)

Заложить сразу (иначе миграция хранилища): поля `origin`, `authorId?`,
nullable `dedupeKey`; события `task.cancelled`; UC create-manual/cancel;
notify автору при skip manual-задачи; сортировка — крючок для «manual с
дедлайном выше». UI создания manual-задач — отдельным треком после `task-ui`.

## Связанные документы

- [tasks-system.md](./tasks-system.md) — бизнес-концепция.
- [tasks-system-architecture.md](./tasks-system-architecture.md) — четыре слоя, декомпозиция на треки.
- [tasks-system-layers.md](./tasks-system-layers.md) — технические решения по слоям: метатипы, рендереры, пути завершения.
- [event-reaction.md](../code_styleguides/skills/event-reaction.md) — ER-паттерн (память об отказе).
- [domain-boundaries.md](../code_styleguides/domain-boundaries.md) — правила границ.
