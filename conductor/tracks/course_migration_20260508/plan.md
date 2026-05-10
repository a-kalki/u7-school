# План реализации `course_migration_20260508`

## Фаза 1: Фундамент — настройки, общие типы, очистка

- [x] Task: Настроить `package.json` (exports, imports, `@u7/core` deps) `6ee98cc`
- [x] Task: Удалить все старые файлы модуля `course` `3e49082`
    - [x] Удалить `src/domain/` (course, lesson, module, project, shared)
    - [x] Удалить `src/api/` (commands, course, user, shared, controllers, main.ts, integration.test.ts)
    - [x] Удалить `src/index.ts`, `src/index.test.ts`
- [x] Task: Создать общие типы — `Status` enum и `StatusSchema` (`domain/status.ts`) `ddfa9bf`
    - [x] Написать тесты для `StatusSchema`
    - [x] Реализовать `Status` enum и `StatusSchema`
- [x] Task: Создать `domain/types.ts` (вспомогательные типы уровня модуля) `40c249c`
- [x] Task: Создать `domain/module.ts` (`CourseModuleMeta`, `CourseApiModuleResolver`) `f5c6f66`
- [x] Task: Создать `domain/facade.ts` (интерфейс `UserFacade`) `d9d01b7`
- [ ] Task: Conductor - User Manual Verification 'Фундамент' (Protocol in workflow.md)

## Фаза 2: Агрегат FileMetadata (Domain)

- [x] Task: Создать `domain/file-metadata/entity.ts` (`FileMetadataSchema`, `FileMetadata`, `FileMetadataArMeta`) `a79d229`
    - [x] Написать тесты для `FileMetadataSchema`
    - [x] Реализовать схему и тип
- [x] Task: Создать `domain/file-metadata/a-root.ts` (`FileMetadataAr`) `a79d229`
    - [x] Написать тесты для `FileMetadataAr`
    - [x] Реализовать агрегат с фабричным методом `create()`
- [x] Task: Создать `domain/file-metadata/policy.ts` (`FileMetadataPolicy`) `a79d229`
    - [x] Написать тесты для `FileMetadataPolicy`
    - [x] Реализовать политику (canCreate: ADMIN/MENTOR, canRead: все, canEdit: ADMIN или автор)
- [x] Task: Создать `domain/file-metadata/repo.ts` (интерфейс `FileMetadataRepo`) `a79d229`
- [x] Task: Создать `domain/file-metadata/types.ts` `a79d229`
- [x] Task: Создать `domain/file-metadata/errors.ts` (доменные ошибки агрегата) `a79d229`
- [x] Task: Создать команды `domain/file-metadata/commands/` `a79d229`
    - [x] `create-file-metadata-cmd.ts` (схема, тип, мета, ошибки)
    - [x] `get-file-metadata-cmd.ts`
    - [x] `errors.ts` (атомарные ошибки UC + union)
- [ ] Task: Conductor - User Manual Verification 'FileMetadata' (Protocol in workflow.md)

## Фаза 3: Агрегат Step (Domain)

- [x] Task: Создать `domain/step/entity.ts` (`StepSchema`, `Step`, `StepArMeta`) — variant text/code/file `9b5dc92`
    - [x] Написать тесты для `StepSchema`
    - [x] Реализовать схему (включая варианты) и тип
- [x] Task: Создать `domain/step/a-root.ts` (`StepAr`) `9b5dc92`
    - [x] Написать тесты для `StepAr`
    - [x] Реализовать агрегат с фабричным методом `create()`
- [x] Task: Создать `domain/step/policy.ts` (`StepPolicy`) — делегирует редактирование CoursePolicy `9b5dc92`
    - [x] Написать тесты для `StepPolicy`
    - [x] Реализовать политику
- [x] Task: Создать `domain/step/repo.ts` (интерфейс `StepRepo`) `9b5dc92`
- [x] Task: Создать `domain/step/types.ts` `9b5dc92`
- [x] Task: Создать `domain/step/errors.ts` `9b5dc92`
- [x] Task: Создать команды `domain/step/commands/` `9b5dc92`
    - [x] `create-step-cmd.ts`
    - [x] `get-step-cmd.ts`
    - [x] `errors.ts`
- [ ] Task: Conductor - User Manual Verification 'Step' (Protocol in workflow.md)

## Фаза 4: Агрегат Lesson (Domain)

- [ ] Task: Создать `domain/lesson/entity.ts` (`LessonSchema`, `Lesson`, `LessonArMeta`)
    - [ ] Написать тесты для `LessonSchema`
    - [ ] Реализовать схему и тип
- [ ] Task: Создать `domain/lesson/a-root.ts` (`LessonAr`)
    - [ ] Написать тесты для `LessonAr`
    - [ ] Реализовать агрегат с фабричным методом `create()`
- [ ] Task: Создать `domain/lesson/policy.ts` (`LessonPolicy`) — делегирует редактирование CoursePolicy
    - [ ] Написать тесты для `LessonPolicy`
    - [ ] Реализовать политику
- [ ] Task: Создать `domain/lesson/repo.ts` (интерфейс `LessonRepo`)
- [ ] Task: Создать `domain/lesson/types.ts`
- [ ] Task: Создать `domain/lesson/errors.ts`
- [ ] Task: Создать команды `domain/lesson/commands/`
    - [ ] `create-lesson-cmd.ts`
    - [ ] `get-lesson-cmd.ts`
    - [ ] `errors.ts`
- [ ] Task: Conductor - User Manual Verification 'Lesson' (Protocol in workflow.md)

## Фаза 5: Агрегат Course (Domain)

