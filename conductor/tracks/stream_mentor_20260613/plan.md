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

## Фаза 2: US-7 — Менторские кнопки в ViewStreamStory

- [ ] Task: Написать тест: ViewStreamStory показывает менторские кнопки
  - [ ] MENTOR на своём enrollment → видит «Запустить», «Студенты», «В архив»
  - [ ] MENTOR на своём active → видит «Завершить», «Студенты», «В архив»
  - [ ] MENTOR на чужом потоке → не видит менторских кнопок

- [ ] Task: Реализовать менторские кнопки
  - [ ] В `handleCallback('view:<id>')` проверить `actorId === stream.mentorId`
  - [ ] Добавить менторские кнопки в зависимости от статуса потока
  - [ ] Callback'ы: `activate-stream:activate:<id>`, `monitor:students:<id>`

- [ ] Task: Conductor - Ручная верификация 'Менторские кнопки'

## Фаза 3: US-8 — Имена студентов и детальная карточка

- [ ] Task: Написать тест: MonitorStory показывает имена вместо userId
  - [ ] Мок API возвращает студентов с userId
  - [ ] Мок getUserByUuid возвращает имена
  - [ ] Проверить, что в сообщении имена, а не userId

- [ ] Task: Реализовать резолвинг имён через UserFacade
  - [ ] В `handleCallback('students:<id>')` для каждого студента вызвать `getUserByUuid`
  - [ ] Вывести имена вместо `userId.slice(0, 8)`

- [ ] Task: Написать тест: клик на студента открывает детальную карточку

- [ ] Task: Реализовать детальную карточку студента
  - [ ] Callback `monitor:detail:<studentId>`
  - [ ] Показать: имя, Telegram (@username), статус, прогресс
  - [ ] Кнопки: `[✉️ Написать]`, `[📁 История шагов]`, `[⬅️ Назад к списку]`

- [ ] Task: Conductor - Ручная верификация 'Мониторинг с именами'
