# План реализации: Базовые классы контроллеров в core

## Фаза 1: Типы и интерфейсы

- [x] Task: Расширить BotUpdate новыми типами (document, photo, voice) `6aebd9f`
    - [x] Добавить типы в `packages/core/src/ui/bot/types.ts`
- [x] Task: Расширить BotResponse полями captureInput, releaseInput, delegate `21b1a04`
    - [x] Добавить `captureInput?: { path, context?, ttlSeconds? }`
    - [x] Добавить `releaseInput?: boolean`
    - [x] Добавить `delegate?: { path }`
- [ ] Task: Создать SessionData с activeHandler
    - [ ] Интерфейс `SessionData` в `types.ts`
- [ ] Task: Создать MainMenuAction
    - [ ] Интерфейс `{ text, action, priority }` в `types.ts`

## Фаза 2: BotUserStory

- [ ] Task: Создать абстрактный класс BotUserStory<TAppMeta>
    - [ ] Поле `name`, `api`, `shortIds`
    - [ ] Методы: `init`, `reset`, `cb`, `stripPrefix`, `shrink`, `expand`
    - [ ] Абстрактные: `handleCallback`, `handleMessage`
    - [ ] С реализацией по умолчанию: `handleStart`, `handleCancel`, `handleTimeout`
- [ ] Task: Написать тесты на BotUserStory
    - [ ] Тест: `cb` добавляет префикс
    - [ ] Тест: `stripPrefix` убирает префикс
    - [ ] Тест: `shrink`/`expand` работают
    - [ ] Тест: `handleStart` по умолчанию возвращает null
    - [ ] Тест: `handleCancel` по умолчанию возвращает releaseInput

## Фаза 3: Обновлённый BotController

- [ ] Task: Обновить BotController<TAppMeta>
    - [ ] Добавить `name`, `stories`
    - [ ] Методы: `init`, `handleCallback`, `handleMessage`, `handleStart`, `handleCancel`, `handleTimeout`, `reset`
    - [ ] Хелперы: `cb`, `stripPrefix`, `findStory`
    - [ ] Делегирование в story по префиксу callback
- [ ] Task: Написать тесты на BotController
    - [ ] Тест: `init` вызывает `init` у всех стори
    - [ ] Тест: `reset` вызывает `reset` у всех стори
    - [ ] Тест: `handleStart` агрегирует от всех стори с префиксами
    - [ ] Тест: `findStory` находит по имени
    - [ ] Тест: `handleCancel` делегирует активной стори

## Фаза 4: ControllerRegistry и экспорты

- [ ] Task: Создать ControllerRegistry
    - [ ] register с проверкой уникальности имени
    - [ ] get, getAll
- [ ] Task: Написать тесты на ControllerRegistry
    - [ ] Тест: успешная регистрация
    - [ ] Тест: ошибка при дубликате имени
- [ ] Task: Обновить экспорты в `packages/core/src/ui/index.ts`
    - [ ] Экспортировать все новые классы и типы
- [ ] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)
