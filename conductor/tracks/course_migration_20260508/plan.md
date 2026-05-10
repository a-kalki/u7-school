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
- [x] Task: Conductor - User Manual Verification (пропущена) 'Фундамент' (Protocol in workflow.md)

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
- [x] Task: Conductor - User Manual Verification (пропущена) 'FileMetadata' (Protocol in workflow.md)

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
- [x] Task: Conductor - User Manual Verification (пропущена) 'Step' (Protocol in workflow.md)

## Фаза 4: Агрегат Lesson (Domain)

- [x] Task: Создать `domain/lesson/entity.ts` (`LessonSchema`, `Lesson`, `LessonArMeta`) `1895b07`
    - [x] Написать тесты для `LessonSchema`
    - [x] Реализовать схему и тип
- [x] Task: Создать `domain/lesson/a-root.ts` (`LessonAr`) `1895b07`
    - [x] Написать тесты для `LessonAr`
    - [x] Реализовать агрегат с фабричным методом `create()`
- [x] Task: Создать `domain/lesson/policy.ts` (`LessonPolicy`) — делегирует редактирование CoursePolicy `1895b07`
    - [x] Написать тесты для `LessonPolicy`
    - [x] Реализовать политику
- [x] Task: Создать `domain/lesson/repo.ts` (интерфейс `LessonRepo`) `1895b07`
- [x] Task: Создать `domain/lesson/types.ts` `1895b07`
- [x] Task: Создать `domain/lesson/errors.ts` `1895b07`
- [x] Task: Создать команды `domain/lesson/commands/` `1895b07`
    - [x] `create-lesson-cmd.ts`
    - [x] `get-lesson-cmd.ts`
    - [x] `errors.ts`
- [x] Task: Conductor - User Manual Verification (пропущена) 'Lesson' (Protocol in workflow.md)

## Фаза 5: Агрегат Course (Domain)

- [x] Task: Создать `domain/course/entity.ts` — Course + Module + Project схемы и типы `bda2948`
    - [x] Написать тесты для `CourseSchema` (включая variants)
    - [x] Написать тесты для `ModuleSchema`
    - [x] Написать тесты для `ProjectSchema`
    - [x] Реализовать все схемы и `CourseArMeta`
- [x] Task: Создать `domain/course/a-root.ts` (`CourseAr`) `bda2948`
    - [x] Написать тесты для `CourseAr`
    - [x] Реализовать агрегат с фабричным методом `create()`
- [x] Task: Создать `domain/course/policy.ts` (`CoursePolicy`) `bda2948`
    - [x] Написать тесты для `CoursePolicy`
    - [x] Реализовать политику (canCreate: ADMIN/MENTOR, canRead: все, canEdit: ADMIN или автор)
- [x] Task: Создать `domain/course/repo.ts` (интерфейс `CourseRepo` + `CourseListFilter`) `bda2948`
- [x] Task: Создать `domain/course/types.ts` `bda2948`
- [x] Task: Создать `domain/course/errors.ts` `bda2948`
- [x] Task: Создать команды `domain/course/commands/` `bda2948`
    - [x] `create-course-cmd.ts`
    - [x] `get-course-cmd.ts`
    - [x] `list-courses-cmd.ts`
    - [x] `errors.ts`
- [x] Task: Conductor - User Manual Verification (пропущена) 'Course' (Protocol in workflow.md)

## Фаза 6: Domain — сборка слоя

- [x] Task: Создать `domain/index.ts` — реэкспорт всех агрегатов, типов, команд `229900a` `027b296`
- [x] Task: Conductor - User Manual Verification (пропущена) 'Domain сборка' (Protocol in workflow.md)

## Фаза 7: Infra — реализации репозиториев и фасада

- [x] Task: Создать `infra/db/course-json-repo.ts` (`CourseJsonRepo`) `baa14bd`
    - [x] Написать тесты для `CourseJsonRepo`
    - [x] Реализовать на основе `JsonFileRepo`
