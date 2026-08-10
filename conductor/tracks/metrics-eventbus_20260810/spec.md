# Спецификация — Трек 2.1: EventBus в `core`

## Обзор

Создать интерфейс и реализацию шины доменных событий в `packages/core/src/domain/events/`. EventBus должен быть доступен всем модулям через `AppResolver`. Реализация — синхронная InProc, с изоляцией ошибок обработчиков.

## FR1 — Интерфейс `DomainEvent`

```typescript
interface DomainEvent {
  eventId: string;
  eventType: string;        // "questionnaire.completed", "module.completed"
  occurredAt: string;       // ISO
  aggregateType: string;    // "Questionnaire", "ModuleEnrollment"
  aggregateId: string;
  payload: Record<string, unknown>;
}
```

Местоположение: `packages/core/src/domain/events/domain-event.ts`

## FR2 — Интерфейс `EventBus`

```typescript
interface EventBus {
  publish<E extends DomainEvent>(event: E): void;
  subscribe<E extends DomainEvent>(
    eventType: string,
    handler: (event: E) => Promise<void>,
  ): () => void;  // возвращает unsubscribe
}
```

Местоположение: `packages/core/src/domain/events/event-bus.ts`

## FR3 — Реализация `InProcEventBus`

- Хранит `Map<eventType, handler[]>` внутри
- `publish` синхронно вызывает все обработчики в цикле (последовательно)
- Если обработчик кидает исключение — **логировать** (через `console.error`) и **продолжать** цепочку
- `subscribe` добавляет обработчик, возвращает функцию отписки
- Потокобезопасность не требуется (однопоточный runtime)

Местоположение: `packages/core/src/domain/events/in-proc-event-bus.ts`

## FR4 — Интеграция в `AppResolver`

- `AppResolver` (или его базовая конфигурация) должен предоставлять `eventBus: EventBus`
- По умолчанию — экземпляр `InProcEventBus`
- Все модули получают доступ к шине через `this.resolve.eventBus`

Местоположение: `packages/core/src/...` — найти текущий `AppResolver` и расширить

## FR5 — Тесты

Unit-тесты в `packages/core/src/domain/events/`:
- Подписка и публикация события
- Несколько обработчиков на один eventType
- Отписка (обработчик не вызывается после unsubscribe)
- Ошибка в одном обработчике не прерывает остальные
- Отсутствие обработчиков — не падает
- Порядок вызова обработчиков

## Критерии приёмки

- [ ] `DomainEvent` и `EventBus` интерфейсы в `core`
- [ ] `InProcEventBus` реализация
- [ ] `AppResolver` предоставляет `eventBus`
- [ ] Unit-тесты проходят
- [ ] `tsc --noEmit` и `biome check` проходят

## За рамками

- `publishEvents` в UseCase (→ Трек 2.3)
- Подписки в доменных модулях (→ Трек 3.2+)
- Асинхронная/внешняя реализация шины

## Контекст и связанные документы

- [Система сбора метрик (родитель)](../metrics-system.md) — видение, архитектурные решения
- [2. Questionnaire + EventBus](../metrics-questionnaire-and-events.md) — техническая спецификация
- [Дорожная карта](../development-roadmap.md) — Релиз 3
