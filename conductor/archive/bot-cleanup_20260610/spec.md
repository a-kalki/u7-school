# Спецификация: Чистка и финализация

## Обзор
После миграции всех контроллеров на новую архитектуру, старые handler-файлы бота больше не нужны. Нужно удалить их, убедиться что бот работает через единый `dispatcher.ts`, и провести финальное тестирование.

## Функциональные требования

### FR-1: Удаление старых handler'ов
- Удалить `apps/u7-bot/src/handlers/top-menu-handler.ts`
- Удалить `apps/u7-bot/src/handlers/onboarding-handler.ts`
- Удалить `apps/u7-bot/src/handlers/stream-handler.ts`
- Удалить `apps/u7-bot/src/handlers/top-menu-handler.test.ts` (если есть)

### FR-2: main.ts — только dispatcher
- Убрать вызовы `registerTopMenuHandler`, `registerOnboardingHandler`, `registerStreamHandler`
- Оставить только `registerDispatcher(bot, registry, userFacade, logger)`
- Все контроллеры регистрируются в диспетчере перед вызовом

### FR-3: Финальное тестирование
- `bun test` — все тесты проходят
- `bun run check` — линтер, типы, тесты
- Ручная проверка: `/start` показывает меню, кнопки работают

### FR-4: Обновление ARCHITECTURE.md
- Отметить этапы 1-5 как завершённые (или удалить раздел «Этапы реализации»)

## Критерии приёмки
1. Старые handler-файлы удалены
2. `main.ts` использует только `registerDispatcher`
3. `bun test` — все тесты проходят
4. `bun run check` — без ошибок
5. Приложение запускается без ошибок

## За рамками
- Изменения в функциональности бота
- Деплой
