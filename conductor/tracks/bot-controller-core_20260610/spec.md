# Спецификация: Базовые классы контроллеров в core

## Обзор
Создать новые базовые абстракции для контроллеров Telegram-бота в пакете `@u7-scl/core`. Текущий `BotController` — минимальный абстрактный класс с `handleUpdate`. Нужно расширить его и добавить `BotUserStory<TAppMeta>` для инкапсуляции отдельных пользовательских сценариев внутри сложных контроллеров (как Stream).

## Функциональные требования

### FR-1: `BotController<TAppMeta>` — обновлённый базовый класс
- `name: string` — уникальное имя контроллера
- `stories: BotUserStory<TAppMeta>[]` — зарегистрированные стори (может быть пустым)
- `init(api: ApiApp<TAppMeta>)` — инициализация, вызывает `init` у всех стори
- `handleCallback(data, actor, session)` — обработка callback (data без префикса контроллера)
- `handleMessage(update, actor, session)` — обработка сообщений (когда активен через captureInput)
- `handleStart(actor)` — возвращает `MainMenuAction[]` для главного меню
- `handleCancel(actor, session)` — отмена текущего действия
- `handleTimeout(actor, session)` — таймаут активного обработчика
- `reset()` — сброс временных данных всех стори
- `cb(action)`, `stripPrefix(data)` — хелперы для префиксов callback
- `findStory(name)` — поиск стори по имени

### FR-2: `BotUserStory<TAppMeta>` — абстрактный класс для сценариев
- `name: string` — уникальное имя в рамках контроллера
- `api: ApiApp<TAppMeta>` — ссылка на API (устанавливается в `init`)
- `shortIds: Map<string, string>` — для сжатия длинных callback_data
- `init(api)`, `reset()` — жизненный цикл
- `handleCallback(action, actor, session)` — обработка callback
- `handleMessage(update, actor, session)` — обработка сообщений
- `handleStart(actor)` — кнопка в меню (null → не показывать)
- `handleCancel(actor, session)` — отмена (по умолчанию: releaseInput)
- `handleTimeout(actor, session)` — таймаут (по умолчанию: releaseInput + сообщение)
- `cb(action)`, `stripPrefix(data)` — хелперы префиксов
- `shrink(key, value)`, `expand(key)` — short ID

## Нефункциональные требования
- `BotUpdate` — добавить `document`, `photo`, `voice`
- `BotResponse` — добавить `captureInput`, `releaseInput`, `delegate`
- `SessionData` — с `activeHandler: { path, context, expiresAt } | null`
- `MainMenuAction` — `{ text, action, priority }`

### FR-3: Расширенные типы
- Все классы и типы в `packages/core/src/ui/bot/`
- Обратная совместимость: старый `BotController` и `handleUpdate` работают до миграции
- Дженерик `TAppMeta extends AppMeta` для типобезопасных вызовов API

## Критерии приёмки
1. `BotUserStory` и обновлённый `BotController` компилируются без ошибок
2. Типы `BotResponse`, `SessionData`, `MainMenuAction` экспортируются из `@u7-scl/core/ui`
3. Существующие тесты `core` проходят

## За рамками
- Миграция конкретных контроллеров (stream, onboarding) — это отдельные треки
- Реализация диспетчера бота — отдельный трек
