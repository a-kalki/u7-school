# Сводка по треку: Снятие с учёбы за бездействие, кик из группы, фильтр в карточке студентов

**Track ID:** `student-inactivity_20260830`
**Статус:** ✅ Завершён (checkpoint: `54f233c`)
**Верификация:** `bun run check` — **1872 pass / 0 fail** (biome + tsc --noEmit + bun test, 203 файла).

Трек реализован в режиме непрерывного выполнения (явная инструкция пользователя). Ручные верификации фаз заменены на автоматизированные (прогон всего тестового набора после каждой фазы); итоговая ручная проверка — через `/conductor:review`.

---

## Фаза 1 — Домен Student: статусы, маркер уведомлений, событие

**Что сделано:**
- `drop()` / `markAbandoned()` расширены: допустимы из статусов **active и enrolled** (самовыход и снятие ментором доступны записавшимся без шагов). Повторное действие из `abandoned` — ошибка (защита).
- Новый термин в сообщениях: **«Снять студента с учёбы»** (вместо «отчислить»).
- Маркер уведомлённости **`notices`**: типизированный массив записей `{ kind, sentAt }` с enum `StudentNoticeKind` (`inactivity_warn_student` | `inactivity_warn_mentor`). Поле optional — старые данные валидны.
- Методы `markNoticed(kind, at)` / `getLastNotice(kind)`; **сброс цепочки при возобновлении учёбы** (`activate()`, `completeStep()`).
- Событие **`student.abandoned`** (`StudentAbandonedEvent`): payload `studentId, userId, streamId, who, cause`. Публикуется при любом уходе (самовыход или решение ментора) — основа для кика из TG-группы.
- UC: `drop-student-uc` / `mark-abandoned-uc` теперь публикуют событие; `ucLabel` — «Покинуть учёбу» / «Снять студента с учёбы».

**Созданные файлы:** — (тесты дописаны в существующих).

**Изменённые файлы:**
- `packages/stream/src/domain/student/entity.ts` — `StudentNoticeKind`, `StudentNoticeRecord`, поле `notices`
- `packages/stream/src/domain/student/a-root.ts` — `drop`/`markAbandoned` (active+enrolled), `markNoticed`/`getLastNotice`, сброс в `activate`/`completeStep`
- `packages/stream/src/domain/student/events.ts` — `StudentAbandonedEvent`
- `packages/stream/src/domain/student/a-root.test.ts` — тесты (старые «enrolled → ошибка» заменены: контракт менялся задачей трека)
- `packages/stream/src/api/student/drop-student-uc.ts` (+test), `mark-abandoned-uc.ts` (+test), `complete-student-uc.test.ts` (событие при outcome=abandoned)

**На что посмотреть:** валидация дат — проект хранит `YYYY-MM-DDTHH:mm` (valibot `isoDateTime` в текущей версии не принимает мс/Z; единый формат `isoNow().slice(0,16)`).

---

## Фаза 2 — Job мониторинга бездействия

**Что сделано:**
- **`InactivitySweepJob`** (`inactivity-sweep`): ежедневно в **19:00 UTC** (00:00 Казахстана). Выборка `active`+`enrolled`.
- Пороги: `WARN_AFTER_DAYS = 5`, `REMOVE_AFTER_DAYS = 7`, `NOTICE_EVERY_DAYS = 2` (повторы через день: 5→7→9… студенту, 7→9→11… ментору).
- Бездействие считается **от последнего шага** (последняя активность), при отсутствии шагов — **от `enrolledAt`**.
- События: `student.inactivity-warning` (студенту, payload `telegramId`, `daysInactive`) и `student.inactivity-remove-candidate` (ментору, payload `mentorTelegramId`, `daysInactive`, `wasWarned`).
- Idempotentность через `markNoticed`; `wasWarned` вычисляется **до** маркера текущего прогона (семантика «ранее отправленные»).
- `StudentRepo.getByStatuses()` + реализация в `StudentJsonRepo` (тесты).
- Job зарегистрирован в `StreamApiModule.jobs` (подхватывается `ApiApp`/`InProcJobScheduler` автоматически — правка в `main.ts`/тестах не требуется).

