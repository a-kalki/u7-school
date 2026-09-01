# Дорожная карта разработки (Development Roadmap)

> v3.1 (2026-09-01). Добавлена инициатива V — система задач и уведомлений (концепция согласована).
>
> v3 (2026-08-29). Актуализация статусов по фактическому состоянию кода.
> Объединяющий документ для всех крупных инициатив. Определяет порядок выполнения,
> релизы (отправку в прод), миграции и зависимости между инициативами.
>
> **Изменения от v2 (2026-08-07):**
> - Релизы 1–3 выполнены (с отклонениями от плана, см. раздел «Фактические отклонения»).
> - Добавлена инициатива IV — переезд onboarding → wish (в v2 не планировалась).
> - Решение `publicActions`/`getAction` отменено — используется `cbFor`/`app:main-menu`.
> - Релиз 4 частично выполнен (EventBus, questionnaire, peer-review есть; модуль `metrics` и витрина — нет).

---

## Обзор инициатив

| # | Инициатива | Документ | Статус |
|---|-----------|----------|--------|
| I | Рефакторинг Bot UI (9 треков) | [bot-ui-refactoring.md](./bot-ui-refactoring.md) (исторический) | ✅ завершена |
| II | Система сбора метрик студента | [metrics-system.md](./metrics-system.md) | ◐ частично (Релиз 3 готов, Релиз 4 — нет) |
| III | Управление учебным контентом | [content-management.md](./content-management.md) | спецификация (не начата) |
| IV | Переезд onboarding → wish | (треки в архиве: wish-*) | ✅ завершена (не планировалась в v2) |
| V | Система задач и уведомлений | [tasks-system.md](./tasks-system.md) | концепция согласована, не начата |

---

## Фактические отклонения от плана

Зафиксировано, чтобы план и код не расходились:

1. **`publicActions`/`getAction` НЕ реализованы.** В коде кросс-ссылки делаются через
   `cbFor` и общий `app:main-menu`. Треки отказа: `remove-public-actions_20260808`,
   `remove-public-actions-core_20260809`. Подробности — в шапке
   [bot-ui-refactoring.md](./bot-ui-refactoring.md).

2. **Onboarding не стал заглушкой — вместо него полноценный questionnaire-контроллер.**
   По плану (Трек 7) `OnboardingController` переносился «как есть» с отключённой кнопкой.
   Фактически: движок анкет выделен в `packages/questionnaire` (Релиз 3), в
   `apps/u7-bot/src/controllers/questionnaire/` — полноценный контроллер со сторями
   (включая owner-info и предупреждение о брошенных анкетах). Пакет `onboarding` удалён.

3. **Переезд onboarding → wish (инициатива IV).** Домен мотиваций/желаний вынесен в
   `packages/wish` (связан с questionnaire через фасад). Завершённые треки:
   `wish-module`, `wish-ui`, `wish-fulfillment`, `wish-lifecycle`, `wish-invite`,
   `wish-module` (v2), `wish-e2e`.

4. **Сквозные треки вне инициатив** (завершены, в архиве): `bot-transport-refactor`,
   `event-reaction` (ER-паттерн), `ui-event-subscriptions`, `ui-proactive-sender`,
   `markdownv2_guard`, `job-scheduler` (планировщик + обработка брошенных анкет).

---

## Порядок выполнения и релизы

### Принцип упорядочивания

1. **Сначала bot-ui-refactoring** — архитектурная чистка. ✅ Выполнено (Релизы 1–2).
2. **Затем metrics** — бизнес-ценность. ◐ Релиз 3 выполнен, Релиз 4 — нет.
3. **Последним content-management** — инструменты автора. ⬜ Не начат.

---

### Релиз 1: Новый Bot UI — фундамент и базовые контроллеры ✅

**Инициатива:** bot-ui-refactoring, треки 0–4. Все выполнены.

| Трек | Содержание | Статус |
|------|-----------|--------|
| Трек 0 | `UiApp` в core + удаление `BotRouter` | ✅ |
| Трек 1 | Перенос базовых классов и `U7BotAppMeta` в `apps/u7-bot`, разрыв цикла `app ↔ onboarding` | ✅ |
| Трек 2 | `AppController` + `CommunityStory` | ✅ |
| Трек 3 | Контроллер `courses` — «Программы курсов», общий `tree-renderer.ts` | ✅ |
| Трек 4 | Контроллер `streams` — «Потоки курсов» | ✅ |

**Фактическое состояние:** контроллеры `app`, `courses`, `streams` в
`apps/u7-bot/src/controllers/`; старые `ui/`-директории `course` и `stream` удалены;
тесты перенесены в `apps/u7-bot/tests/`. Архивы: `bot_ui_courses_20260807`,
`bot_ui_streams_20260807`.

