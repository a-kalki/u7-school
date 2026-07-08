# Архитектурная эволюция Stream (объединяющий документ)

**Назначение:** единый источник решений, на который ссылается каждый трек эволюции модуля Stream. Каждый трек начинает работу с чтения этого файла + своего `spec.md`.

> Создан 2026-07-08. Актуален для треков:
> `course_aggregate_20260708`, `student_lifecycle_20260708`, `content_path_20260708`,
> `module_gating_20260708`, `student_navigation_20260708`, `curious_showcase_20260708`,
> `mentor_monitoring_20260708`.

---

## 1. Цель эволюции

Превратить Stream из «потока одного модуля» в полноценную систему последовательного обучения:
- **Курс** объединяет модули в последовательность с этапами и направлениями (tech/business).
- Gating: только студент, завершивший «Синтаксис», попадает в «Алгоритмику».
- Богатый жизненный цикл студента с явными статусами.
- Унифицированная адресация контента `A:B:C:D` (ContentPath).
- UX для трёх ролей: ментор, студент, любопытный.

---

## 2. Архитектурные решения

### 2.1. Курс (Course) — новый агрегат
- Домен `course`. Агрегат `Course`: `uuid`, `title`, `description`, `authorId`, ordered `phases: { id, title, track: 'tech'|'business', moduleIds[] }[]`, `status`, `createdAt`.
- `Module` получает ссылку на курс/этап (или хранится только в Course — решить в треке 0).
- `Stream` остаётся привязанным к одному `moduleId` (1 поток = 1 модуль). Курс — это порядок модулей поверх.
- UC: `create-course`, `list-courses`, `get-course`, `add-module-to-course`.
- **Gates (см. §2.9):** `create-course` → AUTHOR; `canEdit` курса → ADMIN или author.
- Программа курса = агрегация snapshot'ов модулей курса.

### 2.2. ContentPath — value object в домене `course`
- Формат `A:B:C:D` = module:project:lesson:step (1-based индексы). Partial-формы: `A`, `A:B`, `A:B:C`, `A:B:C:D`, `A:B:C:all`.
- VO `ContentPath` (parse/serialize + валидация).
- UC `resolve-content-path` с role-based доступом:
  - **curious (GUEST/CANDIDATE) / все желающие**: шаги видны, но только заголовок (`description`), без тела (`content`/`code`). Структура до уровня шага (заголовки + тип + кол-во).
  - **student**: completed-шаги — полный контент read-only; текущий шаг — полный + active; непройденные (будущие) — только заголовок.
  - **mentor/admin**: полный доступ ко всему контенту.
- Рефакторинг `monitor`/`learning` сториз на единый резолвер (убрать дубли `#findStepPosition`).

### 2.3. Жизненный цикл студента — enriched статусы
Статус-машина на запись Student (один модуль):
```
enrolled → active → completed
                     ├─ wants_next   (завершил, хочет на след. модуль — ждёт набор)
                     ├─ advanced     (завершил и перешёл на след. модуль)
                     └─ not_advanced (завершил, не прошёл gating / отказ)
          ↘ abandoned (self-drop / mentor-by-inactivity)
```
- **Enum:** `enrolled | active | abandoned | completed | wants_next | advanced | not_advanced`.
- `abandoned` схлопывает прежние `dropped`+`expelled`. Подполе `abandonReason: 'voluntary' | 'inactivity' | 'by_mentor'`.
- **Роль STUDENT** = «сейчас активен в активном потоке». Живёт только на `enrolled`/`active`. При `completed*` и `abandoned` — снимается (`UserFacade.removeRoleFromUser`). При `advance` (запись на след. модуль) — `+STUDENT` снова.
- Процесс: студент записался → `enrolled` (ждёт) → ментор активировал поток → `active` + issue первого шага.
- `StudentAr` методы: `activate()` (enrolled→active), `drop()` (self), `markAbandoned()` (mentor), `complete()` (есть), `markWantsNext()`, `advance()`, `markNotAdvanced()`.
- UC: `complete-student` (ментор), `drop-student` (self), `mark-abandoned` (mentor).
- `CompleteStreamUc` доработать: при завершении потока все `active`/`enrolled` → `completed`, снять `STUDENT`.
- **Миграция:** `dropped`→`abandoned(voluntary)`, `expelled`→`abandoned(by_mentor)`. Решается на месте (процесс живой).

