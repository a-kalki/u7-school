# План реализации: Универсальный диспетчер бота

## Фаза 1: Обновление типов сессии и контекста

- [x] Task: Обновить SessionData — добавить activeHandler, удалить menu (65dee6f)
    - [x] В `apps/u7-bot/src/context.ts`
- [x] Task: Написать тесты на новый SessionData (65dee6f)
    - [x] Тест: activeHandler создаётся и очищается (покрыто в тестах диспетчера)

## Фаза 2: Резолвер пользователя

- [x] Task: Создать resolveUser(telegramId, name?) в dispatcher (65dee6f)
    - [x] Вызов `userFacade.getUserByTelegramId`
    - [x] Fallback: `userFacade.registerGuest`
    - [x] Возвращает `User`
- [x] Task: Написать тесты на resolveUser (65dee6f)
    - [x] Тест: существующий пользователь
    - [x] Тест: новый гость

## Фаза 3: Основной диспетчер

- [ ] Task: Создать registerDispatcher(bot, controllers, userFacade, logger)
    - [ ] Диспетчер хранит контроллеры во внутренней Map с проверкой уникальности имени
    - [ ] Обработка `/start` — сбор handleStart со всех контроллеров
    - [ ] Обработка `/cancel` — форвард активному контроллеру
    - [ ] Обработка callback — маршрутизация по префиксу
    - [ ] Обработка message — форвард активному контроллеру через handleMessage
    - [ ] Логика таймаута: проверка expiresAt
    - [ ] Логика чужого callback при активном обработчике
- [ ] Task: Написать тесты на диспетчер
    - [ ] Тест: /start агрегирует кнопки
    - [ ] Тест: callback маршрутизируется по префиксу
    - [ ] Тест: неизвестный префикс → ошибка
    - [ ] Тест: /cancel с активным обработчиком
    - [ ] Тест: /cancel без активного обработчика
    - [ ] Тест: captureInput → последующие сообщения идут в контроллер
    - [ ] Тест: releaseInput → сессия очищается
    - [ ] Тест: чужой callback при активном обработчике → отказ
    - [ ] Тест: таймаут → handleTimeout

## Фаза 4: Интеграция в main.ts

- [ ] Task: Обновить main.ts — регистрация контроллеров в диспетчере
    - [ ] Убрать прямые импорты контроллеров в handler'ы
    - [ ] Передать StreamController и OnboardingController в диспетчер
    - [ ] Вызвать registerDispatcher вместо старых handler'ов
- [ ] Task: Проверить, что bot.ts не требует изменений
- [ ] Task: Убедиться, что старые handler'ы ЕЩЁ не удалены (удаление — в треке bot-cleanup)

## Фаза 5: Интеграционное тестирование

- [ ] Task: Написать интеграционный тест: полный цикл /start → callback → captureInput → /cancel
- [ ] Task: Запустить все тесты: `bun test`
- [ ] Task: Conductor - User Manual Verification 'Фаза 5' (Protocol in workflow.md)
