# Итоговый отчёт — Трек 2.1: EventBus в `core`

## Цель
Создать интерфейс и реализацию шины доменных событий в `packages/core/src/domain/events/`. EventBus доступен всем модулям через `AppResolver`.

## Выполненные задачи

### Фаза 1: Интерфейсы
- Создан `DomainEvent` интерфейс (6 полей: eventId, eventType, occurredAt, aggregateType, aggregateId, payload)
- Создан `EventBus` интерфейс (publish + subscribe с возвратом unsubscribe)
- Написаны тесты контрактов через MockEventBus (8 тестов)

### Фаза 2: InProcEventBus
- Реализован `InProcEventBus`:
  - `Map<eventType, handler[]>` — хранение обработчиков
  - `publish` — синхронный вызов, изоляция ошибок (try/catch + Promise.catch + console.error)
  - `subscribe` — возвращает функцию отписки
- Написаны 9 unit-тестов: подписка, мульти-хендлеры, отписка, изоляция синхронных и асинхронных ошибок, порядок, изоляция eventType

### Фаза 3: Интеграция в AppResolver
- `AppResolver.eventBus: EventBus` — обязательное поле
- `InProcEventBus` инициализируется по умолчанию во всех точках создания AppResolver
- Экспорт через `domain/index.ts` и `events/index.ts`

## Созданные файлы
- `packages/core/src/domain/events/domain-event.ts`
- `packages/core/src/domain/events/event-bus.ts`
- `packages/core/src/domain/events/in-proc-event-bus.ts`
- `packages/core/src/domain/events/index.ts`
- `packages/core/src/domain/events/index.test.ts`
- `packages/core/src/domain/events/in-proc-event-bus.test.ts`

## Изменённые файлы
- `packages/core/src/domain/types.ts` — добавлен `eventBus: EventBus` в AppResolver
- `packages/core/src/domain/index.ts` — экспорт событий
- `apps/u7-bot/src/create-api-app.ts` — инициализация InProcEventBus
- `apps/u7-bot/tests/helpers/test-app.ts` — инициализация InProcEventBus
- `apps/u7-bot/tests/e2e/onboarding.e2e.test.ts` — инициализация InProcEventBus
- `apps/u7-bot/src/controllers/onboarding/controller.test.ts` — инициализация InProcEventBus
- `apps/u7-cli/src/main.ts` — инициализация InProcEventBus
- `packages/core/src/api/module/api-module.test.ts` — мок eventBus
- `scripts/_app-factory.ts` — инициализация InProcEventBus

## Архитектурные решения
- **Синхронная InProc реализация:** потокобезопасность не требуется (однопоточный Bun runtime)
- **Изоляция ошибок:** синхронные исключения — try/catch, асинхронные — Promise.catch. Ошибки логируются через console.error, цепочка обработчиков продолжается
- **AppResolver как точка доступа:** все модули получают EventBus через `this.resolve.eventBus`, без прямых импортов реализации

## Отклонения от плана
Нет.

## Известные ограничения
- Шина синхронная — не подходит для долгих обработчиков (блокируют event loop)
- Нет механизма гарантированной доставки или повторов
- Нет приоритетов обработчиков
