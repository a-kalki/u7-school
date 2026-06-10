# План реализации: Универсальный диспетчер бота

## Фаза 1: Обновление типов сессии и контекста

- [ ] Task: Обновить SessionData — добавить activeHandler, удалить menu
    - [ ] В `apps/u7-bot/src/context.ts`
- [ ] Task: Написать тесты на новый SessionData
    - [ ] Тест: activeHandler создаётся и очищается

## Фаза 2: Резолвер пользователя

- [ ] Task: Создать resolveUser(telegramId, name?) в dispatcher
    - [ ] Вызов `userFacade.getUserByTelegramId`
    - [ ] Fallback: `userFacade.registerGuest`
    - [ ] Возвращает `User`
- [ ] Task: Написать тесты на resolveUser
    - [ ] Тест: существующий пользователь
    - [ ] Тест: новый гость

## Фаза 3: Основной диспетчер

- [ ] Task: Создать registerDispatcher(bot, registry, userFacade, logger)
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

- [ ] Task: Обновить main.ts — ControllerRegistry вместо прямых вызовов
    - [ ] Убрать прямые импорты контроллеров в handler'ы
    - [ ] Зарегистрировать StreamController и OnboardingController в registry
    - [ ] Вызвать registerDispatcher вместо старых handler'ов
- [ ] Task: Проверить, что bot.ts не требует изменений
- [ ] Task: Убедиться, что старые handler'ы ЕЩЁ не удалены (удаление — в треке bot-cleanup)

## Фаза 5: Интеграционное тестирование

- [ ] Task: Написать интеграционный тест: полный цикл /start → callback → captureInput → /cancel
- [ ] Task: Запустить все тесты: `bun test`
- [ ] Task: Conductor - User Manual Verification 'Фаза 5' (Protocol in workflow.md)
