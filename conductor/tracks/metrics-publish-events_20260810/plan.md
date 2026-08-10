# План реализации — Трек 2.3: publishEvents в UseCase

## Фаза 1: ModuleResolver.eventBus

- [ ] Task: Добавить `eventBus?: EventBus` в `ModuleResolver`
- [ ] Task: Проверить что существующие тесты не ломаются (eventBus опционален)
- [ ] Task: Conductor - Ручная верификация 'ModuleResolver'

## Фаза 2: publishEvents в UseCase

- [ ] Task: Добавить `publishEvents(ar)` protected метод в базовый `UseCase`
- [ ] Task: Написать unit-тесты
    - [ ] агрегат с событиями → публикуются
    - [ ] без EventBus → не падает
    - [ ] агрегат без событий → не падает
- [ ] Task: Проверить `bun run check:p core`
- [ ] Task: Conductor - Ручная верификация 'publishEvents'