### 2.4. TgFacade — порт в core, реализация в app
- Интерфейс `TgFacade` в `core` (порт: отправка сообщения по telegramId, batch-рассылка). Не знает о приложении.
- Реализация в `app`/infra (Grammy). Wiring на уровне app.
- В resolver доменных модулей (`StreamApiModuleResolver` и др.) — `tgFacade: TgFacade`. UC используют через `this.resolve.tgFacade`.
- В story НЕ передаётся (пока). Story вызывает UC, UC внутри использует tgFacade. Если понадобится прямой доступ — расширим `BotUserStory.init`.

### 2.5. User.nick
- `UserSchema`: опциональное `nick?: string` (уникальное при заполнении).
- Назначение: прямые сообщения между пользователями (ментор ↔ студент), отображение в мониторинге.

### 2.6. Confirm-паттерн — формализация (в фундаменте)
- Convention `action`/`action-confirm` уже используется (`expel`/`expel-confirm`, `complete`/`complete-confirm`).
- Helper в `core/ui` или `app/ui`: метод построения confirm-клавиатуры + базовый `U7BotUserStory.confirm(...)`.
- Применяется в треках 1, 3, 6 (много подтверждаемых действий).

### 2.7. WizardStory — ОТЛОЖЕНО
- Базовый класс `WizardStory` НЕ делаем сейчас (один wizard `create-stream`, новых не планируется). Зафиксировано в `TODO.md` (Архитектурные). Делаем при появлении второго wizard'а.

### 2.8. «Инструменты ментора» и «Инструменты автора»
- Первое-level-меню для MENTOR: «🛠️ Инструменты ментора» → «➕ Создать поток», «📋 Мои потоки».
- Первое-level-меню для AUTHOR: «✍️ Инструменты автора» → создание/редактирование модулей, курсов, уроков, шагов.
- Секции role-gated; пользователь с обеими ролями видит обе.
- `CreateStreamStory.handleStart` перевести на второй уровень (под «Инструментами ментора»).

### 2.9. Роль AUTHOR (автор программы) — отделена от MENTOR
- Новая `Role.AUTHOR` — создаёт программу: модули, курсы, уроки, шаги, проекты.
- `MENTOR` — преподаёт: создаёт/ведёт потоки (Stream), активирует/завершает, мониторит студентов.
- **Принцип:** создание — прерогатива роли; редактирование — ADMIN или автор (по `authorId`). ADMIN **не создаёт**, только редактирует.
- `ModulePolicy.canCreate`: MENTOR → AUTHOR. `CoursePolicy.canCreate` → AUTHOR.
- `canEdit` (module/course) → ADMIN или author (без изменений).
- `StreamPolicy.canCreate` → MENTOR (без изменений).
- Роль выдаёт ADMIN (`addRoleToUser`). Пользователь может иметь несколько ролей.
- Трек: `author_role_20260708` (Релиз 1, перед Треком 0).
- Статистика по курсам для автора — будущая потребность (не в бэклоге).

---

## 3. Структура пакетов и зависимости (правило)

```
core    — фреймворк, ничего не знает о приложении. Только порты/абстракции (ModuleResolver, TgFacade, ...).
app     — главный модуль u7-school. Знает, что он часть u7-school.
          НЕ зависит от доменных модулей (исключение: *meta*-типы ModuleMeta/UcMeta — для типизации appApi).
<domain>— доменные модули (user, course, stream, onboarding, ...).
          МОГУТ импортировать app модуль. Обратное (app → domain) запрещено, кроме meta-типов.
          Могут импортировать доменные объекты других доменных модулей.
          UI-вызовы к чужой логике — ТОЛЬКО через фасад (UC) или appApi (story).
          Прямой импорт инфра — запрещён.
```

