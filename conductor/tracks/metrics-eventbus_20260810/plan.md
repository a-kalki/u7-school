# План реализации — Трек 2.1: EventBus в `core`

## Фаза 1: Интерфейсы [93ae2e1]

- [x] Task: Создать `DomainEvent` интерфейс в `packages/core/src/domain/events/domain-event.ts` [93ae2e1]
- [x] Task: Создать `EventBus` интерфейс в `packages/core/src/domain/events/event-bus.ts` [93ae2e1]
- [x] Task: Написать unit-тесты на интерфейсные контракты (мок-реализация) [93ae2e1]
- [~] Task: Conductor - Ручная верификация 'Интерфейсы'

## Фаза 2: InProcEventBus [9cc0452]

- [x] Task: Реализовать `InProcEventBus` в `packages/core/src/domain/events/in-proc-event-bus.ts` [9cc0452]
    - [x] Хранение `Map<eventName, handler[]>`
    - [x] `publish` — синхронный вызов, изоляция ошибок через try/catch + console.error
    - [x] `subscribe` — возврат unsubscribe
- [x] Task: Написать unit-тесты [9cc0452]
    - [x] публикация + подписка
    - [x] несколько обработчиков
    - [x] отписка
    - [x] изоляция ошибок (синхронные + rejected Promise)
    - [x] нет обработчиков — не падает
    - [x] порядок вызова
    - [x] изоляция разных eventName
    - [x] отписка одного не затрагивает другие
- [~] Task: Conductor - Ручная верификация 'InProcEventBus'

## Фаза 3: Интеграция в AppResolver [9cc0452]

- [x] Task: Расширить `AppResolver` — добавить `eventBus: EventBus`, инициализировать `InProcEventBus` по умолчанию [9cc0452]
- [x] Task: Экспортировать публичные типы из `packages/core/src/domain/events/index.ts` (barrel) [9cc0452]
- [x] Task: Проверить: `bun run check:p core` [9cc0452]
- [~] Task: Conductor - Ручная верификация 'Интеграция в AppResolver'