---

### Релиз 2: Новый Bot UI — learning, mentor, зачистка ✅

**Инициатива:** bot-ui-refactoring, треки 5–8. Все выполнены.

| Трек | Содержание | Статус |
|------|-----------|--------|
| Трек 5 | Контроллер `learning` — «Моя учёба» (670 строк → 6 файлов) | ✅ |
| Трек 6 | Контроллер `mentor` — «Инструменты ментора», баг кнопки «Назад» исправлен | ✅ |
| Трек 7 | Onboarding — заглушка | ✅ перевыполнен: полноценный questionnaire-контроллер (см. отклонение 2) |
| Трек 8 | Зачистка старого кода, документация | ✅ (см. отклонение про `core/src/ui/bot/README.md` ниже) |

**Фактическое состояние:** все контроллеры в `apps/u7-bot/src/controllers/`
(`app`, `courses`, `streams`, `learning`, `mentor`, `questionnaire`); старые
`ui/`-директории удалены из всех пакетов (осталась только `packages/core/src/ui` —
по плану); `u7-bot-app-meta.ts` в `apps/u7-bot/src/core/`; `tests/bot/` →
`apps/u7-bot/tests/`; документация обновлена (`architecture.md`, `bot-controller.md`,
`bot-ui-story.md`, `apps/u7-bot/README.md`, ui-spec'и по контроллерам).
Архивы: `learning_20260807`, `mentor_20260807`, `onboarding_20260807`, `cleanup_20260807`.

**Единственный невыполненный пункт §4.9 плана:** `packages/core/src/ui/bot/README.md`
не создан (документ-план помечен историческим — пункт считаем отменённым).

**Критерий готовности к проду:** подтверждён — все кнопки работают, `tsc --noEmit`
и `biome check` чистые, все тесты проходят.

---

### Релиз 3: Метрики — инфраструктура (EventBus, Questionnaire) ✅

**Инициатива:** metrics-system, Документ 2.

| Компонент | Статус |
|-----------|--------|
| EventBus в `core` | ✅ `packages/core/src/domain/events` |
| `Questionnaire` модуль (движок анкет) | ✅ `packages/questionnaire` (domain/api/infra) |
| UC слой, контроллер | ✅ `apps/u7-bot/src/controllers/questionnaire/` |
| AR анкеты (`QuestionnaireAr`) | ✅ |
| Онбординг-анкета на новом движке | ✅ (через wish + questionnaire, см. отклонение 3) |

Архивы: `metrics-eventbus_20260810`, `metrics-questionnaire_20260810`,
`metrics-questions_20260810`, `metrics-structure_20260810`,
`metrics-aggregate-api_20260810`, `metrics-publish-events_20260810`,
`questionnaire-domain-uc_20260810`, `questionnaire-bot-controller_20260810`,
`questionnaire-owner-info_20260814`.

---

### Релиз 4: Метрики — пайплайн и витрина ◐ частично

**Инициатива:** metrics-system, Документ 3 + Документ 1.

| Компонент | Статус |
|-----------|--------|
| Домен `peer-review` | ✅ `packages/peer-review` (assessment, categories, scores, question-pool) |
| AR метрик | ✅ (`metrics-metric-ar_20260810`) |
| Модуль `metrics` (агрегация) | ⬜ `packages/metrics` отсутствует |
| Витрина профиля студента | ⬜ в UI бота не найдена |

**Осталось сделать:** модуль `metrics`, витрина профиля студента (студент + ментор),
порог достоверности. Формулы агрегации — по финализированной концепции
[metrics-conception.md](./metrics-conception.md).

**Критерий готовности к проду:**
- Завершение модуля → анкеты → метрики (полный пайплайн)
- Витрина профиля студента доступна студенту и ментору
- Порог достоверности соблюдается

---

### Релиз 5: Фундамент контента — basedOn, visibility, CRUD, snapshot ⬜

**Инициатива:** content-management, треки 1–2. Не начат.

| Трек | Содержание |
|------|-----------|
| Трек 1 | `basedOn` на всех сущностях, visibility refactor (canRead/isPublished), CRUD (update, archive каскадом, structural ops), мета-поля (`planMd`, `lessonMd`, `summaryMd`, `sourcePath`) |
| Трек 2 | `contentSnapshot` → `stream/domain/` (чистое UUID-дерево без title'ов), `resolveModuleContent`, восстановление catalog/content-path/stream-creation |

**Миграции:**
- `modules.json`, `lessons.json`, `steps.json`: добавить поля `basedOn`, `planMd`, `lessonMd`, `summaryMd`, `sourcePath`
- `streams.json`: убрать title'ы из `contentSnapshot` (оставить чистое UUID-дерево)
- `courses.json`: добавить `basedOn`

**Критерий готовности к проду:**
- Все существующие потоки работают (frozen snapshot → archived → читается по UUID)
- Студент видит свой прогресс без изменений
- Ментор видит группу без изменений

**⚠️ Техдолг, возникающий в этом релизе:**
После Трека 2 contentSnapshot становится чистым UUID-деревом — title'ы больше не хранятся в snapshot, а грузятся live по UUID через DS callbacks. UI (в `apps/u7-bot`) должен быть адаптирован:
- `shared/tree-renderer.ts` — передача колбэков `getProjectTitle`/`getLessonTitle` вместо чтения title из snapshot
- Контроллеры `streams`, `learning`, `mentor` — формирование `TreeNode[]` без вложенных title'ов
- Это **локальное изменение** (~1–2 дня), не архитектурное. Хуки те же, сигнатуры меняются аддитивно.

---

### Релиз 6: Инструменты автора — Import/Export, Fork, Gating ⬜

**Инициатива:** content-management, треки 3–4. Не начат.

| Трек | Содержание |
|------|-----------|
| Трек 3 | Import/Export (папка ↔ JSON), `steps.md` генератор/парсер, dry-run, CLI, `AUTHOR_GUIDE.md` |
| Трек 4 | Форк на всех уровнях, publish-replace, deep-copy, gating через basedOn-цепочку, fork-режим в импорте |

**Миграции:** без миграций данных (новые фичи).

**Критерий готовности к проду:**
- Автор может экспортировать модуль в папку, отредактировать и импортировать обратно
- Dry-run показывает изменения перед применением
- Fork-step + publish-step-replace: активные видят старый текст, новые — новый
- Gating через basedOn: студент с M1 зачисляется на поток с M2 (basedOn=M1)

---

## Диаграмма состояния

```
Релиз 1 ✅ ──> Релиз 2 ✅ ──> Релиз 3 ✅ ──> Релиз 4 ◐ ──> Релиз 5 ⬜ ──> Релиз 6 ⬜
(bot-ui)      (bot-ui)      (metrics infra) (metrics pipeline) (content-mgmt)  (content-mgmt)

Инициатива V (tasks) ⬜ — концепция согласована; место в очереди релизов
определится при планировании трека (зависит от приоритета Релиза 4).
```

**Ближайшая работа:** доделать Релиз 4 (модуль `metrics` + витрина профиля студента),
затем Релиз 5 (content-management треки 1–2), затем Релиз 6 (треки 3–4).

---

### Инициатива V: Система задач и уведомлений ⬜ (концепция)

Бизнес-проблема: проактивные сообщения с кнопками (кандидаты на снятие с учёбы,
предложения анкет) хаотично гасят кнопки друг у друга, вторгаются в текущий флоу
пользователя, а дела, на которые не ответили сразу, теряются в истории чата.

Решение: **pull вместо push** — проактивные сообщения становятся текстовыми
уведомлениями без кнопок; все дела пользователя собираются в едином списке
«Мои задачи» (меню + команда `/tasks`) с кнопками быстрых действий прямо в
задаче. Подробности: [tasks-system.md](./tasks-system.md).

Статус: концепция согласована. Нужны спецификация и треки: модуль `tasks`
(домен/UC/ER), флоу списка задач в боте, миграция каскада бездействия
(inactivity-sweep) как пилот, пункт меню «Покинуть учёбу».

---

## Сводка миграций по релизам

| Релиз | Файлы данных | Суть миграции | Статус |
|-------|-------------|---------------|--------|
| 1 | `package.json` (все пакеты) | Обновить exports, зависимости | ✅ |
| 2 | Удаление файлов | Удалить старые `ui/` директории | ✅ |
| 3 | `onboarding/*.json` | questionnaire + миграция анкет | ✅ (пакет удалён, данные в `questionnaires/`) |
| 4 | — | Без миграций | ◐ |
| 5 | `modules.json`, `lessons.json`, `steps.json` | Добавить `basedOn`, мета-поля | ⬜ |
| 5 | `streams.json` | Убрать title'ы из contentSnapshot | ⬜ |
| 5 | `courses.json` | Добавить `basedOn` | ⬜ |
| 6 | — | Без миграций | ⬜ |

---

## Связанные документы

- [conductor/index.md](./index.md) — индекс всех документов
- [conductor/workflow.md](./workflow.md) — процесс работы conductor
- [conductor/code_styleguides/bot-architecture.md](./code_styleguides/bot-architecture.md) — актуальное устройство bot-level
- [conductor/code_styleguides/domain-boundaries.md](./code_styleguides/domain-boundaries.md) — архитектурные правила
