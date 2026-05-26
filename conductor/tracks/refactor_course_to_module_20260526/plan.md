# План реализации: refactor_course_to_module_20260526

## Фаза 0: Переименование файлов и директорий

- [x] Task: (6235043) Переименовать директорию domain/course → domain/module
    - [x] `mv packages/course/src/domain/course packages/course/src/domain/module`

- [x] Task: (6235043) Переименовать директорию api/course → api/module
    - [x] `mv packages/course/src/api/course packages/course/src/api/module`

- [x] Task: (6235043) Переименовать и удалить файлы
    - [x] `domain/course-ds.ts` → `domain/module-ds.ts`
    - [x] `api/course-uc.ts` → `api/module-uc.ts`
    - [x] `infra/db/course-json-repo.ts` → `infra/db/module-json-repo.ts`
    - [x] Удалить `domain/module/commands/add-module-cmd.ts`
    - [x] Удалить `domain/module/commands/add-project-to-module-cmd.ts`
    - [x] Удалить `api/module/add-module-uc.ts` и его тест
    - [x] Удалить `api/module/add-project-to-module-uc.ts` и его тест

- [x] Task: Conductor - User Manual Verification 'Переименование файлов' (Protocol in workflow.md)

---

## Фаза 1: Упрощение схемы entity (без kind)

- [~] Task: Написать тесты для новой ModuleSchema
    - [ ] Тест: ModuleSchema валидирует объект с полями Common + projects
    - [ ] Тест: ModuleSchema НЕ содержит поле kind
    - [ ] Тест: ModuleSchema отклоняет объект без projects

- [ ] Task: Реализовать ModuleSchema без kind
    - [ ] Удалить `ModuleSchema` (старый value-object), `CourseCommonSchema`, discriminated union
    - [ ] Переименовать `CourseCommonSchema` → `ModuleSchema`, добавить `projects: v.array(ProjectSchema)`
    - [ ] Удалить типы `CourseModules`, `CourseProjects`, `CourseKind`
    - [ ] Тип `Course` → `Module`

- [ ] Task: Conductor - User Manual Verification 'Упрощение схемы' (Protocol in workflow.md)

---

## Фаза 2: Переименование агрегата CourseAr → ModuleAr

- [ ] Task: Написать тесты для ModuleAr.create (без kind)
    - [ ] Тест: create() не принимает kind, создаёт с projects: []
    - [ ] Тест: create() устанавливает status = DRAFT

- [ ] Task: Реализовать ModuleAr.create без kind
    - [ ] `CourseAr` → `ModuleAr`, `arName = 'Module'`, `arLabel = 'Модуль'`
    - [ ] Убрать параметр `kind` из `create()`

- [ ] Task: Написать тесты для упрощённых методов
    - [ ] Тест: addProject добавляет проект в корневые проекты
    - [ ] Тест: getProject ищет только в this.state.projects
    - [ ] Тест: filterPublished фильтрует только корневые проекты

- [ ] Task: Упростить методы ModuleAr
    - [ ] Удалить `addModule()`, `addProjectToModule()`, `publishModule()`
    - [ ] Упростить `getProject()` — искать только в `this.state.projects`
    - [ ] Упростить `#filterPublished()` — фильтровать только `this.state.projects`
    - [ ] Проверить `enrich()`, `publish()`, `publishProject()`, `addLessonToProject()`, `getLessons()`

- [ ] Task: Conductor - User Manual Verification 'Агрегат ModuleAr' (Protocol in workflow.md)

---

## Фаза 3: Переименование команд и чистка

- [ ] Task: Обновить команды (переименование + удаление kind)
    - [ ] `create-course-cmd.ts` → `create-module-cmd.ts` — убрать `kind`
    - [ ] `enrich-course-cmd.ts` → `enrich-module-cmd.ts`
    - [ ] `get-course-cmd.ts` → `get-module-cmd.ts`
    - [ ] `list-courses-cmd.ts` → `list-modules-cmd.ts`
    - [ ] `publish-course-cmd.ts` → `publish-module-cmd.ts`
    - [ ] `add-project-cmd.ts` — обновить импорты
    - [ ] `errors.ts` — `CourseAccessDeniedUcError` → `ModuleAccessDeniedUcError`, `CourseNotFoundUcError` → `ModuleNotFoundUcError`, `CourseModuleError` → `ModuleModuleError`

- [ ] Task: Conductor - User Manual Verification 'Команды' (Protocol in workflow.md)

---

## Фаза 4: Snapshot API — CourseDs + Фасад + UseCase

- [ ] Task: Написать тесты для CourseDs.buildSnapshot
    - [ ] Тест: собирает проекты с lessonIds и stepIds
    - [ ] Тест: при пустом projects возвращает []
    - [ ] Тест: порядок проектов сохраняется

- [ ] Task: Реализовать CourseDs.buildSnapshot
    - [ ] Файл `module-ds.ts`, класс `CourseDs`
    - [ ] Добавить тип `ContentSnapshot` в `domain/types.ts`
    - [ ] Метод `buildSnapshot(module: Module, lessons: Lesson[]): ContentSnapshot`