- [ ] Task: Создать `domain/course/entity.ts` — Course + Module + Project схемы и типы
    - [ ] Написать тесты для `CourseSchema` (включая variants)
    - [ ] Написать тесты для `ModuleSchema`
    - [ ] Написать тесты для `ProjectSchema`
    - [ ] Реализовать все схемы и `CourseArMeta`
- [ ] Task: Создать `domain/course/a-root.ts` (`CourseAr`)
    - [ ] Написать тесты для `CourseAr`
    - [ ] Реализовать агрегат с фабричным методом `create()`
- [ ] Task: Создать `domain/course/policy.ts` (`CoursePolicy`)
    - [ ] Написать тесты для `CoursePolicy`
    - [ ] Реализовать политику (canCreate: ADMIN/MENTOR, canRead: все, canEdit: ADMIN или автор)
- [ ] Task: Создать `domain/course/repo.ts` (интерфейс `CourseRepo` + `CourseListFilter`)
- [ ] Task: Создать `domain/course/types.ts`
- [ ] Task: Создать `domain/course/errors.ts`
- [ ] Task: Создать команды `domain/course/commands/`
    - [ ] `create-course-cmd.ts`
    - [ ] `get-course-cmd.ts`
    - [ ] `list-courses-cmd.ts`
    - [ ] `errors.ts`
- [ ] Task: Conductor - User Manual Verification 'Course' (Protocol in workflow.md)

## Фаза 6: Domain — сборка слоя

- [ ] Task: Создать `domain/index.ts` — реэкспорт всех агрегатов, типов, команд
- [ ] Task: Conductor - User Manual Verification 'Domain сборка' (Protocol in workflow.md)

## Фаза 7: Infra — реализации репозиториев и фасада

- [ ] Task: Создать `infra/db/course-json-repo.ts` (`CourseJsonRepo`)
    - [ ] Написать тесты для `CourseJsonRepo`
    - [ ] Реализовать на основе `JsonFileRepo`
- [ ] Task: Создать `infra/db/lesson-json-repo.ts` (`LessonJsonRepo`)
    - [ ] Написать тесты для `LessonJsonRepo`
    - [ ] Реализовать на основе `JsonFileRepo`
- [ ] Task: Создать `infra/db/step-json-repo.ts` (`StepJsonRepo`)
    - [ ] Написать тесты для `StepJsonRepo`
    - [ ] Реализовать на основе `JsonFileRepo`
- [ ] Task: Создать `infra/db/file-metadata-json-repo.ts` (`FileMetadataJsonRepo`)
    - [ ] Написать тесты для `FileMetadataJsonRepo`
    - [ ] Реализовать на основе `JsonFileRepo`
- [ ] Task: Создать `infra/user-in-proc-facade.ts` (`UserInProcFacade`)
    - [ ] Написать тесты для `UserInProcFacade`
    - [ ] Реализовать фасад (принимает `UserApiModule`, делегирует вызовы)
- [ ] Task: Создать `infra/index.ts` — реэкспорт
- [ ] Task: Conductor - User Manual Verification 'Infra' (Protocol in workflow.md)

## Фаза 8: API — Use-case'ы и модуль

- [ ] Task: Создать `api/course-uc.ts` — базовый `CourseUseCase` (аналог `UserUseCase`)
- [ ] Task: Создать `api/course/create-course-uc.ts`
    - [ ] Написать тесты
    - [ ] Реализовать
- [ ] Task: Создать `api/course/get-course-uc.ts`
    - [ ] Написать тесты
    - [ ] Реализовать
- [ ] Task: Создать `api/course/list-courses-uc.ts`
    - [ ] Написать тесты
    - [ ] Реализовать
- [ ] Task: Создать `api/lesson/create-lesson-uc.ts`
    - [ ] Написать тесты
    - [ ] Реализовать
- [ ] Task: Создать `api/lesson/get-lesson-uc.ts`
    - [ ] Написать тесты
    - [ ] Реализовать
- [ ] Task: Создать `api/step/create-step-uc.ts`
    - [ ] Написать тесты
    - [ ] Реализовать
- [ ] Task: Создать `api/step/get-step-uc.ts`
    - [ ] Написать тесты
    - [ ] Реализовать
- [ ] Task: Создать `api/file-metadata/create-file-metadata-uc.ts`
    - [ ] Написать тесты
    - [ ] Реализовать
- [ ] Task: Создать `api/file-metadata/get-file-metadata-uc.ts`
    - [ ] Написать тесты
    - [ ] Реализовать
- [ ] Task: Создать `api/module.ts` — `CourseApiModule`
    - [ ] Написать тесты для модуля
    - [ ] Реализовать модуль (регистрация всех UC)
- [ ] Task: Создать `api/index.ts` — реэкспорт
- [ ] Task: Conductor - User Manual Verification 'API' (Protocol in workflow.md)

## Фаза 9: UI — AutoUI и интеграция с u7-cli

- [ ] Task: Создать `ui/auto-ui/module.ts` (`CourseAutoUiModule`)
- [ ] Task: Создать `ui/auto-ui/controller/cli.ts` (`CourseCliController`)
    - [ ] Написать тесты
    - [ ] Реализовать контроллер
- [ ] Task: Создать `ui/index.ts` — реэкспорт
- [ ] Task: Создать `src/index.ts` — реэкспорт всех слоёв
- [ ] Task: Подключить модуль `course` к `u7-cli`
- [ ] Task: Conductor - User Manual Verification 'UI и интеграция' (Protocol in workflow.md)

## Фаза 10: Финальная проверка

- [ ] Task: Запустить `bun run check` и исправить все ошибки
- [ ] Task: Проверить покрытие тестов (`bun test --coverage`), добиться >80%
- [ ] Task: Conductor - User Manual Verification 'Финальная проверка' (Protocol in workflow.md)
