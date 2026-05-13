# План реализации: Telegram-бот onboarding

## Фаза 1: Инфраструктура бота
- [ ] Task: Авторегистрация бота в @u7/user: если бота нет в БД, регистрируем через .env `adminTelegramId` как SYSTEM-пользователя с ролью ADMIN
- [ ] Task: Установить @grammyjs/conversations
- [ ] Task: Настроить .env.development, .env.production (BOT_TOKEN, NEWS_GROUP_LINK)
- [ ] Task: Настроить Bot instance, session middleware (JSON storage), error handler
- [ ] Task: Создать app объект с дженериком для типизации команд UC
- [ ] Task: Определить архитектуру: handlers напрямую через app или отдельный controller слой
- [ ] Task: Написать тесты инфраструктуры (app, config)
- [ ] Task: Conductor - User Manual Verification 'Инфраструктура' (Protocol in workflow.md)

## Фаза 2: /start и меню
- [ ] Task: Реализовать /start handler (GetUserByTelegramIdUc / RegisterUserUc)
- [ ] Task: Inline-меню: «Быть в курсе» / «Стать студентом»
- [ ] Task: Реализовать логику повторного /start (candidate / subscriber / guest)
- [ ] Task: Handler «Быть в курсе» — показ ссылки на группу
- [ ] Task: Написать тесты
- [ ] Task: Conductor - User Manual Verification 'Меню' (Protocol in workflow.md)

## Фаза 3: Conversation опросник
- [ ] Task: Создать conversation для анкеты
- [ ] Task: Inline-клавиатуры: множественный выбор с ✅
- [ ] Task: Одиночный выбор
- [ ] Task: Ветвление (base/intensive)
- [ ] Task: Предпросмотр + кнопки «Отправить» / «Изменить ответы»
- [ ] Task: Реализовать «Изменить ответы» — возврат к нужному шагу
- [ ] Task: /cancel handler (удаляет session data, возвращает в меню)
- [ ] Task: Написать тесты
- [ ] Task: Conductor - User Manual Verification 'Conversation' (Protocol in workflow.md)

## Фаза 4: Интеграция с доменом
- [ ] Task: Интеграция CreateApplicationUc через app объект
- [ ] Task: Интеграция AddRoleToUserUc (CANDIDATE) — через ApplicationDs
- [ ] Task: Выдача ссылки на группу по завершению анкеты
- [ ] Task: Написать интеграционные тесты
- [ ] Task: Conductor - User Manual Verification 'Интеграция' (Protocol in workflow.md)

## Фаза 5: Финал
- [ ] Task: Проверить покрытие
- [ ] Task: Проверить lint и tsc
- [ ] Task: Обновить README бота
- [ ] Task: Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
