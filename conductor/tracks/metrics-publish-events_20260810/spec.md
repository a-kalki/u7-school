# Спецификация — Трек 2.3: `publishEvents` в `UseCase`

## Обзор

Добавить в абстрактный `UseCase` метод для автоматической публикации событий, накопленных агрегатом. Интегрировать `EventBus` в `ModuleResolver`.

## FR1 — `publishEvents` в `UseCase`

```typescript
abstract class UseCase<TMeta extends UcMeta, TResolve> {
  protected publishEvents(ar: Aggregate<ArMeta>): void {
    if (!ar.hasEvents()) return;
    const events = ar.flushEvents();
    const eventBus = (this.resolve as { eventBus?: EventBus }).eventBus;
    if (!eventBus) return;  // в тестах eventBus может отсутствовать
    for (const event of events) {
      eventBus.publish(event);
    }
  }
}
```

Местоположение: `packages/core/src/api/use-case.ts` (или где находится базовый UseCase)

## FR2 — Контракт в UseCase

Порядок вызовов:
1. Создать/загрузить агрегат
2. Вызвать метод агрегата (может сгенерировать события через `addEvent()`)
3. `await repo.save(ar.state)`
4. `this.publishEvents(ar)` ← после сохранения
5. Вернуть результат

## FR3 — `ModuleResolver.eventBus`

Добавить `eventBus?: EventBus` в `ModuleResolver` (опционально, для обратной совместимости в тестах).

## FR4 — Тесты

Unit-тесты в `packages/core/src/api/`:
- UseCase с мок-EventBus: после метода агрегата (сгенерировавшего событие) → `publishEvents` публикует
- UseCase без EventBus в resolve — не падает
- `publishEvents` для агрегата без событий — не падает, ничего не публикует

## Критерии приёмки

- [ ] `publishEvents()` в базовом `UseCase`
- [ ] `ModuleResolver.eventBus?: EventBus`
- [ ] Unit-тесты проходят
- [ ] `bun run check:p core`

## За рамками

- Реализация `publishEvents` в конкретных UseCase (→ Трек 2.4, 3.2+)
