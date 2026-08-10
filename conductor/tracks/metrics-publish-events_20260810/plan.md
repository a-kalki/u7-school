# План реализации — Трек 2.3: publishEvents в UseCase

## Фаза 1: ModuleResolver.eventBus

- [x] Task: Добавить `eventBus?: EventBus` в `ModuleResolver`
- [x] Task: Проверить что существующие тесты не ломаются (eventBus опционален)
- [~] Task: Conductor - Ручная верификация 'ModuleResolver'

## Фаза 2: publishEvents в UseCase

- [x] Task: Добавить `publishEvents(ar)` protected метод в базовый `UseCase`
- [x] Task: Написать unit-тесты
    - [x] агрегат с событиями → публикуются
    - [x] без EventBus → не падает
    - [x] агрегат без событий → не падает
    - [x] несколько событий публикуются все
- [x] Task: Проверить `bun run check:p core`
- [~] Task: Conductor - Ручная верификация 'publishEvents'
