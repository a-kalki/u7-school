# Итоговый отчёт — Трек 2.1: EventBus в `core`

## Цель
Создать интерфейс и реализацию шины доменных событий. Типы в `domain/events/`, реализация в `infra/`. EventBus доступен всем модулям через `AppResolver`.

## Выполненные задачи

### Фаза 1: Интерфейсы
- Создан `DomainEvent` интерфейс (6 полей: eventId, eventName, occurredAt, aggregateName, aggregateId, payload)
- Создан `EventBus` интерфейс (publish + subscribe по eventName с возвратом unsubscribe)
- Написаны тесты контрактов через InProcEventBus (7 тестов)

### Фаза 2: InProcEventBus
- Реализован `InProcEventBus` в `infra/in-proc-event-bus.ts`:
  - `Map<eventName, handler[]>` — хранение обработчиков
  - `publish` — синхронный вызов, изоляция ошибок (try/catch + Promise.catch + console.error)
  - `subscribe` — возвращает функцию отписки
- Написаны 9 unit-тестов: подписка, мульти-хендлеры, отписка, изоляция синхронных и асинхронных ошибок, порядок, изоляция eventName

### Фаза 3: Интеграция в AppResolver
- `AppResolver.eventBus: EventBus` — обязательное поле
- `InProcEventBus` инициализируется во всех точках создания AppResolver
- Экспорт типов через `domain/index.ts`, реализации через `infra/index.ts`

## Созданные файлы (6)
- `packages/core/src/domain/events/domain-event.ts`
- `packages/core/src/domain/events/event-bus.ts`
- `packages/core/src/domain/events/index.ts`
- `packages/core/src/domain/events/index.test.ts`
- `packages/core/src/infra/in-proc-event-bus.ts`
- `packages/core/src/infra/in-proc-event-bus.test.ts`

## Изменённые файлы (11)
- `packages/core/src/domain/types.ts` — `eventBus: EventBus` в AppResolver
- `packages/core/src/domain/index.ts` — экспорт DomainEvent, EventBus (типы)
- `packages/core/src/infra/index.ts` — экспорт InProcEventBus
- `apps/u7-bot/src/create-api-app.ts` — `eventBus: new InProcEventBus()`
- `apps/u7-bot/tests/helpers/test-app.ts` — `eventBus: new InProcEventBus()`
- `apps/u7-bot/tests/e2e/onboarding.e2e.test.ts` — `eventBus: new InProcEventBus()`
- `apps/u7-bot/src/controllers/onboarding/controller.test.ts` — `eventBus: new InProcEventBus()`
- `apps/u7-cli/src/main.ts` — `eventBus: new InProcEventBus()`
- `packages/core/src/api/module/api-module.test.ts` — мок eventBus
- `scripts/_app-factory.ts` — `eventBus: new InProcEventBus()`
- `conductor/` — обновлены метрики-документы (eventType→eventName, aggregateType→aggregateName)

## Архитектурные решения
- **eventName / aggregateName:** имя события и имя агрегата разделены (вместо `"questionnaire.completed"` — `eventName: "completed"`, `aggregateName: "Questionnaire"`). subscribe работает по eventName
- **InProcEventBus в `infra/`:** реализация отделена от интерфейсов в `domain/events/`
- **Синхронная InProc реализация:** потокобезопасность не требуется (однопоточный Bun runtime)
- **Изоляция ошибок:** синхронные исключения — try/catch, асинхронные — Promise.catch. Ошибки логируются, цепочка продолжается
- **AppResolver как точка доступа:** все модули получают EventBus через `this.resolve.eventBus`

## Отклонения от плана
- Поля переименованы: `eventType` → `eventName`, `aggregateType` → `aggregateName`
- `InProcEventBus` перенесён из `domain/events/` в `infra/`

## Известные ограничения
- Шина синхронная — не подходит для долгих обработчиков
- Нет фильтрации по aggregateName в subscribe
- Нет приоритетов обработчиков
