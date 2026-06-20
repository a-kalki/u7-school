# План реализации: Рефакторинг главного меню бота

## Фаза 0: Подготовка — переименование NEWS_GROUP_URL → SCHOOL_GROUP_URL

- [x] Task: Переименовать переменную окружения и сделать обязательной (9373d77)
    - [ ] Переименовать `NEWS_GROUP_URL` → `SCHOOL_GROUP_URL` в `.env.development`
    - [ ] В `config.ts`: переименовать `newsGroupUrl` → `schoolGroupUrl`, убрать `.optional()`, сделать обязательным полем
    - [ ] Исправить все ссылки на `newsGroupUrl` в коде (api-app.ts)
    - [ ] Запустить проверку типов, убедиться что нет ошибок

## Фаза 1: MenuAggregator и BotController

- [x] Task: Создать интерфейс MenuAggregator (008ba01)
    - [ ] Добавить интерфейс `MenuAggregator` с методами `collectAllMenuItems` и `collectAllHelpDescriptions` в `packages/core/src/ui/bot/types.ts`
    - [ ] Экспортировать из `@u7-scl/core/ui`

- [x] Task: Очистить BotController от ненужных методов (008ba01)
    - [ ] Удалить `handleGreeting` и `handleHelpHeader` (не нужны в варианте Б)
    - [ ] Обновить тесты BotController если они ссылаются на эти методы

## Фаза 2: BotRouter — MenuAggregator + handleWelcome/handleHelp

- [x] Task: Написать тесты для BotRouter (MenuAggregator + новые методы) (67ee75d)
    - [ ] `collectAllMenuItems`: все контроллеры опрошены, сортировка по priority
    - [ ] `collectAllHelpDescriptions`: все контроллеры опрошены, null отфильтрован
    - [ ] `handleWelcome`: делегирует в AppController.handleWelcome() если контроллер 'app' существует
    - [ ] `handleHelp`: делегирует в AppController.handleHelpMessage() если контроллер 'app' существует

- [x] Task: Реализовать MenuAggregator в BotRouter (67ee75d)
    - [ ] Реализовать `collectAllMenuItems(actor)`
    - [ ] Реализовать `collectAllHelpDescriptions(actor)`

- [x] Task: Реализовать handleWelcome и handleHelp в BotRouter (67ee75d)
    - [ ] `handleWelcome`: делегирует в контроллер 'app' (AppController)
    - [ ] `handleHelp`: делегирует в контроллер 'app' (AppController)
    - [ ] Если контроллер 'app' не найден — fallback ответ

- [x] Task: Убрать спецобработку app:main-menu из handleCallback и поле mainMenu (67ee75d)
    - [ ] Удалить блок `if (data === 'app:main-menu')`
    - [ ] Удалить `mainMenu` из BotResponse и связанную логику в `handleCallback`
    - [ ] `app:main-menu` теперь маршрутизируется в AppController как обычный callback

## Фаза 3: AppController — системные сообщения и кнопки

- [x] Task: Написать юнит-тесты для AppController (1274d98)
    - [ ] `handleStart`: возвращает кнопки «Сообщество школы» (priority 100) и «Помощь» (priority 90)
    - [ ] `handleHelpStart`: возвращает описание кнопки сообщества
    - [ ] `handleWelcome`: возвращает BotResponse с приветствием и клавиатурой
    - [ ] `handleHelpMessage`: возвращает BotResponse с инструкцией и списком описаний
    - [ ] `handleCallback('main-menu', ...)`: клавиатура без полного приветствия (текст «Выберите действие:»)
    - [ ] `handleCallback('help', ...)`: вызывает handleHelpMessage

- [x] Task: Реализовать handleWelcome в AppController (1274d98)
    - [ ] Формирует текст приветствия из FR4
    - [ ] Собирает кнопки через `menuAggregator.collectAllMenuItems()`
    - [ ] Возвращает BotResponse с sendMessage (текст + keyboard)

- [x] Task: Реализовать handleHelpMessage в AppController (1274d98)
    - [ ] Формирует заголовок-инструкцию из FR5
    - [ ] Собирает описания через `menuAggregator.collectAllHelpDescriptions()`
    - [ ] Склеивает в один текст, возвращает BotResponse

- [x] Task: Реализовать handleCallback для app:main-menu и app:help (1274d98)
    - [ ] `main-menu` → вызывает `handleWelcome` с кратким текстом «Выберите действие:»
    - [ ] `help` → вызывает `handleHelpMessage`

- [x] Task: Интегрировать MenuAggregator в AppController (1274d98)
    - [ ] Добавить поле `menuAggregator: MenuAggregator`
    - [ ] Переопределить `init()` для получения MenuAggregator от BotRouter

## Фаза 4: connectRouter — чистый адаптер

- [x] Task: Обновить юнит-тесты connectRouter (8f96167)
    - [ ] `/start` вызывает `router.handleWelcome()` и `executeResponses`
    - [ ] `/help` вызывает `router.handleHelp()` и `executeResponses`
    - [ ] `callback_query` не содержит спецобработки `response.mainMenu`
    - [ ] Пользовательские тексты не захардкожены в connectRouter

- [x] Task: Переписать connectRouter (8f96167)
    - [ ] `/start` — удалить формирование текста и InlineKeyboard, использовать `router.handleWelcome()`
    - [ ] `/help` — удалить склейку текста, использовать `router.handleHelp()`
    - [ ] `callback_query` — удалить блок `if (response.mainMenu)`
    - [ ] Удалить `saveLastBotFromItems`

## Фаза 5: Интеграционные и E2E тесты

- [x] Task: Написать интеграционные тесты для главного меню в tests/bot (2d3c208)
    - [ ] Тест: `/start` возвращает приветствие и клавиатуру с кнопками
    - [ ] Тест: `/help` возвращает инструкцию и описания
    - [ ] Тест: кнопка «Помощь» (callback `app:help`) показывает инструкцию
    - [ ] Тест: кнопка «Сообщество школы» (url-кнопка) присутствует в клавиатуре

- [x] Task: Написать E2E тест пользовательского сценария (2d3c208)
    - [ ] Полный сценарий: `/start` → видит приветствие → нажимает «Помощь» → видит инструкцию → возврат в меню

## Фаза 6: Финальная проверка и ручная верификация [checkpoint: 5b85fe7]

- [x] Task: Conductor - Ручная верификация 'Финальная проверка' (Protocol in workflow.md) (5b85fe7)
