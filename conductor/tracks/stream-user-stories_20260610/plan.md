# План реализации: Миграция StreamController на BotUserStory

## Фаза 1: Подготовка — StreamAppMeta

- [ ] Task: Определить StreamAppMeta в domain/module.ts
    - [ ] Union тип: StreamApiModuleMeta | UserApiModuleMeta
    - [ ] name: 'stream-bot'
- [ ] Task: Написать тест на StreamAppMeta (компиляция типов)

## Фаза 2: CatalogStory и ViewStreamStory (US-1, US-2)

- [ ] Task: Создать catalog.story.ts
    - [ ] name: 'catalog'
    - [ ] handleCallback('list'): вызов list-streams, рендеринг клавиатуры
    - [ ] handleStart: кнопка «📚 Наши потоки», priority 10
    - [ ] handleMessage: заглушка «неизвестное сообщение»
- [ ] Task: Создать view-stream.story.ts
    - [ ] name: 'view-stream'
    - [ ] handleCallback('view:<streamId>'): карточка потока
    - [ ] Кнопка «Записаться» для enrollment
    - [ ] handleStart: null (не в меню)
- [ ] Task: Написать тесты на catalog и view-stream
    - [ ] Тест: catalog показывает список
    - [ ] Тест: view-stream показывает карточку с кнопкой «Записаться»
    - [ ] Тест: view-stream для active скрывает кнопку «Записаться»

## Фаза 3: EnrollStory и LearningStory (US-3, US-4)

- [ ] Task: Создать enroll.story.ts
    - [ ] name: 'enroll'
    - [ ] handleCallback('enroll:<streamId>'): вызов enroll-student
    - [ ] Возвращает delegate: 'stream:learning:my-study'
    - [ ] handleStart: null
- [ ] Task: Создать learning.story.ts
    - [ ] name: 'learning'
    - [ ] handleCallback('my-study'): текущий шаг студента
    - [ ] Кнопка «✅ Выполнено» с callback `complete:<studentId>:<streamId>:<stepId>`
    - [ ] handleCallback('complete:...'): вызов complete-step
    - [ ] handleStart: кнопка «📖 Моя учёба» если STUDENT, priority 20
- [ ] Task: Написать тесты на enroll и learning
    - [ ] Тест: enroll возвращает delegate
    - [ ] Тест: learning показывает текущий шаг
    - [ ] Тест: learning обрабатывает complete step

## Фаза 4: ProgressStory (US-5)

- [ ] Task: Создать progress.story.ts
    - [ ] name: 'progress'
    - [ ] handleCallback('progress:<streamId>'): прогресс-бар
    - [ ] handleStart: null
- [ ] Task: Написать тесты на progress
    - [ ] Тест: progress показывает прогресс-бар и проценты

## Фаза 5: CreateStreamStory (US-6, wizard)

- [ ] Task: Создать create-stream.story.ts
    - [ ] name: 'create-stream'
    - [ ] handleCallback('start'): начинает wizard, captureInput
    - [ ] handleMessage: пошаговый сбор (модуль → название → описание → дата → группа)
    - [ ] handleCancel: releaseInput
    - [ ] handleTimeout: releaseInput + сообщение
    - [ ] handleStart: кнопка «🛠️ Панель ментора» только для MENTOR/ADMIN, priority 30
- [ ] Task: Написать тесты на create-stream
    - [ ] Тест: wizard шаг 1 — выбор модуля
    - [ ] Тест: wizard шаг 2 — ввод названия
    - [ ] Тест: /cancel сбрасывает wizard
    - [ ] Тест: таймаут сбрасывает wizard

## Фаза 6: ActivateStreamStory и MonitorStory (US-7, US-8)

- [ ] Task: Создать activate-stream.story.ts
    - [ ] name: 'activate-stream'
    - [ ] handleCallback('activate:<streamId>'): запуск потока
    - [ ] handleStart: null
- [ ] Task: Создать monitor.story.ts
    - [ ] name: 'monitor'
    - [ ] handleCallback('students:<streamId>'): список студентов
    - [ ] handleStart: null
- [ ] Task: Написать тесты на activate-stream и monitor
    - [ ] Тест: activate-stream запускает поток
    - [ ] Тест: monitor показывает список с прогрессом

## Фаза 7: Переработка StreamController

- [ ] Task: Переписать stream-controller.ts как реестр
    - [ ] name = 'stream'
    - [ ] stories — массив из 8 стори
    - [ ] handleCallback: форвардит стори по префиксу
    - [ ] handleMessage: форвардит активной стори
    - [ ] handleStart: агрегирует от стори с оборачиванием префиксом
    - [ ] handleCancel: делегирует активной стори
    - [ ] handleTimeout: делегирует активной стори
- [ ] Task: Обновить stream-controller.test.ts под новую структуру
    - [ ] Мокировать стори вместо прямой логики
    - [ ] Все существующие тесты проходят

## Фаза 8: Интеграция и проверка

- [ ] Task: Запустить все тесты stream: `bun run test:p stream`
- [ ] Task: Проверить типы: `bun run tslint:p stream`
- [ ] Task: Conductor - User Manual Verification 'Фаза 8' (Protocol in workflow.md)
