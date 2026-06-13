# Итоговый отчёт: Универсальный диспетчер бота (бот-диспетчер)

**Трек:** `bot-dispatcher_20260610`  
**Дата завершения:** 10.06.2026

## Цель

Рефакторинг слоя бота (`apps/u7-bot`): замена трёх handler-файлов на единый `router.ts` + вынос `BotRouter` в `@u7-scl/core/ui`.

## Выполненные задачи

### Фаза 1: Обновление SessionData
- Удалено поле `menu`, добавлен `activeHandler` с `path`/`context`/`expiresAt`
- `SessionData` теперь единый тип из `@u7-scl/core/ui`
- `bot.ts`: инициализация сессии с `activeHandler: null`
- `OnboardingController` и `StreamController`: добавлен обязательный `name`

### Фаза 2: Резолвер пользователя
- Функция `resolveUser(telegramId, name?)` — поиск через `getUserByTelegramId`, fallback на `registerGuest`

### Фаза 3: BotRouter в core
- Новый класс `BotRouter<TAppMeta, TActor>` в `@u7-scl/core/ui`
- Хранение контроллеров в Map с проверкой уникальности
- `collectMainMenu`, `handleCallback`, `handleMessage`, `handleCancel`, `handleTimeout`
- Управление `activeHandler` (captureInput/releaseInput)
- Делегирование (один уровень), проверка чужого callback, таймауты
- 22 теста в core

### Фаза 4: Grammy-адаптер connectRouter
- `connectRouter(bot, router, userFacade, botAdminUuid, logger)` — тонкая прослойка
- Интеграция в `main.ts`

### Фаза 5: Тестирование
- 700+ тестов проходят (0 ошибок)
- Интеграционный тест полного цикла: `/start → callback → captureInput → /cancel`

## Изменённые файлы

- `packages/core/src/ui/index.ts`
- `packages/core/src/ui/bot/router/bot-router.ts` (новый)
- `packages/core/src/ui/bot/router/bot-router.test.ts` (новый)
- `packages/core/src/ui/bot/types.ts` (SessionData)
- `apps/u7-bot/src/context.ts`
- `apps/u7-bot/src/bot.ts`
- `apps/u7-bot/src/handlers/router.ts` (новый)
- `apps/u7-bot/src/handlers/router.test.ts` (новый)
- `apps/u7-bot/src/main.ts`
- `packages/onboarding/.../onboarding-controller.ts` (добавлен name, исправлен тип)
- `packages/stream/.../stream-controller.ts` (добавлен name)
- Старые handler'ы помечены `@ts-nocheck` (будут удалены в треке bot-cleanup)

## Архитектурные решения

- **BotRouter в core** — чистая бизнес-логика маршрутизации, не зависит от Grammy
- **connectRouter в apps** — тонкий Grammy-адаптер (resolveUser + executeResponses)
- **SessionData без menu** — полный отказ от старой модели, `activeHandler` как единственный механизм
- **TActor = unknown** — роутер не накладывает ограничений на тип актора

## Отклонения от плана

- `BotDispatcher` переименован в `BotRouter` (точнее отражает суть)
- `registerDispatcher` → `connectRouter`
- `controller-registry` удалён в предыдущем треке (хранение встроено в BotRouter)
- Старые handler'ы помечены `@ts-nocheck` вместо удаления (удаление — в треке bot-cleanup)

## Известные ограничения

- `StreamController` и `OnboardingController` ещё не мигрированы на новый API (их `handleStart`/`handleCallback` возвращают заглушки)
- Миграция запланирована в треках `stream-user-stories` и `onboarding-migrate`
