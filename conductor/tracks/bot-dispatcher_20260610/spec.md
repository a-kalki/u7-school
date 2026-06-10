# Спецификация: Универсальный диспетчер бота

## Обзор
Рефакторинг слоя бота (`apps/u7-bot`): замена трёх handler-файлов (`top-menu-handler.ts`, `onboarding-handler.ts`, `stream-handler.ts`) на единый `dispatcher.ts`. Бот становится тонкой прослойкой: резолвит `telegramId → User` и форвардит обновления контроллерам через `ControllerRegistry`. Вся бизнес-логика (меню, роли, состояния) уходит в контроллеры.

## Функциональные требования

### FR-1: Резолв telegramId → User
- Бот на входе каждого обновления получает `User` через `UserFacade.getUserByTelegramId`
- Если пользователь не найден — регистрирует гостя через `UserFacade.registerGuest`
- `User` передаётся как `actor` во все методы контроллеров

### FR-2: Обработка `/start`
- Бот собирает `handleStart(actor)` со всех контроллеров из `ControllerRegistry`
- Сортирует `MainMenuAction[]` по `priority`
- Строит InlineKeyboard и отправляет
- Бот НЕ проверяет роли, НЕ знает о кнопках

### FR-3: Авто-маршрутизация callback'ов
- Бот извлекает первый сегмент `callback_data` (до первого `:`)
- Ищет контроллер в `ControllerRegistry` по этому имени
- Если найден — вызывает `controller.handleCallback(restData, actor, session)`
- Если не найден — сообщение об ошибке

### FR-4: Захват ввода (captureInput)
- Контроллер возвращает `BotResponse.captureInput`
- Бот сохраняет `session.activeHandler = { path, context, expiresAt }`
- Все последующие сообщения форвардятся этому обработчику через `controller.handleMessage()`
- При `releaseInput` — `session.activeHandler = null`

### FR-5: Обработка `/cancel`
- Если `activeHandler` есть — форвардит `controller.handleCancel(actor, session)`
- Если нет — «Нечего отменять. Нажмите /start»

### FR-6: Таймаут сессии
- Бот проверяет `activeHandler.expiresAt` при каждом обновлении
- Если истекло — вызывает `controller.handleTimeout(actor, session)`

### FR-7: Делегирование
- Контроллер может вернуть `BotResponse.delegate`
- Бот выполняет `sendMessage`, затем форвардит делегату (один уровень, без рекурсии)

### FR-8: Чужой callback при активном обработчике
- Если `activeHandler` указывает на контроллер A, а приходит callback для контроллера B — бот отвечает ошибкой и предлагает `/cancel`

## Нефункциональные требования
- Код в `apps/u7-bot/src/handlers/dispatcher.ts`
- Grammy-сессия (`SessionData`) обновлена: удалено поле `menu`
- `main.ts` регистрирует контроллеры в `ControllerRegistry`

## Критерии приёмки
1. `/start` показывает меню, собранное от всех контроллеров
2. Callback `stream:catalog:list` маршрутизируется в StreamController
3. `captureInput` захватывает последующие текстовые сообщения
4. `/cancel` сбрасывает активный обработчик
5. Таймаут отрабатывает и освобождает сессию
6. Все существующие тесты проходят

## За рамками
- Реализация самой логики в контроллерах — отдельные треки (stream-user-stories, onboarding-migrate)
- Продакшен-адаптер Grammy-сессии (Redis) — за рамками
