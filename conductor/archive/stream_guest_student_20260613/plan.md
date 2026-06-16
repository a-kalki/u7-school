# План реализации: Stream Guest & Student (US-1..US-5)

## Фаза 1: US-1 — Фильтр статусов в CatalogStory

- [x] Task: Написать тест: CatalogStory фильтрует по enrollment + active
  - [x] Мок API возвращает потоки со всеми статусами
  - [x] Проверить, что в результате только enrollment и active

- [x] Task: Реализовать фильтр по статусам в CatalogStory
  - [x] Передавать `{ status: 'enrollment' }` и `{ status: 'active' }` в `list-streams`
  - [x] Объединять результаты двух запросов
  `[1531cf4]`

- [ ] Task: Conductor - Ручная верификация 'Фильтр статусов'

## Фаза 2: US-2 — Ролевые кнопки в ViewStreamStory

- [x] Task: Написать тест: ViewStreamStory показывает ролевые кнопки
  - [x] GUEST на enrollment → видит «Записаться», «Программа», «Назад»
  - [x] GUEST на active → видит «Уведомить», «Назад»
  - [x] STUDENT на enrollment → НЕ видит «Записаться»

- [x] Task: Реализовать ролевые кнопки в ViewStreamStory
  - [x] Кастить actor к `{ uuid: string; roles: string[] }`
  - [x] По роли и статусу потока определять набор кнопок

- [x] Task: Написать тест: ViewStreamStory показывает имя ментора

- [x] Task: Реализовать показ имени ментора
  - [x] Через API: добавить use-case `get-user` в StreamApiModule
  - [x] Вывести имя ментора в карточке

- [x] Task: Написать тест: кнопка «Программа курса» показывает contentSnapshot

- [x] Task: Реализовать кнопку «Программа курса»
  - [x] Новый callback `view-stream:program:<streamId>`
  - [x] Рендерить сжатый `contentSnapshot` (проекты → уроки, без шагов)
  - [x] Кнопка «⬅️ Назад к потоку» под программой
  `[8c7ef27]`

- [ ] Task: Conductor - Ручная верификация 'Ролевые кнопки и программа'

## Фаза 3: US-3 — Дата старта в EnrollStory

- [x] Task: Написать тест: EnrollStory показывает startDate в сообщении

- [x] Task: Реализовать показ startDate
  - [x] Из ответа `get-stream` взять `startDate`
  - [x] Отформатировать и вывести в сообщении
  `[8b37b65]`

- [ ] Task: Conductor - Ручная верификация 'Дата старта'

## Фаза 4: US-4 — Названия уроков/проектов в LearningStory

- [x] Task: Написать тест: LearningStory показывает названия в переходах
  - [x] Уровень `lesson` → сообщение содержит `completedLessonTitle` и `nextLessonTitle`
  - [x] Уровень `project` → сообщение содержит названия проектов

- [x] Task: Реализовать названия в переходах
  - [x] После `complete-step` запросить `get-stream` для `contentSnapshot`
  - [x] По `completedLessonId`/`completedProjectId` и `currentStepId` найти названия
  - [x] Сформировать сообщения: «Урок {Old} завершён. Начинаем: {New}»
  `[8b37b65]`

- [ ] Task: Conductor - Ручная верификация 'Названия в переходах'

## Фаза 5: US-5 — Полные данные в ProgressStory

- [x] Task: Написать тест: ProgressStory показывает ментора, дату, чат, проект/урок

- [x] Task: Реализовать полные данные в ProgressStory
  - [x] Имя ментора — через `get-user` (ментор определяется по `stream.mentorId`)
  - [x] Дата старта, ссылка на чат — из `get-stream`
  - [x] Текущий проект/урок — из `contentSnapshot` по `currentStepId` студента
  `[8b37b65]`

- [ ] Task: Conductor - Ручная верификация 'Полный прогресс'
