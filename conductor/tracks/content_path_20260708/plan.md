# План реализации: ContentPath

> Контекст: `../../architecture-evolution.md` §2.2, `./spec.md`. TDD (Red→Green), см. `conductor/workflow.md`.

## Фаза 1: VO ContentPath

- [ ] Task: Написать тесты ContentPath (parse/serialize/валидация всех partial-форм, ошибочные пути)
- [ ] Task: Реализовать `ContentPath` VO + `ContentPathSchema` в домене `course`
  - [ ] `packages/course/src/domain/content-path.ts`
  - [ ] Export из index
- [ ] Task: Conductor - Ручная верификация 'VO ContentPath'

## Фаза 2: UC resolve-content-path

- [ ] Task: Написать тесты resolve-content-path по ролям
  - [ ] curious: шаги видны, но только заголовки (без content/code)
  - [ ] student: completed — полный контент read-only, current — полный active, будущие — только заголовок (нужен streamId)
  - [ ] mentor: полный доступ
  - [ ] несуществующий путь → NotFound

- [ ] Task: Реализовать UC + команду
  - [ ] `commands/resolve-content-path-cmd.ts`, UC в `packages/course/src/api/`
  - [ ] Резолв индекс→UUID через CourseFacade.getCourseProgram / ContentSnapshot
  - [ ] Добавить в `CourseApiModuleMeta.ucMetas`

- [ ] Task: Conductor - Ручная верификация 'UC resolve-content-path'

## Фаза 3: Рефакторинг сториз

- [ ] Task: Написать/обновить тесты LearningStory и MonitorStory на использование resolve-content-path
- [ ] Task: Заменить `#findStepPosition` на вызов UC в LearningStory, MonitorStory
  - [ ] Единый рендер шага/урока/проекта
- [ ] Task: Conductor - Ручная верификация 'Рефакторинг сториз'

## Фаза 4: Интеграционные/E2E тесты

- [ ] Task: Обновить `tests/bot` сценарии резолва контента по ролям
- [ ] Task: Обновить `architecture-evolution.md` (отметить ContentPath) и `ui-spec.md` (Часть A: ContentPath, таблица доступа)
- [ ] Task: Conductor - Ручная верификация 'Тесты ContentPath'
