# Спецификация трека: Курс (последовательность модулей)

> **Контекст эволюции:** `conductor/architecture-evolution.md` (§2.1, §3, §5). Прочитать перед началом.

## Обзор
Ввести агрегат `Course`, объединяющий модули в упорядоченную последовательность с этапами (phases) и направлениями (`tech`/`business`). Курс — основа для gating'а модулей (трек 3) и для «индекса A» в ContentPath (трек 2). Поток (Stream) остаётся привязанным к одному модулю.

**Роли:** ADMIN (создание курса), MENTOR/ALL (просмотр).

## Функциональные требования

### F1. Агрегат Course
- `CourseAr` (домен `course`): `uuid`, `title`, `description`, `phases: { id, title, track: 'tech'|'business', moduleIds: string[] }[]`, `status`, `createdAt`.
- Методы: `create`, `addModuleToPhase(phaseId, moduleId)`, `publish`.
- `CourseSchema` (valibot), `CourseRepo` (интерфейс), `CoursePolicy` (canEdit — admin; canRead — все).

### F2. Связь Module ↔ Course
- `Module` получает опциональные `courseId?`, `phaseId?` ИЛИ хранится только в `Course.phases[].moduleIds` (решить в реализации; предпочесть хранение в Course, чтобы Module не менять).
- Программа курса = агрегация `ContentSnapshot` всех модулей курса по порядку phases.

### F3. UC (API)
- `create-course` (admin): title, description.
- `add-module-to-course` (admin): courseId, phaseId, moduleId.
- `add-phase-to-course` (admin): courseId, title, track.
- `list-courses` (all): опубликованные курсы.
- `get-course` (all): курс + программа (агрегация snapshot'ов).

### F4. Инфра
- `CourseJsonRepo` (json), файл `data/courses/courses.json`.
- `CourseInProcFacade` — расширить существующий фасад курса методом `getCourseProgram(courseId)`.

### F5. CLI
- Управление курсами через `scripts/call-uc.ts` (создание, добавление модулей) — для seed'а прод-данных (Синтаксис + Алгоритмика в один курс).

## Критерии приёмки
- [ ] Можно создать курс, добавить phases (Этап 1: Основы JS, track=tech), добавить модули (Синтаксис, Алгоритмика) по порядку.
- [ ] `get-course` возвращает программу: phases → modules → projects → lessons → stepIds.
- [ ] Существующие модули и потоки работают без изменений (обратная совместимость).
- [ ] Покрытие >80%, TDD.

## За рамками
- Gating зачисления (трек 3).
- UI каталога курсов (трек 5).
- ContentPath VO (трек 2).
- Миграция прод-данных (seed курсов) — отдельная задача после реализации UC, на месте.