**Созданные файлы:** `packages/stream/src/api/student/inactivity-sweep-job.ts`, `inactivity-sweep-job.test.ts` (15 тестов), `packages/stream/src/infra/db/student-json-repo.test.ts` (2 теста).

**Изменённые файлы:** `packages/stream/src/domain/student/events.ts`, `repo.ts`, `infra/db/student-json-repo.ts`, `api/module.ts` (+test контракта).

**На что посмотреть:** отказоустойчивость — ошибка обработки одного студента не прерывает обход (логируется); отсутствие telegramId/потока — событие не публикуется, маркер не ставится.

---

## Фаза 3 — Уведомления и кик в боте (u7-bot)

**Что сделано:**
- **`InactivityStory`** (контроллер `streams`, имя `inactivity`), подписки:
  - `student.inactivity-warning` → студенту «⏳ Учёба стоит. Ты не занимаешься уже N дней…» + кнопка **«🚪 Покинуть учёбу»** (confirm → `drop-student`);
  - `student.inactivity-remove-candidate` → ментору «🛑 Кандидат на снятие с учёбы. Студент A из группы B не занимался N дней» (+ строка «ℹ️ Уведомления были ранее отправлены студенту» при `wasWarned`) + кнопка **«⚠️ Снять с учёбы»** (confirm → `mark-abandoned` с `cause: 'inactivity'`);
  - `student.abandoned` → пост-уведомления: `who=self` ментору «покинул учёбу» (FR-4), `who=mentor` студенту «Ты снят с учёбы из-за длительного отсутствия активности…» (FR-5).
- **ER кика** `student-kick-handler.ts`: подписка на `student.abandoned` → `banChatMember` + `unbanChatMember` (мягкий кик: исключён, но может вернуться по инвайту) по `stream.telegramGroupId`. Нет группы / нет telegramId / бот не админ → запись в лог, снятие с учёбы не ломается.
- **FR-7** в `group-handler.ts`: `chat_member left` → ментору потока notify «🚪 Студент A покинул группу «Поток».»; **статус студента не меняется** (только read-запросы).
- `main.ts`: подключены ER кика и расширенные депсы group-handler; `StreamsController` + `InactivityStory`.
- `TestBotTransport.#run`: фильтрация проактивных сообщений по tgId пользователя (чужие уведомления не попадают в ответ).

**Созданные файлы:** `apps/u7-bot/src/controllers/streams/stories/inactivity.story.ts` (+12 unit-тестов), `apps/u7-bot/src/handlers/student-kick-handler.ts` (+5 тестов), `apps/u7-bot/src/handlers/group-handler.test.ts` (4 теста).

**Изменённые файлы:** `streams/controller.ts` (+test), `main.ts`, `handlers/group-handler.ts`, `mentor/stories/monitor.ts` (термин «Снять с учёбы»), `mentor-management.e2e.test.ts`, `tests/helpers/test-bot-transport.ts`.

**На что посмотреть:** подписки через `getEventSubscriptions()` (поле `handle`, не `handler`); MarkdownV2 — точка после динамических значений требует `\.` (ловится валидатором `assertResponseMarkdownSafe`).

---

## Фаза 4 — Карточка студентов: фильтр выбывших

**Что сделано (FR-8):**
- Дефолт (`monitor:students`) — **только active/enrolled**: текст, кнопки и метрики — по активным.
- Режим «все» (`monitor:students-all`) — показывает всех, метрики — по всем.
- Кнопка-переключатель: **«👁 Показать выбывших»** / **«🙈 Скрыть выбывших»**.
- Сводка **всегда**: «Всего: N студент(ов), из них M активных, P выбывших».
- Кнопки ⛔/✅/🔄 работают в обоих режимах (у активных; 🔄 у not_advanced — только в «все»).
- Легенда: «кандидат на снятие с учёбы», «выбыл из учёбы».

**Изменённые файлы:** `apps/u7-bot/src/controllers/mentor/stories/monitor.ts`, `monitor.test.ts` (35 тестов), `mentor-management.e2e.test.ts` (advanced-сценарии через переключатель).

---

## Фаза 5 — e2e, документация, финал

