# План реализации: Курс (последовательность модулей)

> Контекст: `../../architecture-evolution.md` §2.1, `./spec.md`. TDD (Red→Green), см. `conductor/workflow.md`.

## Фаза 1: Домен — агрегат Course

- [ ] Task: Написать тесты CourseAr (create, addModuleToPhase, publish, ошибки переходов)
  - [ ] create → status=draft, фазы пусты
  - [ ] addPhase → добавляет phase с track
  - [ ] addModuleToPhase → добавляет moduleId в phase
  - [ ] publish → status=published; повторный publish → ошибка

- [ ] Task: Реализовать CourseAr, CourseSchema, CoursePolicy
  - [ ] `packages/course/src/domain/course/entity.ts`, `a-root.ts`, `policy.ts`, `repo.ts`
  - [ ] Export из `packages/course/src/domain/index.ts`

- [ ] Task: Conductor - Ручная верификация 'Агрегат Course'

## Фаза 2: UC и фасад

- [ ] Task: Написать тесты UC (create-course, add-module-to-course, add-phase-to-course, list-courses, get-course)
  - [ ] admin создаёт курс; не-admin → access denied
  - [ ] get-course возвращает агрегированную программу (phases→modules→snapshot)
  - [ ] list-courses → только опубликованные

- [ ] Task: Реализовать UC + команды
  - [ ] `commands/create-course-cmd.ts`, `add-module-to-course-cmd.ts`, `add-phase-to-course-cmd.ts`, `get-course-cmd.ts`, `list-courses-cmd.ts`
  - [ ] UC в `packages/course/src/api/`
  - [ ] Расширить `CourseApiModuleMeta.ucMetas`, `CourseApiModuleResolver` (courseRepo)
  - [ ] `CourseInProcFacade.getCourseProgram(courseId)` — агрегация snapshot'ов модулей по phases

- [ ] Task: Conductor - Ручная верификация 'UC курса'

## Фаза 3: Инфра (json-репозиторий)

- [ ] Task: Написать тесты CourseJsonRepo

- [ ] Task: Реализовать CourseJsonRepo
  - [ ] `packages/course/src/infra/course-json-repo.ts`
  - [ ] Файл `data/courses/courses.json`
  - [ ] Подключить в `tests/bot/helpers/test-app.ts` (fixtures: `tests/bot/fixtures/templates/courses/courses.json`)

- [ ] Task: Conductor - Ручная верификация 'Инфра курса'

## Фаза 4: Интеграция и seed

- [ ] Task: Обновить test-app + fixtures (createTestApp подключает courseRepo)

- [ ] Task: Написать интеграционный тест: get-course возвращает программу из 2 модулей

- [ ] Task: Проверить, обновить сломанные и добавить интеграционные/e2e тесты в `tests/bot/*` (создание курса AUTHOR; доступность get-course/list-courses для разных ролей)

- [ ] Task: Seed прод-данных через CLI (курс «Полный курс JS», Этап 1: Синтаксис + Алгоритмика) — на месте, после согласования

- [ ] Task: Обновить `conductor/architecture-evolution.md` (отметить реализацию Course) и `ui-spec.md` (концепция Курс в Части A)

- [ ] Task: Conductor - Ручная верификация 'Интеграция курса'
