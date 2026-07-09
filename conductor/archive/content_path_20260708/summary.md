# Итоговый отчёт: ContentPath (адресация контента)

> Трек: `content_path_20260708`
> Дата завершения: 2026-07-08

## Цель

Унифицированная адресация контента обучения через пути `A:B:C:D` (module:project:lesson:step, 1-based индексы) с ролевым доступом.

## Выполненные задачи

### Фаза 1: VO ContentPath [checkpoint: 964ff19]
- ContentPath как value object в домене `course`
- parse/serialize + валидация всех partial-форм (A, A:B, A:B:C, A:B:C:D, A:B:C:all)
- Алиасы: mA:pB:lC:sD
- ContentPathSchema (valibot)

### Фаза 2: UC resolve-content-path [checkpoint: 56e6d3c]
- UC с ролевым фильтром:
  - curious (без actorId): заголовки видны, content/code скрыты
  - student: зависит от позиции (completed/active/future)
  - mentor/admin/author: полный доступ
- Навигация по CourseProgram через ContentPath

### Фаза 3: Рефакторинг сториз [checkpoint: 32d9316]
- CourseDs: findStepPosition, findLessonTitle, findProjectTitle, countTotalSteps
- StepPosition вынесен в content-snapshot.ts
- LearningStory, MonitorStory, ProgressStory — прямой импорт CourseDs
- Удалены дублирующие приватные методы (#findStepPosition ×2, #findLessonTitle, #findProjectTitle, #findCurrentContext)
- UC очищен от stepId-режима

### Фаза 4: Интеграционные тесты и документация [checkpoint: b0dc5b6]
- 19 интеграционных тестов resolve-content-path (все уровни, роли, алиасы, ошибки)
- Исправление циклической зависимости: UC → репозитории напрямую вместо CourseFacade
- Убран courseFacade из CourseApiModuleResolver
- Обновлена документация: architecture-evolution.md, ui-spec.md

## Изменённые файлы

### Новые
- `packages/course/src/domain/content-path.ts` — VO + Schema
- `packages/course/src/domain/content-path.test.ts` — тесты VO
- `packages/course/src/domain/content-path/commands/resolve-content-path-cmd.ts` — команда UC
- `packages/course/src/api/content-path/resolve-content-path-uc.ts` — UC
- `packages/course/src/api/content-path/resolve-content-path-uc.test.ts` — тесты UC
- `packages/course/src/domain/course-ds.test.ts` — тесты CourseDs
- `tests/bot/integration/course/content-path.integration.test.ts` — интеграционные тесты

### Изменённые
- `packages/course/src/domain/index.ts` — экспорт ContentPath, CourseDs, StepPosition
- `packages/course/src/domain/content-snapshot.ts` — тип StepPosition
- `packages/course/src/domain/course-ds.ts` — +4 метода обхода ContentSnapshot
- `packages/course/src/domain/module.ts` — убран courseFacade из резолвера
- `packages/course/src/api/module.ts` — регистрация UC в ucMetas
- `packages/stream/src/ui/bot/stories/learning.story.ts` — CourseDs вместо ручного обхода
- `packages/stream/src/ui/bot/stories/monitor.story.ts` — CourseDs вместо positionMap
- `packages/stream/src/ui/bot/stories/progress.story.ts` — CourseDs вместо #findCurrentContext
- `packages/stream/src/ui/bot/stories/learning.story.test.ts` — обновлены моки
- `packages/stream/src/ui/bot/stories/monitor.story.test.ts` — обновлены моки
- `conductor/architecture-evolution.md` — §2.2, §2.2.1
- `.pi/skills/ddd-domain/SKILL.md` — cross-package domain imports

## Архитектурные решения

1. **ContentPath — VO в домене `course`**: тип выведен из ContentPathSchema (единый источник истины).
2. **CourseDs как API для обхода ContentSnapshot**: чистые синхронные функции без I/O. Прямой импорт из `stream` пакета (правило cross-package domain imports).
3. **UC без CourseFacade**: прямая работа с репозиториями, убрана циклическая зависимость модуль → фасад → модуль.
4. **Ролевой фильтр в UC**: hasFullAccess определяет, показывать ли content/code шагов.

## Отклонения от плана

- Фаза 3 изначально предполагала UC-подход с `appApi.execute('resolve-content-path', { stepId })`. После ревью переделано на прямой импорт CourseDs.
- Бэклог утечек доменной логики был создан, но удалён — все утечки исправлены в рамках трека.

## Известные ограничения

- Student-роль: фильтр «completed/active/future» для шагов декларирован в spec, но не реализован — нужен streamId и позиция студента. Оставлен для трека `student_navigation`.
