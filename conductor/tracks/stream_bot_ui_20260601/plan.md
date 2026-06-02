# План реализации: stream_bot_ui

## Фаза 1: StreamController — ядро маршрутизации [checkpoint: 95382e2]

- [x] Task: Написать тесты для маршрутизации StreamController.handleUpdate [f787a9d]
    - [ ] Тест: команда `streams` → handleListStreams
    - [ ] Тест: команда `my_study` → handleMyStudy
    - [ ] Тест: callback `stream:view:<id>` → handleStreamView
    - [ ] Тест: callback `enroll:<streamId>` → handleEnroll
    - [ ] Тест: callback `complete:<studentId>:<streamId>:<stepId>` → handleCompleteStep
    - [ ] Тест: неизвестная команда → сообщение об ошибке

- [x] Task: Реализовать StreamController.handleUpdate с полной маршрутизацией [f787a9d]
    - [ ] Парсинг callback_data: `stream:view`, `stream:enroll`, `complete`, `progress`
    - [ ] Делегирование частным методам без доменной логики

- [x] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md) [95382e2]

## Фаза 2: Витрина и карточка потока (US-1, US-2) [checkpoint: 512ab7a]

- [x] Task: Написать тесты для handleListStreams [5d2ea59]
    - [ ] Тест: возвращает inline-клавиатуру со списком потоков
    - [ ] Тест: пустой список → сообщение «Нет доступных потоков»
    - [ ] Тест: статус потока отображается эмодзи (🟢/🔵/⚪)

- [x] Task: Реализовать handleListStreams [5d2ea59]
    - [ ] Вызов `ListStreamsUc`
    - [ ] Форматирование inline-кнопок с названиями и статусами
    - [ ] callback_data: `stream:view:<uuid>`

- [x] Task: Написать тесты для handleStreamView (карточка) [6a61904]
    - [ ] Тест: карточка с названием, ментором, описанием, датой
    - [ ] Тест: для GUEST на enrollment — кнопки «Записаться» и «Программа»
    - [ ] Тест: для STUDENT — кнопка «Записаться» скрыта
    - [ ] Тест: для MENTOR — статусная плашка вместо кнопки записи

- [x] Task: Реализовать handleStreamView [6a61904]
    - [ ] Вызов `GetStreamUc` (получить поток)
    - [ ] Вызов `ListStreamStudentsUc` (подсчёт студентов)
    - [ ] Форматирование карточки MarkdownV2
    - [ ] Условные кнопки в зависимости от роли актора и статуса потока

- [x] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md) [512ab7a]

## Фаза 3: Запись на поток (US-3) и Моя учёба (US-4, US-5) [checkpoint: aae696e]

- [x] Task: Написать тесты для handleEnroll
    - [ ] Тест: успешная запись → сообщение с поздравлением
    - [ ] Тест: ошибка доступа → сообщение об ошибке

- [x] Task: Реализовать handleEnroll
    - [ ] Вызов `EnrollStudentUc`
    - [ ] Форматирование ответа с поздравлением и ссылкой на чат

- [x] Task: Написать тесты для handleMyStudy
    - [ ] Тест: активный студент → текущий шаг с заданием и кнопкой «Выполнено»
    - [ ] Тест: нет активной записи → сообщение «Вы не записаны»
    - [ ] Тест: поток завершён → поздравительное сообщение

- [x] Task: Реализовать handleMyStudy
    - [ ] Вызов `GetStudentByUserUc` (найти активную запись)
    - [ ] Вызов `GetStreamUc` (получить contentSnapshot)
    - [ ] Поиск шага в contentSnapshot для отображения задания
    - [ ] callback_data: `complete:<studentId>:<streamId>:<stepId>`

- [x] Task: Написать тесты для handleCompleteStep
    - [ ] Тест: уровень `step` → новый шаг с кнопкой
    - [ ] Тест: уровень `lesson` → поздравление + новый шаг
    - [ ] Тест: уровень `project` → поздравление + новый шаг
    - [ ] Тест: уровень `stream` → финальное поздравление

- [x] Task: Реализовать handleCompleteStep
    - [ ] Вызов `CompleteStepUc`
    - [ ] Ветвление по `CompletionResult.level` — форматирование ответа

- [x] Task: Написать тесты для handleProgress (US-5)
    - [ ] Тест: прогресс-бар и статистика

- [x] Task: Реализовать handleProgress
    - [ ] Вызов `GetStudentByUserUc` + `GetStreamUc`
    - [ ] Подсчёт прогресса: completed / всего шагов
    - [ ] Форматирование с прогресс-баром

- [x] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md) [aae696e]

## Фаза 4: Панель ментора (US-6, US-7, US-8)

- [ ] Task: Написать тесты для handleMentorPanel
    - [ ] Тест: ментор видит список своих потоков
    - [ ] Тест: не-ментор получает отказ

- [ ] Task: Реализовать handleMentorPanel
    - [ ] Вызов `ListStreamsUc` с фильтром `mentorId`
    - [ ] Inline-клавиатура с потоками ментора

- [ ] Task: Написать тесты для handleCreateStream (пошаговый диалог)
    - [ ] Тест: шаг 1 — список модулей ментора
    - [ ] Тест: шаг 2 — ввод названия
    - [ ] Тест: финальный шаг — создание потока

- [ ] Task: Реализовать handleCreateStream
    - [ ] Диалог через `ctx.session.menu = 'create_stream'` + шаг в `ctx.session.data`
    - [ ] Шаги: выбор модуля → название → описание → дата → telegramGroupId
    - [ ] Финальный вызов `CreateStreamUc`

- [ ] Task: Написать тесты для handleActivateStream
    - [ ] Тест: успешный запуск → сообщение ментору
    - [ ] Тест: не ментор → отказ

- [ ] Task: Реализовать handleActivateStream
    - [ ] Вызов `ActivateStreamUc`

- [ ] Task: Написать тесты для handleStreamStudents (US-8)
    - [ ] Тест: список студентов с прогрессом
    - [ ] Тест: отстающие помечены ⚠️

- [ ] Task: Реализовать handleStreamStudents
    - [ ] Вызов `ListStreamStudentsUc`
    - [ ] Для каждого — подсчёт прогресса и форматирование

- [ ] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)

## Фаза 5: Интеграция с u7-bot (top-menu-handler.ts)

- [ ] Task: Написать тесты для динамических кнопок меню
    - [ ] Тест: GUEST видит `📚 Наши потоки`, не видит `📖 Моя учёба`
    - [ ] Тест: STUDENT видит `📚 Наши потоки` + `📖 Моя учёба`
    - [ ] Тест: MENTOR видит все три кнопки

- [ ] Task: Интегрировать кнопки в top-menu-handler.ts
    - [ ] `📚 Наши потоки` — всем ролям
    - [ ] `📖 Моя учёба` — только STUDENT
    - [ ] `🛠️ Панель ментора` — только MENTOR/ADMIN
    - [ ] Существующие команды → кнопки

- [ ] Task: Conductor - User Manual Verification 'Фаза 5' (Protocol in workflow.md)
