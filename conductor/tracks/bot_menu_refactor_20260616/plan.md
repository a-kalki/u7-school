# План реализации: Рефакторинг главного меню бота

## Фаза 0: Подготовка — переименование NEWS_GROUP_URL → SCHOOL_GROUP_URL

- [x] Task: Переименовать переменную окружения и сделать обязательной (9373d77)
    - [ ] Переименовать `NEWS_GROUP_URL` → `SCHOOL_GROUP_URL` в `.env.development`
    - [ ] В `config.ts`: переименовать `newsGroupUrl` → `schoolGroupUrl`, убрать `.optional()`, сделать обязательным полем
    - [ ] Исправить все ссылки на `newsGroupUrl` в коде (api-app.ts)
    - [ ] Запустить проверку типов, убедиться что нет ошибок

## Фаза 1: MenuAggregator и BotController

- [ ] Task: Создать интерфейс MenuAggregator
    - [ ] Добавить интерфейс `MenuAggregator` с методами `collectAllMenuItems` и `collectAllHelpDescriptions` в `packages/core/src/ui/bot/types.ts`
    - [ ] Экспортировать из `@u7-scl/core/ui`

- [ ] Task: Очистить BotController от ненужных методов
    - [ ] Удалить `handleGreeting` и `handleHelpHeader` (не нужны в варианте Б)
    - [ ] Обновить тесты BotController если они ссылаются на эти методы

## Фаза 2: BotRouter — MenuAggregator + handleWelcome/handleHelp

- [ ] Task: Написать тесты для BotRouter (MenuAggregator + новые методы)
    - [ ] `collectAllMenuItems`: все контроллеры опрошены, сортировка по priority
    - [ ] `collectAllHelpDescriptions`: все контроллеры опрошены, null отфильтрован
    - [ ] `handleWelcome`: делегирует в AppController.handleWelcome() если контроллер 'app' существует
    - [ ] `handleHelp`: делегирует в AppController.handleHelpMessage() если контроллер 'app' существует

- [ ] Task: Реализовать MenuAggregator в BotRouter
    - [ ] Реализовать `collectAllMenuItems(actor)`
    - [ ] Реализовать `collectAllHelpDescriptions(actor)`

- [ ] Task: Реализовать handleWelcome и handleHelp в BotRouter
    - [ ] `handleWelcome`: делегирует в контроллер 'app' (AppController)
    - [ ] `handleHelp`: делегирует в контроллер 'app' (AppController)
    - [ ] Если контроллер 'app' не найден — fallback ответ

- [ ] Task: Убрать спецобработку app:main-menu из handleCallback и поле mainMenu
    - [ ] Удалить блок `if (data === 'app:main-menu')`
    - [ ] Удалить `mainMenu` из BotResponse и связанную логику в `handleCallback`
    - [ ] `app:main-menu` теперь маршрутизируется в AppController как обычный callback

## Фаза 3: AppController — системные сообщения и кнопки

- [ ] Task: Написать юнит-тесты для AppController
    - [ ] `handleStart`: возвращает кнопки «Сообщество школы» (priority 100) и «Помощь» (priority 90)
    - [ ] `handleHelpStart`: возвращает описание кнопки сообщества
    - [ ] `handleWelcome`: возвращает BotResponse с приветствием и клавиатурой
    - [ ] `handleHelpMessage`: возвращает BotResponse с инструкцией и списком описаний
    - [ ] `handleCallback('main-menu', ...)`: клавиатура без полного приветствия (текст «Выберите действие:»)
    - [ ] `handleCallback('help', ...)`: вызывает handleHelpMessage

- [ ] Task: Реализовать handleWelcome в AppController
    - [ ] Формирует текст приветствия из FR4
    - [ ] Собирает кнопки через `menuAggregator.collectAllMenuItems()`
    - [ ] Возвращает BotResponse с sendMessage (текст + keyboard)

- [ ] Task: Реализовать handleHelpMessage в AppController
    - [ ] Формирует заголовок-инструкцию из FR5
    - [ ] Собирает описания через `menuAggregator.collectAllHelpDescriptions()`
    - [ ] Склеивает в один текст, возвращает BotResponse

- [ ] Task: Реализовать handleCallback для app:main-menu и app:help
    - [ ] `main-menu` → вызывает `handleWelcome` с кратким текстом «Выберите действие:»
    - [ ] `help` → вызывает `handleHelpMessage`

- [ ] Task: Интегрировать MenuAggregator в AppController
    - [ ] Добавить поле `menuAggregator: MenuAggregator`
    - [ ] Переопределить `init()` для получения MenuAggregator от BotRouter

## Фаза 4: connectRouter — чистый адаптер

- [ ] Task: Обновить юнит-тесты connectRouter
    - [ ] `/start` вызывает `router.handleWelcome()` и `executeResponses`
    - [ ] `/help` вызывает `router.handleHelp()` и `executeResponses`
    - [ ] `callback_query` не содержит спецобработки `response.mainMenu`
    - [ ] Пользовательские тексты не захардкожены в connectRouter

- [ ] Task: Переписать connectRouter
    - [ ] `/start` — удалить формирование текста и InlineKeyboard, использовать `router.handleWelcome()`
    - [ ] `/help` — удалить склейку текста, использовать `router.handleHelp()`
    - [ ] `callback_query` — удалить блок `if (response.mainMenu)`
    - [ ] Удалить `saveLastBotFromItems`

## Фаза 5: Интеграционные и E2E тесты

- [ ] Task: Написать интеграционные тесты для главного меню в tests/bot
    - [ ] Тест: `/start` возвращает приветствие и клавиатуру с кнопками
    - [ ] Тест: `/help` возвращает инструкцию и описания
    - [ ] Тест: кнопка «Помощь» (callback `app:help`) показывает инструкцию
    - [ ] Тест: кнопка «Сообщество школы» (url-кнопка) присутствует в клавиатуре

- [ ] Task: Написать E2E тест пользовательского сценария
    - [ ] Полный сценарий: `/start` → видит приветствие → нажимает «Помощь» → видит инструкцию → возврат в меню

## Фаза 6: Финальная проверка и ручная верификация

- [ ] Task: Conductor - Ручная верификация 'Финальная проверка' (Protocol in workflow.md)
