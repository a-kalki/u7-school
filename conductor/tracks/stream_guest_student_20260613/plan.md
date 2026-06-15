# План реализации: Stream Guest & Student (US-1..US-5)

## Фаза 1: US-1 — Фильтр статусов в CatalogStory

- [ ] Task: Написать тест: CatalogStory фильтрует по enrollment + active
  - [ ] Мок API возвращает потоки со всеми статусами
  - [ ] Проверить, что в результате только enrollment и active

- [ ] Task: Реализовать фильтр по статусам в CatalogStory
  - [ ] Передавать `{ status: 'enrollment' }` и `{ status: 'active' }` в `list-streams`
  - [ ] Объединять результаты двух запросов
  - [ ] Или добавить поддержку массива статусов в `ListStreamsCmd`

- [ ] Task: Conductor - Ручная верификация 'Фильтр статусов'

## Фаза 2: US-2 — Ролевые кнопки в ViewStreamStory

- [ ] Task: Написать тест: ViewStreamStory показывает ролевые кнопки
  - [ ] GUEST на enrollment → видит «Записаться», «Программа», «Назад»
  - [ ] GUEST на active → видит «Уведомить», «Назад»
  - [ ] STUDENT на enrollment → НЕ видит «Записаться»

- [ ] Task: Реализовать ролевые кнопки в ViewStreamStory
  - [ ] Кастить actor к `{ uuid: string; roles: string[] }`
  - [ ] По роли и статусу потока определять набор кнопок

- [ ] Task: Написать тест: ViewStreamStory показывает имя ментора

- [ ] Task: Реализовать показ имени ментора
  - [ ] Через API: добавить use-case `get-user` в StreamApiModule или расширить `get-stream`
  - [ ] Вывести имя ментора в карточке

- [ ] Task: Написать тест: кнопка «Программа курса» показывает contentSnapshot

- [ ] Task: Реализовать кнопку «Программа курса»
  - [ ] Новый callback `view-stream:program:<streamId>`
  - [ ] Рендерить сжатый `contentSnapshot` (проекты → уроки, без шагов)
  - [ ] Кнопка «⬅️ Назад к потоку» под программой

- [ ] Task: Conductor - Ручная верификация 'Ролевые кнопки и программа'

## Фаза 3: US-3 — Дата старта в EnrollStory

- [ ] Task: Написать тест: EnrollStory показывает startDate в сообщении

- [ ] Task: Реализовать показ startDate
  - [ ] Из ответа `get-stream` взять `startDate`
  - [ ] Отформатировать и вывести в сообщении

- [ ] Task: Conductor - Ручная верификация 'Дата старта'

## Фаза 4: US-4 — Названия уроков/проектов в LearningStory

- [ ] Task: Написать тест: LearningStory показывает названия в переходах
  - [ ] Уровень `lesson` → сообщение содержит `completedLessonTitle` и `nextLessonTitle`
  - [ ] Уровень `project` → сообщение содержит названия проектов

- [ ] Task: Реализовать названия в переходах
  - [ ] После `complete-step` запросить `get-stream` для `contentSnapshot`
  - [ ] По `completedLessonId`/`completedProjectId` и `currentStepId` найти названия
  - [ ] Сформировать сообщения: «Урок {Old} завершён. Начинаем: {New}»

- [ ] Task: Conductor - Ручная верификация 'Названия в переходах'

## Фаза 5: US-5 — Полные данные в ProgressStory

- [ ] Task: Написать тест: ProgressStory показывает ментора, дату, чат, проект/урок

- [ ] Task: Реализовать полные данные в ProgressStory
  - [ ] Имя ментора — через `get-user` (ментор определяется по `stream.mentorId`)
  - [ ] Дата старта, ссылка на чат — из `get-stream`
  - [ ] Текущий проект/урок — из `contentSnapshot` по `currentStepId` студента

- [ ] Task: Conductor - Ручная верификация 'Полный прогресс'
