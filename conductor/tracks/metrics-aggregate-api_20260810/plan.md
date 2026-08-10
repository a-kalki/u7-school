# План реализации — Трек 2.2: API событий в Aggregate

## Фаза 1: ArMeta.events

- [ ] Task: Добавить поле `events: DomainEvent` в `ArMeta`
- [ ] Task: Написать unit-тест на типовую совместимость (агрегат с `events: never` компилируется)
- [ ] Task: Conductor - Ручная верификация 'ArMeta.events'

## Фаза 2: Методы Aggregate

- [ ] Task: Добавить `_events` массив, `addEvent()` (protected), `hasEvents()` (public), `flushEvents()` (public)
- [ ] Task: Написать unit-тесты
    - [ ] addEvent добавляет
    - [ ] hasEvents возвращает true/false
    - [ ] flushEvents возвращает и очищает
    - [ ] повторный flushEvents — пустой массив
- [ ] Task: Проверить что существующие агрегаты (во всех пакетах) компилируются с `events: never`
- [ ] Task: Проверить `bun run check:p core`
- [ ] Task: Conductor - Ручная верификация 'Методы Aggregate'
