# Итоговый отчёт: Базовые классы контроллеров в core

## Цель трека
Создать новые базовые абстракции для контроллеров Telegram-бота в пакете `@u7-scl/core`:
`BotController<TAppMeta, TActor>`, `BotUserStory<TAppMeta, TActor>` и вспомогательные типы.

## Выполненные задачи

### Фаза 1: Типы и интерфейсы
- **Расширен BotUpdate** — добавлены типы `document`, `photo`, `voice` с полем `fileId`
- **Расширен BotResponse** — добавлены `captureInput`, `releaseInput`, `delegate`
- **Создан SessionData** — с `activeHandler: { path, context?, expiresAt? } | null`
- **Создан MainMenuAction** — `{ text, action, priority }`

### Фаза 2: BotUserStory
- Абстрактный класс `BotUserStory<TAppMeta, TActor>` с полями `name`, `api`, `shortIds`
- Protected-методы: `cb`, `stripPrefix`, `shrink` (авто-генерация 8-символьного hex-ключа), `expand`
- Абстрактные: `handleCallback`, `handleMessage`
- С реализацией по умолчанию: `handleStart` (null), `handleCancel` (releaseInput), `handleTimeout` (releaseInput + сообщение)
- Перенесён `StringUtility` из `~/Downloads/` в `shared/string-utility.ts` — используется `shrink` для генерации ключей

### Фаза 3: Обновлённый BotController
- Дженерик `BotController<TAppMeta, TActor>` с полями `name`, `stories`
- Методы: `init`, `reset`, `handleCallback`, `handleMessage`, `handleStart`, `handleCancel`, `handleTimeout`
- Хелперы: `cb`, `stripPrefix`, `findStory`
- Делегирование callback'ов в стори по префиксу, сообщений — активной стори по `activeHandler.path`
- **Убран `handleUpdate` и обратная совместимость** — старые контроллеры будут переписаны
- `TActor = unknown` — без ограничений (в базовых классах актор не используется)

### Удалено после ревью
- **ControllerRegistry** удалён — хранение контроллеров будет встроено в диспетчер

## Изменённые/созданные файлы
- `packages/core/src/ui/bot/types.ts` — расширенные типы
- `packages/core/src/ui/bot/types.test.ts` — 14 тестов
- `packages/core/src/ui/bot/bot-user-story.ts` — новый класс
- `packages/core/src/ui/bot/bot-user-story.test.ts` — 15 тестов
- `packages/core/src/ui/bot/controller/bot-controller.ts` — переписан
- `packages/core/src/ui/bot/controller/bot-controller.test.ts` — 15 тестов
- `packages/core/src/shared/string-utility.ts` — новый
- `packages/core/src/shared/string-utility.test.ts` — 18 тестов
- `packages/core/src/ui/index.ts` — обновлены экспорты
- `packages/core/src/shared/index.ts` — добавлен экспорт stringUtility

## Архитектурные решения
- **TActor вместо actorId** — методы принимают объект актора, а не строку. Базовые классы не накладывают ограничений (`TActor = unknown`)
- **Нет обратной совместимости** — `handleUpdate` удалён. Все контроллеры будут переписаны под новую архитектуру
- **ControllerRegistry удалён** — хранение и поиск контроллеров будет в диспетчере
- **shrink с авто-ключами** — использует `StringUtility.random('hhhhhhhh', '')` для генерации 8-символьных hex-идентификаторов

## Известные ограничения
- Старые контроллеры (`OnboardingController`, `StreamController`) не компилируются — требуют миграции (следующие треки)
