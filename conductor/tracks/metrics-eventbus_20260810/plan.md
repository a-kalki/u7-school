# План реализации — Трек 2.1: EventBus в `core`

## Фаза 1: Интерфейсы

- [x] Task: Создать `DomainEvent` интерфейс в `packages/core/src/domain/events/domain-event.ts` [93ae2e1]
- [x] Task: Создать `EventBus` интерфейс в `packages/core/src/domain/events/event-bus.ts` [93ae2e1]
- [x] Task: Написать unit-тесты на интерфейсные контракты (мок-реализация) [93ae2e1]
- [ ] Task: Conductor - Ручная верификация 'Интерфейсы'

## Фаза 2: InProcEventBus

- [ ] Task: Реализовать `InProcEventBus` в `packages/core/src/domain/events/in-proc-event-bus.ts`
    - [ ] Хранение `Map<eventType, handler[]>`
    - [ ] `publish` — синхронный вызов, изоляция ошибок через try/catch + console.error
    - [ ] `subscribe` — возврат unsubscribe
- [ ] Task: Написать unit-тесты
    - [ ] публикация + подписка
    - [ ] несколько обработчиков
    - [ ] отписка
    - [ ] изоляция ошибок
    - [ ] нет обработчиков — не падает
    - [ ] порядок вызова
- [ ] Task: Conductor - Ручная верификация 'InProcEventBus'

## Фаза 3: Интеграция в AppResolver

- [ ] Task: Расширить `AppResolver` — добавить `eventBus: EventBus`, инициализировать `InProcEventBus` по умолчанию
- [ ] Task: Экспортировать публичные типы из `packages/core/src/domain/events/index.ts` (barrel)
- [ ] Task: Проверить: `bun run check:p core`
- [ ] Task: Conductor - Ручная верификация 'Интеграция в AppResolver'
