# План реализации: Stream Mentor (US-6..US-8)

## Фаза 1: US-6 — Реальный список модулей и превью [checkpoint: f7de915]

- [x] Task: Написать тест: CreateStreamStory показывает список модулей ментора
  - [x] Мок API возвращает модули (moduleId, title)
  - [x] Проверить, что в ответе есть inline-кнопки с названиями модулей

- [x] Task: Реализовать загрузку модулей в wizard
  - [x] В `#handleModuleMessage` запрашивать модули через `this.appApi.execute('list-modules', {})`
  - [x] Формировать inline-кнопки: `{ text: module.title, code: 'create-stream:module:<moduleId>' }`

- [x] Task: Написать тест: CreateStreamStory показывает превью перед созданием

- [x] Task: Реализовать шаг превью (шаг 4 → шаг 5)
  - [x] После ввода группы показать карточку: название, описание, дата, группа
  - [x] Кнопки: `[✅ Создать]`, `[⬅️ Изменить]`
  - [x] «Создать» вызывает `this.moduleApi.execute('create-stream', ...)` и освобождает input
    - commit: 1fc9762

- [x] Task: Conductor - Ручная верификация 'Создание потока с модулями'

## Фаза 2: US-7 — Менторские кнопки в ViewStreamStory [checkpoint: 6d64999]

- [x] Task: Написать тест: ViewStreamStory показывает менторские кнопки
  - [x] MENTOR на своём enrollment → видит «Запустить», «Студенты», «В архив»
  - [x] MENTOR на своём active → видит «Завершить», «Студенты», «В архив»
  - [x] MENTOR на чужом потоке → не видит менторских кнопок

- [x] Task: Реализовать менторские кнопки
  - [x] В `handleCallback('view:<id>')` проверить `actorId === stream.mentorId`
  - [x] Добавить менторские кнопки в зависимости от статуса потока
  - [x] Callback'ы: `activate-stream:activate:<id>`, `monitor:students:<id>`
    - commit: 50b884b

- [ ] Task: Conductor - Ручная верификация 'Менторские кнопки'

## Фаза 3: US-8 — Имена студентов и детальная карточка [checkpoint: 57941aa]

- [x] Task: Написать тест: MonitorStory показывает имена вместо userId
  - [x] Мок API возвращает студентов с userId
  - [x] Мок getUserByUuid возвращает имена
  - [x] Проверить, что в сообщении имена, а не userId

- [x] Task: Реализовать резолвинг имён через UserFacade
  - [x] В `handleCallback('students:<id>')` для каждого студента вызвать `getUserByUuid`
  - [x] Вывести имена вместо `userId.slice(0, 8)`

- [x] Task: Написать тест: клик на студента открывает детальную карточку

- [x] Task: Реализовать детальную карточку студента
  - [x] Callback `monitor:detail:<studentId>`
  - [x] Показать: имя, Telegram (@username), статус, прогресс
  - [x] Кнопки: `[✉️ Написать]`, `[📁 История шагов]`, `[⬅️ Назад к списку]`
    - commit: ef14762

- [ ] Task: Conductor - Ручная верификация 'Мониторинг с именами'
