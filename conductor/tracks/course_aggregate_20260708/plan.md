# План реализации: Курс (последовательность модулей)

> Контекст: `../../architecture-evolution.md` §2.1, `./spec.md`. TDD (Red→Green), см. `conductor/workflow.md`.

## Фаза 1: Домен — агрегат Course [checkpoint: 41ebd7d]

- [x] Task: Написать тесты CourseAr (create, addModuleToPhase, publish, ошибки переходов) [54e1bb5]
  - [x] create → status=draft, фазы пусты
  - [x] addPhase → добавляет phase с track
  - [x] addModuleToPhase → добавляет moduleId в phase
  - [x] publish → status=published; повторный publish → ошибка

- [x] Task: Реализовать CourseAr, CourseSchema, CoursePolicy [54e1bb5]
  - [x] `packages/course/src/domain/course/entity.ts`, `a-root.ts`, `policy.ts`, `repo.ts`
  - [x] Export из `packages/course/src/domain/index.ts`

- [ ] Task: Conductor - Ручная верификация 'Агрегат Course'

## Фаза 2: UC и фасад [checkpoint: 1f9e550]

- [x] Task: Написать тесты UC (create-course, add-module-to-course, add-phase-to-course, list-courses, get-course) [02e3311]
  - [x] admin создаёт курс; не-admin → access denied
  - [x] get-course возвращает курс по uuid
  - [x] list-courses → с фильтром по статусу

- [x] Task: Реализовать UC + команды [02e3311]
  - [x] `commands/create-course-cmd.ts`, `add-module-to-course-cmd.ts`, `add-phase-to-course-cmd.ts`, `get-course-cmd.ts`, `list-courses-cmd.ts`
  - [x] UC в `packages/course/src/api/course/`
  - [x] Расширить `CourseApiModuleMeta.ucMetas`, `CourseApiModuleResolver` (courseRepository, courseFacade)
  - [x] `CourseInProcFacade.getCourseProgram(courseId)` — агрегация snapshot'ов модулей по phases

- [ ] Task: Conductor - Ручная верификация 'UC курса'

## Фаза 3: Инфра (json-репозиторий) [checkpoint: 0fee71e]

- [x] Task: Написать тесты CourseJsonRepo

- [x] Task: Реализовать CourseJsonRepo
  - [x] `packages/course/src/infra/db/course-json-repo.ts`
  - [x] Файл `data/courses/courses.json`
  - [x] Подключить в `tests/bot/helpers/test-app.ts` (fixtures: `tests/bot/fixtures/templates/courses/courses.json`)

- [ ] Task: Conductor - Ручная верификация 'Инфра курса'

## Фаза 4: Интеграция и seed

- [x] Task: Обновить test-app + fixtures (createTestApp подключает courseRepo)

- [x] Task: Написать интеграционный тест: get-course возвращает программу из 2 модулей

- [x] Task: Проверить, обновить сломанные и добавить интеграционные/e2e тесты в `tests/bot/*` (создание курса AUTHOR; доступность get-course/list-courses для разных ролей)

- [x] Task: Seed прод-данных через CLI (курс «Полный курс JS», Этап 1: Синтаксис + Алгоритмика) — на месте, после согласования
  - ✅ Создан курс `29adc3be-873e-47ec-aa30-61f5e6e25d4e` с фазой «Этап 1: Основы JS» (модули: Синтаксис + Алгоритмика)

- [x] Task: Обновить `conductor/architecture-evolution.md` (отметить реализацию Course) и `ui-spec.md` (концепция Курс в Части A)

- [ ] Task: Conductor - Ручная верификация 'Интеграция курса'