---

## 4. Стратегия релизов

**Поэтапно**, не big-bang.

- **Релиз 1 «Фундамент»** (backend, без UI-поставки): треки 0 (Курс) + 1 (ЖЦ студента) + 2 (ContentPath) + User.nick + TgFacade + Confirm-хелпер + обновление `ui-spec.md` (концептуальная часть). Валидация: UC-тесты + CLI + `tests/bot`.
- **Релиз 2 «UX ядра»**: треки 3 (gating) + 4 (навигация студента) + 5 (витрина) + «Инструменты ментора».
- **Релиз 3 «Мониторинг»**: трек 6.

Трек 7 (broadcast) — в бэклоге, не планируется.

---

## 5. Карта треков и зависимости

| # | Track ID | Зависимости | Релиз |
|---|----------|-------------|-------|
| A | `author_role_20260708` | — | 1 |
| 0 | `course_aggregate_20260708` | A | 1 |
| 1 | `student_lifecycle_20260708` | — | 1 |
| 2 | `content_path_20260708` | 0 | 1 |
| 3 | `module_gating_20260708` | 0, 1 | 2 |
| 4 | `student_navigation_20260708` | 1, 2 | 2 |
| 5 | `curious_showcase_20260708` | 0, 2 | 2 |
| 6 | `mentor_monitoring_20260708` | 1 | 3 |

```
A (AUTHOR) → 0 (Курс) ─┐
                        ├─→ 2 (ContentPath) ─┬─→ 4 (Навигация студента)
          1 (ЖЦ) ────────┤                     ├─→ 5 (Витрина)
                        ├─→ 3 (Gating)        │
                        └─→ 6 (Мониторинг) ───┘
```

---

## 6. Структура БД (json-репозитории, для миграций)

Прод: `/srv/u7-school/data/` (только read-доступ через `ssh kalki_server`).
- `users/users.json` — `[{ uuid, name, telegramId, roles[], createdAt, updatedAt? }]`. **Нет `nick`** — добавляется.
- `courses/modules.json` — модули. **Нет курса/этапа** — добавляется. Сейчас 2 опубликованных: «Основы JS. Синтаксис», «Основы JS. Алгоритмика».
- `courses/lessons.json`, `courses/steps.json`.
- `streams/streams.json` — потоки (`moduleId`, `contentSnapshot`, `status`).
- `streams/students.json` — студенты (`status: 'active'|'completed'|'dropped'|'expelled'`). **Миграция** статусов → `abandoned` + `abandonReason`.
- Появится `courses/courses.json` — агрегаты Course.

Миграции решаются на месте (процесс живой, идут уроки).

---

## 7. Подход к тестам (`tests/bot`)

**Обязательное правило для каждого трека:** если трек создаёт новую функциональность или изменяет текущую — проверить, обновить сломанные и добавить новые интеграционные и e2e тесты в `tests/bot/*`. Это обязательно, не опционально. Каждый план трека содержит фазу/задачу тестов `tests/bot`.

- **Integration** (`tests/bot/integration/stream/`): реальные модули + временные json-фикстуры (`createTestApp`), проверка UC и сториз через `BotRouter.handleCallback`. Шаблон: `tests/bot/helpers/test-app.ts`, фикстуры `tests/bot/fixtures/templates/`.
- **E2E** (`tests/bot/e2e/`): сквозные сценарии через `BotRouter` + `findButton`/`findMenuItem` хелперы.
- TDD обязателен (Red → Green) — см. `conductor/workflow.md`.
- Покрытие >80% для нового кода.

---

## 8. Документация

- `packages/stream/src/ui/bot/ui-spec.md` — обновлять по ходу каждого трека (концептуальная часть в Релизе 1, экраны — по мере реализации).
- `conductor/tech-stack.md` — при добавлении портов/фасадов (TgFacade).
- `AGENTS.md` — добавлена секция «Архитектура пакетов» (см. раздел 3 выше).
- `TODO.md` — перераспределён по трекам; старый трек `stream_ux_backlog_20260613` удалён.
