# План реализации: ContentPath

> Контекст: `../../architecture-evolution.md` §2.2, `./spec.md`. TDD (Red→Green), см. `conductor/workflow.md`.

## Фаза 1: VO ContentPath [checkpoint: 964ff19]

- [x] Task: Написать тесты ContentPath (parse/serialize/валидация всех partial-форм, ошибочные пути) [01196b3]
- [x] Task: Реализовать `ContentPath` VO + `ContentPathSchema` в домене `course`
  - [x] `packages/course/src/domain/content-path.ts`
  - [x] Export из index [386f612]
- [ ] Task: Conductor - Ручная верификация 'VO ContentPath'

## Фаза 2: UC resolve-content-path [checkpoint: 56e6d3c]

- [x] Task: Написать тесты resolve-content-path по ролям [1f7330f]
  - [x] curious: шаги видны, но только заголовки (без content/code)
  - [x] student: completed — полный контент read-only, current — полный active, будущие — только заголовок (нужен streamId)
  - [x] mentor: полный доступ
  - [x] несуществующий путь → NotFound

- [x] Task: Реализовать UC + команду
  - [x] `commands/resolve-content-path-cmd.ts`, UC в `packages/course/src/api/`
  - [x] Резолв индекс→UUID через CourseFacade.getCourseProgram / ContentSnapshot
  - [x] Добавить в `CourseApiModuleMeta.ucMetas` [10d16c4]

- [ ] Task: Conductor - Ручная верификация 'UC resolve-content-path'

## Фаза 3: Рефакторинг сториз [checkpoint: 32d9316]

- [x] Task: Добавить методы обхода ContentSnapshot в CourseDs [32d9316]
  - [x] findStepPosition, findLessonTitle, findProjectTitle, countTotalSteps
  - [x] StepPosition вынесен в content-snapshot.ts
  - [x] 11 тестов
- [x] Task: Заменить ручной обход ContentSnapshot на CourseDs в сториз
  - [x] LearningStory: findStepPosition + findLessonTitle/ProjectTitle через CourseDs
  - [x] MonitorStory: countTotalSteps + findStepPosition через CourseDs
  - [x] ProgressStory: countTotalSteps + findStepPosition через CourseDs
  - [x] Удалены: #findStepPosition (×2), #findLessonTitle, #findProjectTitle, #findCurrentContext
- [x] Task: Очистить UC resolve-content-path от stepId-режима [32d9316]
  - [x] Убран stepId из схемы и execute()
  - [x] Убран resolvePathByStepId
  - [x] UC теперь только path → контент с ролевым фильтром
- [x] Task: Документировать правило cross-package domain imports
  - [x] architecture-evolution.md §2.2.1
  - [x] .pi/skills/ddd-domain/SKILL.md
- [ ] Task: Conductor - Ручная верификация 'Рефакторинг сториз'

## Фаза 4: Интеграционные/E2E тесты

- [~] Task: Обновить `tests/bot` сценарии резолва контента по ролям
- [ ] Task: Обновить `architecture-evolution.md` (отметить ContentPath) и `ui-spec.md` (Часть A: ContentPath, таблица доступа)
- [ ] Task: Conductor - Ручная верификация 'Тесты ContentPath'
