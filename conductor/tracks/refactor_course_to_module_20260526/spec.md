# Refactor: course → module, упрощение агрегата, Snapshot API

## Обзор

Рефакторинг модуля `@u7-scl/course`:
1. Из агрегата удаляется вариант `kind: 'modules'`, оставляются только проекты
2. Дискриминатор `kind` полностью убирается, `CourseCommonSchema` становится единственной схемой
3. Тотальное переименование: `course/Course/CourseAr` → `module/Module/ModuleAr` (сущность, агрегат, политика, репо, команды, use cases)
4. В domain service `CourseDs` добавляется Snapshot API — метод получения полного дерева контента для передачи в stream
5. Создаётся фасад `CourseFacade` для доступа из других модулей
6. Обновляется трек `stream_domain_20260526` (убирается `targetType`, синхронизируется с новым API)

## Функциональные требования

### FR-1: Упрощение схемы сущности
- Удалить `ModuleSchema` (старый value-object) из `entity.ts`
- Удалить поле `kind`, discriminated union (`ModulesCourseSchema`, `ProjectsCourseSchema`)
- `CourseCommonSchema` переименовать в `ModuleSchema` — она становится единственной схемой (без префикса Common)
- Тип `Course` → `Module`; удалить типы `CourseModules`, `CourseProjects`
- `Module` = поля из бывшей `CourseCommonSchema` + `projects: ProjectSchema[]`
- Удалить `CourseKind` из `types.ts`

### FR-2: Тотальное переименование course → module
Переименовать во всей вертикали (имя пакета `@u7-scl/course` и имена уровня модуля `CourseDs`, `CourseFacade` — не трогать):

| Было | Стало |
|---|---|
| `CourseAr` | `ModuleAr` |
| `CourseArMeta` | `ModuleArMeta` |
| `CoursePolicy` | `ModulePolicy` |
| `CourseRepo` | `ModuleRepo` |
| `CourseListFilter` | `ModuleListFilter` |
| `CourseSchema` | `ModuleSchema` |
| `CourseUseCase` (базовый класс) | `ModuleUseCase` |
| `CourseApiModule` | `ModuleApiModule` |
| `CourseApiModuleMeta` | `ModuleApiModuleMeta` |
| `CourseApiModuleResolver` | `ModuleApiModuleResolver` |
| `CourseUcMetas` | `ModuleUcMetas` |
| `CourseAccessDeniedUcError` | `ModuleAccessDeniedUcError` |
| `CourseNotFoundUcError` | `ModuleNotFoundUcError` |
| `CourseModuleError` | `ModuleModuleError` |
| `domain/course/` | `domain/module/` |
| `api/course/` | `api/module/` |
| `infra/db/course-json-repo.ts` | `infra/db/module-json-repo.ts` |
| `api/course-uc.ts` | `api/module-uc.ts` |

**НЕ переименовываются** (уровень модуля):
- `CourseDs` — domain service (остаётся)
- `CourseFacade` — фасад (остаётся)
- `CourseInProcFacade` — реализация фасада (остаётся)

### FR-3: Удаление методов, связанных со старыми modules
- Удалить из `ModuleAr`: `addModule()`, `addProjectToModule()`, `publishModule()`
- Удалить файлы команд: `add-module-cmd.ts`, `add-project-to-module-cmd.ts`
- Удалить use cases: `add-module-uc.ts`, `add-project-to-module-uc.ts` (и их тесты)
- `create()` — убрать параметр `kind`
- `getProject()` — упростить (искать только в корневом `this.state.projects`)
- `#filterPublished()` — упростить (только фильтрация проектов)

### FR-4: Snapshot API
Добавить в `CourseDs` метод `buildSnapshot` и тип `ContentSnapshot`:

```typescript
// domain/types.ts (уровень модуля)
interface ContentSnapshotItem {
  projectId: string;
  projectTitle: string;
  lessons: {
    lessonId: string;
    lessonTitle: string;
    stepIds: string[];
  }[];
}

type ContentSnapshot = ContentSnapshotItem[];
```

- `CourseDs.buildSnapshot(module: Module, lessons: Lesson[]): ContentSnapshot` — собирает дерево проектов
- use case `get-module-snapshot-uc.ts` — собирает уроки/шаги через репозитории, вызывает `CourseDs.buildSnapshot()`
- `CourseFacade.getModuleSnapshot(moduleId: string): Promise<ContentSnapshot>` — фасадный интерфейс
- `CourseInProcFacade` — реализация через резолвер

### FR-5: Обновление репозитория
- `ModuleRepo` — убрать `kind` из `ModuleListFilter`
- `module-json-repo.ts` — обновить JSON-репозиторий под новую схему

### FR-6: Обновление трека stream_domain_20260526
- **spec.md**: убрать `targetType` (больше не нужен — всегда course/projects)
- **spec.md**: заменить `CourseAr` → `ModuleAr`, ссылаться на `ContentSnapshot` и `CourseFacade` из `@u7-scl/course`
- **spec.md**: описать, что `contentSnapshot` при создании потока получается через `CourseFacade.getModuleSnapshot()`
- **plan.md**: синхронизировать с обновлённой спецификацией

## Критерии приёмки

- [ ] `ModuleSchema` — единственная схема, без `kind` и discriminated union
- [ ] `ModuleAr.create()` не принимает `kind`, создаёт курс с `projects: []`
- [ ] Все имена `course`/`Course` заменены на `module`/`Module` в сигнатурах, типах, файлах (кроме `CourseDs`, `CourseFacade`)
- [ ] Удалённые методы и файлы (`addModule`, `addProjectToModule`, `publishModule`) отсутствуют
- [ ] `CourseDs.buildSnapshot()` возвращает корректное дерево проектов
- [ ] `get-module-snapshot-uc` проходит тесты
- [ ] `CourseFacade` определён, `CourseInProcFacade` реализован и протестирован
- [ ] `ModuleListFilter` не содержит поле `kind`
- [ ] Все существующие тесты обновлены и проходят
- [ ] `bun test`, `bun run lint`, `bun run tslint` — без ошибок
- [ ] `stream_domain_20260526/spec.md` и `plan.md` обновлены, `targetType` удалён

## За рамками

- Переименование npm-пакета `@u7-scl/course` (остаётся как есть)
- Изменение структуры `ProjectSchema`
- Изменения в других пакетах (`user`, `onboarding`, `core`, `w3school`)
