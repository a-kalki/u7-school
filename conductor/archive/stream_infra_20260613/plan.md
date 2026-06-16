# План реализации: Stream Infra

## Фаза 1: Подключение CourseFacade [checkpoint: 3f3cdc9]

- [x] Task: Инициализировать CourseJsonRepo и LessonJsonRepo в `api-app.ts` `6927b35`
  - [x] Создать `ModuleJsonRepo` и `LessonJsonRepo` с seed-файлами в `dbDir/course/`
  - [x] Создать пустые seed-файлы `modules.json` и `lessons.json`
  - [x] Создать `CourseInProcFacade` с резолвером, содержащим оба репо
  - [x] Передать фасад в `StreamApiModule` вместо заглушки

- [x] Task: Проверить, что `CreateStreamUc` получает `contentSnapshot` `6b00ffa`
  - [x] Добавить тестовый модуль и урок в seed-файлы
  - [x] Убедиться, что `create-stream` UC возвращает поток с непустым снапшотом

- [x] Task: Conductor - Ручная верификация 'Подключение CourseFacade'

## Фаза 2: Починка тестов сторис [checkpoint: 37c25a6]

- [x] Task: Починить `this.api` → `this.moduleApi` и добавить `StreamAppMeta` `f4b3669`
  - [x] `catalog.story.ts` — `this.api` → `this.moduleApi`
  - [x] `view-stream.story.ts` — `this.api` → `this.moduleApi`
  - [x] `enroll.story.ts` — `this.api` → `this.moduleApi`
  - [x] `learning.story.ts` — `this.api` → `this.moduleApi`
  - [x] `progress.story.ts` — `this.api` → `this.moduleApi`
  - [x] `activate-stream.story.ts` — `this.api` → `this.moduleApi`
  - [x] `monitor.story.ts` — `this.api` → `this.moduleApi`
  - [x] `stream-controller.test.ts` — moduleApi в конструктор

- [x] Task: Запустить `bun test` — 13 тестов сторис исправлено (32 осталось — не из трека)

- [x] Task: Conductor - Ручная верификация 'Починка тестов'
