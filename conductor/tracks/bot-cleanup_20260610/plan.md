# План реализации: Чистка и финализация

## Фаза 1: Удаление старых handler'ов

- [x] Task: Удалить top-menu-handler.ts и его тесты `ab09312`
    - [x] Удалить `apps/u7-bot/src/handlers/top-menu-handler.ts`
    - [x] Удалить `apps/u7-bot/src/handlers/top-menu-handler.test.ts`
- [x] Task: Удалить onboarding-handler.ts `5d298d5`
    - [x] Удалить `apps/u7-bot/src/handlers/onboarding-handler.ts`
- [x] Task: Удалить stream-handler.ts `acaff0c`
    - [x] Удалить `apps/u7-bot/src/handlers/stream-handler.ts`

## Фаза 2: Обновление main.ts

- [ ] Task: Убрать импорты старых handler'ов
    - [ ] Убрать `registerTopMenuHandler`
    - [ ] Убрать `registerOnboardingHandler`
    - [ ] Убрать `registerStreamHandler`
- [ ] Task: Оставить только registerDispatcher
- [ ] Task: Перенести register/dispatch логику из main.ts в диспетчер
    - [ ] Зарегистрировать StreamController и OnboardingController
    - [ ] Вызвать registerDispatcher
- [ ] Task: Проверить, что все импорты чистые (нет неиспользуемых)

## Фаза 3: Финальная проверка качества

- [ ] Task: Запустить все тесты: `bun test`
    - [ ] Все тесты проходят
- [ ] Task: Проверить покрытие: `bun test --coverage`
    - [ ] >80% для всех изменённых модулей
- [ ] Task: Проверить линтер: `bun run lint`
    - [ ] Нет ошибок
- [ ] Task: Проверить типы: `bun run tslint`
    - [ ] Нет ошибок
- [ ] Task: Полная проверка: `bun run check`
    - [ ] Всё чисто

## Фаза 4: Обновление документации

- [ ] Task: Обновить ARCHITECTURE.md — отметить завершение этапов
- [ ] Task: Проверить, что все треки задокументированы

## Фаза 5: Ручная верификация

- [ ] Task: Запустить бота: `bun run dev`
- [ ] Task: Проверить /start — меню с кнопками от всех контроллеров
- [ ] Task: Проверить callback потоков — список, карточка, запись
- [ ] Task: Проверить анкету — запуск, ответы, /cancel
- [ ] Task: Conductor - User Manual Verification 'Фаза 5' (Protocol in workflow.md)
