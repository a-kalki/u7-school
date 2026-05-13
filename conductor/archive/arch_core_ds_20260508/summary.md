# Итоговый отчёт трека arch_core_ds_20260508

## Статус
✅ Завершён. Все 7 фаз выполнены. 482 теста проходят (2 pre-existing failure, без изменений).

## Что сделано

### FR1: BaseJsonDb с транзакциями
- `packages/core/src/infra/base-json-db.ts` — новый класс с `begin()/commit()/rollback()`
- `JsonFileRepo` — опциональная поддержка `BaseJsonDb`
- `CourseApiModuleResolver` — +`db?: BaseJsonDb`

### FR2: Domain Service (Ds)
- `packages/course/src/domain/course-ds.ts` — `CourseDs` с методами `createLesson()`, `createStep()`
- `CourseAr.getProject()`, `addLessonToProject()`, `getLessons()`
- `LessonAr.addStep()`
- `create-lesson-uc` переписан на Ds + транзакции

### FR3: Aggregate.safeUpdate()
- `Aggregate.safeUpdate(partial)` — обновляет только не-undefined поля
- `Aggregate.safeAttrs = ["uuid", "updatedAt"]` — защищённые поля
- `CourseAr.enrich()` переписан на `safeUpdate`

### FR4: throwInternal + arName/arLabel
- `Aggregate.throwInternal(message)` — бросает `DomainError` с `aggregateName`
- `static arName()`, `static arLabel()` в базовом `Aggregate`
- Все агрегаты: 11× `throw new Error` → `this.throwInternal`
- `DomainError` тип и `errDomain()` фабрика в `@u7/core`

### FR5: Переименование arName
- `"user"→"User"`, `"course"→"Course"`, `"lesson"→"Lesson"`, `"step"→"Step"`

### FR6: Рефакторинг UseCase
- Удалены `arName`, `arLabel` из `UseCase`
- Добавлен `abstract ArClass: typeof Aggregate`
- Удалён `description` из `UcMeta`
- Все usecase (17 файлов) адаптированы

### FR7: Удаление поля `order`
- Удалён из Module, Project, Lesson, Step схем и агрегатов
- Порядок — позиция в массиве
- Удалён `Order` тип, `getNextLessonOrderNum()`, `getNextStepOrderNum()`

### FR8: Course ↔ Lesson/Step (Domain Service)
- `CourseDs.createLesson()` и `createStep()` координируют агрегаты
- `create-lesson-uc` использует Ds + транзакционное сохранение
- `CreateLessonCmd` +`projectId`

### Документация
- Новый: `conductor/code_styleguides/skills/domain-service.md`
- Обновлены: `ddd-domain/SKILL.md`, `ddd-infra/SKILL.md`, `ddd-naming/SKILL.md`

## Статистика
- **110 файлов** изменено
- **+2510 / −2098** строк
- **482 теста** проходят, 2 fail (pre-existing), 1 error (pre-existing)
