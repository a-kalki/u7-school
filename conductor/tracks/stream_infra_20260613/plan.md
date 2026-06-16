# План реализации: Stream Infra

## Фаза 1: Подключение CourseFacade

- [x] Task: Инициализировать CourseJsonRepo и LessonJsonRepo в `api-app.ts` `6927b35`
  - [x] Создать `ModuleJsonRepo` и `LessonJsonRepo` с seed-файлами в `dbDir/course/`
  - [x] Создать пустые seed-файлы `modules.json` и `lessons.json`
  - [x] Создать `CourseInProcFacade` с резолвером, содержащим оба репо
  - [x] Передать фасад в `StreamApiModule` вместо заглушки

- [ ] Task: Проверить, что `CreateStreamUc` получает `contentSnapshot`
  - [ ] Добавить тестовый модуль и урок в seed-файлы
  - [ ] Убедиться, что `create-stream` UC возвращает поток с непустым снапшотом

- [ ] Task: Conductor - Ручная верификация 'Подключение CourseFacade'

## Фаза 2: Починка тестов сторис

- [ ] Task: Добавить `story.init(mockApi)` во все сторис-тесты где его нет
  - [ ] `catalog.story.test.ts` — добавить `story.init(mockApi)` в тесты handleCallback
  - [ ] `view-stream.story.test.ts` — добавить `story.init(mockApi)`
  - [ ] `enroll.story.test.ts` — добавить `story.init(mockApi)`
  - [ ] `learning.story.test.ts` — добавить `story.init(mockApi)`
  - [ ] `progress.story.test.ts` — добавить `story.init(mockApi)`
  - [ ] `activate-stream.story.test.ts` — добавить `story.init(mockApi)`
  - [ ] `monitor.story.test.ts` — добавить `story.init(mockApi)`
  - [ ] `stream-controller.test.ts` — проверить, что форвардинг работает после исправлений

- [ ] Task: Запустить `bun test` и убедиться в 0 падающих тестов

- [ ] Task: Conductor - Ручная верификация 'Починка тестов'
