# План реализации: Архитектурные улучшения ядра и сервисного слоя

## Фаза 1: Улучшения базового класса Aggregate (`@u7/core`)

- [ ] Task: Добавить `arName()` и `arLabel()` в базовый `Aggregate`
    - [ ] Написать тесты на статические методы `arName()`/`arLabel()` (RED)
    - [ ] Реализовать `static arName()`, `static arLabel()` с throw по умолчанию (GREEN)
    - [ ] Написать тесты на `throwInternal()` (RED)
    - [ ] Создать `DomainError` в `@u7/core/domain/`
    - [ ] Реализовать `protected throwInternal(message)` (GREEN)

- [ ] Task: Добавить `safeUpdate()` в базовый `Aggregate`
    - [ ] Написать тесты на `safeUpdate()` — пропуск undefined, защита safeAttrs (RED)
    - [ ] Реализовать `protected safeUpdate()` и `protected safeAttrs` (GREEN)

- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: Рефакторинг UseCase (`@u7/core`)

- [ ] Task: Очистить `UseCase` и `UcMeta`
    - [ ] Написать тесты на новый `ArClass` (RED)
    - [ ] Удалить `arName`, `arLabel` из `UseCase`
    - [ ] Добавить `abstract ArClass: typeof Aggregate<UcMeta["arMeta"]>`
    - [ ] Удалить `description` из `UcMeta`, оставить как `protected description: string`
    - [ ] Адаптировать все существующие UseCase под новый контракт (GREEN)

- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Применение в агрегатах (все пакеты)

- [ ] Task: Переименовать `arName` во всех агрегатах
    - [ ] `UserAr.arName()` → `"User"`, `arLabel()` → `"Пользователь"`
    - [ ] `CourseAr.arName()` → `"Course"`, `arLabel()` → `"Курс"`
    - [ ] `LessonAr.arName()` → `"Lesson"`, `arLabel()` → `"Урок"`
    - [ ] `StepAr.arName()` → `"Step"`, `arLabel()` → `"Шаг"`
    - [ ] Обновить типы `ArMeta["name"]` (литералы) и `ArMeta["label"]`

- [ ] Task: Заменить `throw new Error` на `this.throwInternal` во всех агрегатах
    - [ ] `UserAr` — заменить все Error на throwInternal
    - [ ] `CourseAr` — заменить все Error на throwInternal
    - [ ] `LessonAr` — заменить все Error на throwInternal
    - [ ] `StepAr` — заменить все Error на throwInternal

- [ ] Task: Применить `safeUpdate` во всех агрегатах
    - [ ] `CourseAr` — все методы с частичным обновлением (enrich, возможно другие) переписать на `safeUpdate`
    - [ ] `UserAr` — проверить методы на частичное обновление, применить safeUpdate
    - [ ] `LessonAr` — проверить методы на частичное обновление, применить safeUpdate
    - [ ] `StepAr` — проверить методы на частичное обновление, применить safeUpdate

- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)

## Фаза 4: BaseJsonDb с транзакциями (`@u7/core`)

- [ ] Task: Создать `BaseJsonDb`
    - [ ] Написать тесты: begin→commit (сохранено), begin→rollback (не изменено) (RED)
    - [ ] Реализовать `BaseJsonDb` с `begin()`, `commit()`, `rollback()` (GREEN)

- [ ] Task: Интегрировать `BaseJsonDb` с `JsonFileRepo`
    - [ ] Изменить `JsonFileRepo` — принимать `BaseJsonDb` + имя коллекции
    - [ ] Обновить все реализации JsonRepo (user, course, lesson, step)

- [ ] Task: Интегрировать `Db` в resolver и модули
    - [ ] Создать `CourseDb` — один экземпляр на модуль, знает все Repo
    - [ ] Передать `CourseDb` в resolver
    - [ ] Адаптировать тесты фасадов под новую структуру

- [ ] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)

## Фаза 5: Domain Service

- [ ] Task: Создать `CourseDs`
    - [ ] Написать тесты на `CourseDs.createLesson()` (RED)
    - [ ] Написать тесты на `CourseDs.createStep()` (RED)
    - [ ] Создать `course/src/domain/course-ds.ts` с классом `CourseDs`
    - [ ] Реализовать `createLesson(course, cmd, projectId)` (GREEN)
    - [ ] Реализовать `createStep(lesson, cmd)` (GREEN)

- [ ] Task: Добавить `LessonAr.addStep(stepId)`
    - [ ] Написать тесты на `addStep()` (RED)
    - [ ] Реализовать метод (GREEN)

- [ ] Task: Обновить `create-lesson-uc` для использования Ds + транзакций
    - [ ] Обновить тесты usecase (RED)
    - [ ] UseCase загружает CourseAr, вызывает Ds, сохраняет оба агрегата в транзакции (GREEN)

- [ ] Task: Обновить `create-step-uc` для использования Ds + транзакций
    - [ ] Обновить тесты usecase (RED)
    - [ ] UseCase загружает LessonAr, вызывает Ds, сохраняет оба агрегата в транзакции (GREEN)

- [ ] Task: Conductor - User Manual Verification 'Фаза 5' (Protocol in workflow.md)

## Фаза 6: Удаление поля `order`

- [ ] Task: Удалить `order` из всех сущностей и value-objects
    - [ ] `Module` (course/entity.ts) — удалить `order`
    - [ ] `Project` (course/entity.ts) — удалить `order`
    - [ ] `Lesson` (lesson/entity.ts) — удалить `order`
    - [ ] `Step` (step/entity.ts) — удалить `order`

- [ ] Task: Обновить Valibot-схемы
    - [ ] Удалить `order` из всех схем (ModuleSchema, ProjectSchema, LessonSchema, StepSchema)
    - [ ] Удалить `order` из всех команд (create, enrich)

- [ ] Task: Переписать логику, полагавшуюся на `order`
    - [ ] Удалить `getNextLessonOrderNum()`, заменить на `project.lessonIds.length`
    - [ ] Удалить `getNextStepOrderNum()`, заменить на `lesson.stepIds.length`
    - [ ] Обновить `CourseAr` — вычисление порядка через индекс массива
    - [ ] Обновить `getVisibleFor` и сортировки

- [ ] Task: Исправить все тесты после удаления `order`
    - [ ] Тесты CourseAr
    - [ ] Тесты LessonAr
    - [ ] Тесты StepAr
    - [ ] Тесты UseCase (create, get, list)

- [ ] Task: Conductor - User Manual Verification 'Фаза 6' (Protocol in workflow.md)

## Фаза 7: Документация

- [ ] Task: Создать `conductor/code_styleguides/skills/domain-service.md`
- [ ] Task: Обновить `ddd-domain/SKILL.md` — добавить ссылки на `facade.md` и `domain-service.md`
- [ ] Task: Обновить `ddd-infra/SKILL.md` — добавить правила работы с Db/Repo
- [ ] Task: Обновить `ddd-naming/SKILL.md` — добавить `Ds` класс в таблицу шаблонов

- [ ] Task: Conductor - User Manual Verification 'Фаза 7' (Protocol in workflow.md)