- [ ] Task: Написать тесты для get-module-snapshot-uc
    - [ ] Тест: возвращает полный снимок (проекты → уроки → stepIds)
    - [ ] Тест: выбрасывает ошибку если модуль не найден
    - [ ] Тест: выбрасывает ошибку если нет доступа

- [ ] Task: Реализовать get-module-snapshot-uc
    - [ ] `domain/module/commands/get-module-snapshot-cmd.ts` — команда и метатип
    - [ ] `api/module/get-module-snapshot-uc.ts` — use case
    - [ ] Собирает уроки и шаги через репозитории, вызывает `CourseDs.buildSnapshot()`

- [ ] Task: Создать фасадный интерфейс CourseFacade
    - [ ] `domain/facade.ts` — `CourseFacade` интерфейс с методом `getModuleSnapshot(moduleId: string): Promise<ContentSnapshot>`

- [ ] Task: Реализовать CourseInProcFacade
    - [ ] `infra/course-in-proc-facade.ts` — реализация через резолвер (репозитории + CourseDs)
    - [ ] Тест для фасада

- [ ] Task: Conductor - User Manual Verification 'Snapshot API' (Protocol in workflow.md)

---

## Фаза 5: Переименование API слоя

- [ ] Task: Обновить базовый класс CourseUseCase (имя класса не менять)
    - [ ] `api/course-uc.ts` — обновить импорты, методы `getCourse` → `getModule`, `getOutCourse` → `getOutModule`
    - [ ] Обновить все импорты в use cases

- [ ] Task: Обновить use cases
    - [ ] `create-course-uc.ts` → `create-module-uc.ts` — убрать kind
    - [ ] `enrich-course-uc.ts` → `enrich-module-uc.ts`
    - [ ] `get-course-uc.ts` → `get-module-uc.ts`
    - [ ] `list-courses-uc.ts` → `list-modules-uc.ts`
    - [ ] `publish-course-uc.ts` → `publish-module-uc.ts`
    - [ ] `add-project-uc.ts` — обновить импорты
    - [ ] Добавить `get-module-snapshot-uc.ts` в список

- [ ] Task: Обновить api/module.ts (ApiModule)
    - [ ] `CourseApiModule` → `ModuleApiModule`
    - [ ] Обновить список useCases
    - [ ] `domain/module.ts`: `CourseApiModuleMeta` → `ModuleApiModuleMeta`, `CourseApiModuleResolver` → `ModuleApiModuleResolver`, `CourseUcMetas` → `ModuleUcMetas`

- [ ] Task: Conductor - User Manual Verification 'API слой' (Protocol in workflow.md)

---

## Фаза 6: Инфра-слой и финальная сборка

- [ ] Task: Обновить инфра-слой
    - [ ] `module-json-repo.ts` — `Course` → `Module`, обновить схему, тесты
    - [ ] `course-in-proc-facade.ts` — реализация фасада, тест
    - [ ] `infra/index.ts` — обновить экспорт

- [ ] Task: Обновить repo.ts
    - [ ] `CourseRepo` → `ModuleRepo`, `CourseListFilter` → `ModuleListFilter`, убрать `kind`

- [ ] Task: Обновить публичные экспорты
    - [ ] `domain/index.ts` — полный реэкспорт с новыми именами
    - [ ] `src/index.ts` — реэкспорт
    - [ ] Проверить импорты из других пакетов

- [ ] Task: Обновить все тесты в вертикали
    - [ ] `domain/module/a-root.test.ts`, `entity.test.ts`, `policy.test.ts`
    - [ ] `api/module.test.ts`, все use case тесты
    - [ ] `infra/db/module-json-repo.test.ts`

- [ ] Task: Conductor - User Manual Verification 'Инфра-слой и сборка' (Protocol in workflow.md)

---

## Фаза 7: Обновление трека stream_domain_20260526

- [ ] Task: Обновить stream_domain_20260526/spec.md
    - [ ] Удалить `targetType`, оставить всегда course (module)
    - [ ] `CourseAr` → `ModuleAr`, ссылаться на `ContentSnapshot` и `CourseFacade` из `@u7-scl/course`
    - [ ] Обновить модель данных Stream

- [ ] Task: Обновить stream_domain_20260526/plan.md
    - [ ] Синхронизировать задачи с обновлённой spec

- [ ] Task: Conductor - User Manual Verification 'Обновление трека stream' (Protocol in workflow.md)

---

## Фаза 8: Контроль качества

- [ ] Task: Запустить полную проверку качества
    - [ ] `bun test` — все тесты проходят
    - [ ] `bun run lint` — нет ошибок Biome
    - [ ] `bun run tslint` — нет ошибок типов
    - [ ] `bun test --coverage` — покрытие >80%

- [ ] Task: Проверить импорты во всех пакетах
    - [ ] `packages/user`, `packages/onboarding`, `apps/*`

- [ ] Task: Conductor - User Manual Verification 'Контроль качества' (Protocol in workflow.md)
