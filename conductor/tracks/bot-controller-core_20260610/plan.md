# План реализации: Базовые классы контроллеров в core

## Фаза 1: Типы и интерфейсы [checkpoint: bc861c2]

- [x] Task: Расширить BotUpdate новыми типами (document, photo, voice) `6aebd9f`
    - [x] Добавить типы в `packages/core/src/ui/bot/types.ts`
- [x] Task: Расширить BotResponse полями captureInput, releaseInput, delegate `21b1a04`
    - [x] Добавить `captureInput?: { path, context?, ttlSeconds? }`
    - [x] Добавить `releaseInput?: boolean`
    - [x] Добавить `delegate?: { path }`
- [x] Task: Создать SessionData с activeHandler `b41e3c0`
    - [x] Интерфейс `SessionData` в `types.ts`
- [x] Task: Создать MainMenuAction `4bd65eb`
    - [x] Интерфейс `{ text, action, priority }` в `types.ts`

## Фаза 2: BotUserStory [checkpoint: 5813f48]

- [x] Task: Создать абстрактный класс BotUserStory<TAppMeta> `19ea27c`
    - [x] Поле `name`, `api`, `shortIds`
    - [x] Методы: `init`, `reset`, `cb`, `stripPrefix`, `shrink`, `expand`
    - [x] Абстрактные: `handleCallback`, `handleMessage`
    - [x] С реализацией по умолчанию: `handleStart`, `handleCancel`, `handleTimeout`
- [x] Task: Написать тесты на BotUserStory `19ea27c`
    - [x] Тест: `cb` добавляет префикс
    - [x] Тест: `stripPrefix` убирает префикс
    - [x] Тест: `shrink`/`expand` работают
    - [x] Тест: `handleStart` по умолчанию возвращает null
    - [x] Тест: `handleCancel` по умолчанию возвращает releaseInput

## Фаза 3: Обновлённый BotController [checkpoint: ce1c9d7]

- [x] Task: Обновить BotController<TAppMeta> `c332b7e`
    - [x] Добавить `name`, `stories`
    - [x] Методы: `init`, `handleCallback`, `handleMessage`, `handleStart`, `handleCancel`, `handleTimeout`, `reset`
    - [x] Хелперы: `cb`, `stripPrefix`, `findStory`
    - [x] Делегирование в story по префиксу callback
- [x] Task: Написать тесты на BotController `c332b7e`
    - [x] Тест: `init` вызывает `init` у всех стори
    - [x] Тест: `reset` вызывает `reset` у всех стори
    - [x] Тест: `handleStart` агрегирует от всех стори с префиксами
    - [x] Тест: `findStory` находит по имени
    - [x] Тест: `handleCancel` делегирует активной стори
