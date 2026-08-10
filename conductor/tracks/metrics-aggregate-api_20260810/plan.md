# План реализации — Трек 2.2: API событий в Aggregate

## Фаза 1: ArMeta.events

- [x] Task: Добавить поле `events: DomainEvent` в `ArMeta` [3e1225e]
- [x] Task: Написать unit-тест на типовую совместимость (агрегат с `events: never` компилируется) [3e1225e]
- [~] Task: Conductor - Ручная верификация 'ArMeta.events'

## Фаза 2: Методы Aggregate

- [x] Task: Добавить `_events` массив, `addEvent()` (protected), `hasEvents()` (public), `flushEvents()` (public) [3e1225e]
- [x] Task: Написать unit-тесты [3e1225e]
    - [x] addEvent добавляет
    - [x] hasEvents возвращает true/false
    - [x] flushEvents возвращает и очищает
    - [x] повторный flushEvents — пустой массив
- [x] Task: Проверить что существующие агрегаты (во всех пакетах) компилируются с `events: never` [3e1225e]
- [x] Task: Проверить `bun run check:p core` [3e1225e]
- [~] Task: Conductor - Ручная верификация 'Методы Aggregate'