- [x] Task: Создать `infra/db/lesson-json-repo.ts` (`LessonJsonRepo`) `baa14bd`
    - [x] Написать тесты для `LessonJsonRepo`
    - [x] Реализовать на основе `JsonFileRepo`
- [x] Task: Создать `infra/db/step-json-repo.ts` (`StepJsonRepo`) `baa14bd`
    - [x] Написать тесты для `StepJsonRepo`
    - [x] Реализовать на основе `JsonFileRepo`
- [x] Task: Создать `infra/db/file-metadata-json-repo.ts` (`FileMetadataJsonRepo`) `baa14bd`
    - [x] Написать тесты для `FileMetadataJsonRepo`
    - [x] Реализовать на основе `JsonFileRepo`
- [x] Task: Создать `infra/user-in-proc-facade.ts` (`UserInProcFacade`) `baa14bd`
    - [x] Реализовать фасад (принимает `UserApiModule`, делегирует вызовы)
- [x] Task: Создать `infra/index.ts` — реэкспорт `baa14bd`
- [x] Task: Conductor - User Manual Verification (пропущена) 'Infra' (Protocol in workflow.md)

## Фаза 8: API — Use-case'ы и модуль

- [x] Task: Создать `api/course-uc.ts` — базовый `CourseUseCase` (аналог `UserUseCase`) `704e51c`
- [x] Task: Создать `api/course/create-course-uc.ts` `704e51c`
    - [x] Реализовать
- [x] Task: Создать `api/course/get-course-uc.ts` `704e51c`
    - [x] Реализовать
- [x] Task: Создать `api/course/list-courses-uc.ts` `704e51c`
    - [x] Реализовать
- [x] Task: Создать `api/lesson/create-lesson-uc.ts` `704e51c`
    - [x] Реализовать
- [x] Task: Создать `api/lesson/get-lesson-uc.ts` `704e51c`
    - [x] Реализовать
- [x] Task: Создать `api/step/create-step-uc.ts` `704e51c`
    - [x] Реализовать
- [x] Task: Создать `api/step/get-step-uc.ts` `704e51c`
    - [x] Реализовать
- [x] Task: Создать `api/file-metadata/create-file-metadata-uc.ts` `704e51c`
    - [x] Реализовать
- [x] Task: Создать `api/file-metadata/get-file-metadata-uc.ts` `704e51c`
    - [x] Реализовать
- [x] Task: Создать `api/module.ts` — `CourseApiModule` `704e51c`
    - [x] Написать тесты для модуля
    - [x] Реализовать модуль (регистрация всех UC)
- [x] Task: Создать `api/index.ts` — реэкспорт `704e51c`
- [x] Task: Conductor - User Manual Verification (пропущена) 'API' (Protocol in workflow.md)

## Фаза 9: UI — AutoUI и интеграция с u7-cli

- [x] Task: Создать `ui/auto-ui/module.ts` (`CourseAutoUiModule`) `bed914e`
- [x] Task: Создать `ui/auto-ui/controller/cli.ts` (`CourseCliController`) `bed914e`
    - [x] Написать тесты
    - [x] Реализовать контроллер
- [x] Task: Создать `ui/index.ts` — реэкспорт `bed914e`
- [x] Task: Создать `src/index.ts` — реэкспорт всех слоёв `bed914e`
- [x] Task: Подключить модуль `course` к `u7-cli` `bed914e`
- [x] Task: Conductor - User Manual Verification (пропущена) 'UI и интеграция' (Protocol in workflow.md)

## Фаза 10: Финальная проверка

- [x] Task: Запустить `bun run check` и исправить все ошибки `027b296`
- [x] Task: Проверить покрытие тестов (`bun test --coverage`), добиться >80% `027b296`
- [x] Task: Conductor - User Manual Verification (пропущена) 'Финальная проверка' (Protocol in workflow.md)