**Что сделано:**
- **`inactivity.e2e.test.ts`** — 5 сквозных сценариев в двух независимых контурах (отдельные TestApp, т.к. сценарии меняют статус одного студента):
  1. предупреждение → «Покинуть учёбу» → abandoned + кик (ban+unban) + уведомление ментору;
  2. кандидат ментору → «Снять с учёбы» → abandoned + кик + уведомление студенту;
  3. `chat_member left` активного студента → ментору «покинул группу», статус не меняется;
  4. `chat_member left` выбывшего → уведомления нет, ошибок нет;
  5. карточка: дефолт только активные → переключатель → все + сводка.
- `RecordingBotApi`: запись `banChatMember`/`unbanChatMember` (проверка мягкого кика).
- Найденные e2e-баги исправлены: actorId в `get-student-progress` (иначе «Требуется авторизация»); MarkdownV2-экранирование точки; системные `add/removeRoleFromUser` в group-handler передают `actorId=user.uuid`.
- Документация: `mentor/ui-spec.md` (S07: сводка, фильтр, переключатель), `streams/ui-spec.md` (раздел **SIN** — экраны бездействия), термин «Снять с учёбы» в `mark-abandoned-uc` и легендах экранов.

**Созданные файлы:** `apps/u7-bot/tests/e2e/inactivity.e2e.test.ts` (5 тестов).

**Изменённые файлы:** `mentor/ui-spec.md`, `streams/ui-spec.md`, `streams/stories/view-stream.story.ts` (легенда), `tests/helpers/test-bot-transport.ts` (kickedMembers), `packages/stream/src/api/student/mark-abandoned-uc.ts` (сообщение об отказе).

---

## Общий реестр файлов

**Создано (A):**
| Файл | Фаза |
|---|---|
| `packages/stream/src/api/student/inactivity-sweep-job.ts` (+test) | 2 |
| `packages/stream/src/infra/db/student-json-repo.test.ts` | 2 |
| `apps/u7-bot/src/controllers/streams/stories/inactivity.story.ts` (+test) | 3 |
| `apps/u7-bot/src/handlers/student-kick-handler.ts` (+test) | 3 |
| `apps/u7-bot/src/handlers/group-handler.test.ts` | 3 |
| `apps/u7-bot/tests/e2e/inactivity.e2e.test.ts` | 5 |

**Изменено (M):** 25 файлов — перечислены по фазам выше (домен/UC/job stream; стори, хендлеры, main, monitor, ui-spec в u7-bot; `conductor/tracks.md`, `plan.md`).

**Удалено (D):** нет.

---

## Что стоит посмотреть (чек-лист ревью)

1. **Терминология:** «Снять с учёбы» закреплена в UC, домене, боте, ui-spec — поиск `отчисл`, `неактивн`, `забросил` должен быть чист (кроме «длительной неактивности» в анкете — не входит в трек).
2. **Idempotentность уведомлений:** маркер `notices` ставится ТОЛЬКО при реальной отправке (нет telegramId → маркер не ставится); повтор через `NOTICE_EVERY_DAYS`; сброс при `activate`/`completeStep`.
3. **`wasWarned`:** считается до простановки маркера текущего прогона — «ранее отправленные» корректны в день 7 при первом предупреждении в день 5.
4. **Кик:** мягкий (ban+unban) — студент исключён, но может вернуться по инвайту; деградация без группы/прав — только лог.
5. **FR-7:** уведомление ментору не зависит от снятия роли SUBSCRIBER (порядок в group-handler); статус студента не меняется.
6. **Фильтр карточки:** дефолт — активные; сводка по всем; метрики по видимым.
7. **Контракт событий:** `student.abandoned` теперь публикуется и при `complete-student` с outcome=abandoned — ожидаемое поведение (FR-6), e2e/unit учитывают.
8. **E2E-структура:** два контура (отдельные TestApp) из-за мутации статуса общего студента — при добавлении сценариев учитывать.

## Осталось за пределами трека (замечания)
- `my_chat_member`-ветка group-handler (бот добавлен в группу) — системные вызовы ролей без actorId (вне рамок FR-7, не трогалось).
- Пороги 5/7 дней — константы; при необходимости перенести в конфиг/поле потока (задел отмечен в коде).
