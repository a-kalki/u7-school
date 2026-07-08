# Todo задачи

> Контекст всех задач — в `conductor/architecture-evolution.md`. Треки — в `conductor/tracks/`.

**UI бота (stream):**
1. `CreateStreamStory` (wizard): шаг 9 запрашивает только ссылку на Telegram-группу и сохраняет в `telegramGroupId`. Нужно запрашивать **два** поля — ID группы (`telegramGroupId`) и ссылку-приглашение (`telegramGroupInvite`) — и записывать их в соответствующие свойства. Сейчас `telegramGroupInvite` никогда не заполняется через wizard.


## Архитектурные
1. **`WizardStory`** — базовый класс с унифицированным движком пошагового ввода (контекст, переходы, обработка ошибок валидации). Сейчас логика wizard дублируется в `CreateStreamStory`. **Отложено** — делать при появлении второго wizard'а (см. `conductor/architecture-evolution.md` §2.7).

## Релиз 1 — Фундамент

### Трек 0: Курс (последовательность модулей) — `course_aggregate_20260708`
- Новый агрегат `Course` (ordered `phases` с `track: tech|business`, `moduleIds[]`).
- UC: `create-course`, `list-courses`, `get-course`, `add-module-to-course`.
- `Module` → ссылка на курс/этап.
- Программа курса = агрегация snapshot'ов модулей.

### Трек 1: Жизненный цикл студента — `student_lifecycle_20260708`
- Enriched статусы: `enrolled | active | abandoned | completed | wants_next | advanced | not_advanced` (+ `abandonReason`).
- `StudentAr` методы: `activate`, `drop`, `markAbandoned`, `complete`, `markWantsNext`, `advance`, `markNotAdvanced`.
- UC: `complete-student` (ментор), `drop-student` (self), `mark-abandoned` (mentor).
- `CompleteStreamUc`: при завершении потока active/enrolled → `completed`, снять `STUDENT`.
- `User.nick` (опц. поле).
- `TgFacade` (порт в `core`, реализация в `app`) — в resolver доменных модулей.
- Confirm-хелпер в `core/ui` (формализовать convention `action`/`action-confirm`).
- Миграция: `dropped`→`abandoned(voluntary)`, `expelled`→`abandoned(by_mentor)` — на месте.
- Bug: `statusLabels` в `MonitorStory` (`dropped`→`expelled`) — будет заменён на новые статусы.
- Отчисление студента (S08) — ✅ уже реализовано, войдёт в новый статус-модель как `abandoned(by_mentor)`.

### Трек 2: ContentPath — `content_path_20260708`
- VO `ContentPath` (`A:B:C:D`, partial-формы) в домене `course`.
- UC `resolve-content-path` с role-based доступом (curious/student/mentor).
- Рефакторинг `monitor`/`learning` сториз на единый резолвер.

## Релиз 2 — UX ядра продукта

### Трек 3: Gating модулей — `module_gating_20260708`
- `CoursePolicy.canEnrollNextModule` — проверка завершения prerequisite.
- Gate в `enroll-student`.
- UI: после `completed` → предложение записаться на следующий модуль → `advanced`.
- Правило «Синтаксис → Алгоритмика».

### Трек 4: Навигация студента — `student_navigation_20260708`
- Хаб «Моя учёба» (Продолжить / Уроки / Прогресс) вместо прыжка в шаг.
- Дерево-навигация по урокам кнопками через ContentPath (🔒/✅/▶️ маркеры).
- ◀️/▶️ по истории шагов.
- Прогресс урока в шаге, мотивация на переходах.
- Самостоятельный выход из потока (`abandoned`, self).

### Трек 5: Витрина для любопытного — `curious_showcase_20260708`
- Каталог **курсов** (верхний уровень над потоками) + карточка курса + программа курса.
- Программа модуля расширенная (число шагов, типы, сводка объёма).
- Программа/Детали на любом статусе потока.
- Предзапись «Ждать новый набор» на completed-поток.

### «Инструменты ментора» (входит в Релиз 2)
- Первое-level-меню MENTOR/ADMIN: «🛠️ Инструменты ментора» → «➕ Создать поток», «📋 Мои потоки».

## Релиз 3 — Мониторинг

### Трек 6: Мониторинг группы для ментора — `mentor_monitoring_20260708`
- Логика «Отстаёт» (неактивность 5 дней + отставание от медианы 30%+).
- Сводка по группе (медиана, отстающие, завершившие) на S07.
- Сортировка студентов: отстающие сверху.
- История шагов студента (S08 `history:*`) — сейчас заглушка.

## Бэклог (не планируется в ближайших релизах)
- Broadcast при запуске потока + произвольная рассылка ментором (требует `TgFacade`, уже в фундаменте).
- Сбор обратной связи (мини-опрос после урока/проекта).
- Типы шагов (тест/квиз, практическое задание с ревью).
- Заморозка студента (академический отпуск).
- Синхронизация контента (обновление `contentSnapshot` при изменении модуля).
- Снятие `CANDIDATE` при `+STUDENT` (сейчас: только добавление `STUDENT`).
- Отзывы выпускников на карточке completed-потока.

## Доменные
(покрыты треками выше)
