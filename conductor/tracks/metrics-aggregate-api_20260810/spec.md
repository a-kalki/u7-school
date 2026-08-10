# Спецификация — Трек 2.2: API событий в `Aggregate`

## Обзор

Расширить базовый класс `Aggregate` и тип `ArMeta` в `packages/core/src/domain/ar/aggregate.ts`, чтобы агрегаты могли накапливать доменные события для последующей публикации через EventBus.

## FR1 — `ArMeta.events`

Добавить поле `events` в `ArMeta`:

```typescript
interface ArMeta {
  name: string;
  label: string;
  state: { uuid: string; createdAt: string; updatedAt?: string } & Record<string, unknown>;
  events: DomainEvent;  // union доменных событий агрегата
}
```

- Для агрегатов, которые не генерируют события — `events: never`
- Для агрегатов с событиями — union конкретных типов: `events: ModuleCompleted | QuestionnaireCompleted`

## FR2 — Новые методы `Aggregate`

```typescript
abstract class Aggregate<TMeta extends ArMeta> {
  private _events: TMeta['events'][] = [];

  /** Добавить событие. Вызывается методами агрегата при значимых действиях */
  protected addEvent(event: TMeta['events']): void {
    this._events.push(event);
  }

  /** Проверить наличие неопубликованных событий */
  hasEvents(): boolean {
    return this._events.length > 0;
  }

  /** Выдать события и очистить коллектор.
   *  Вызывается UseCase'ом после repo.save().
   *  Атомарно: вернул + очистил — событие не будет опубликовано дважды. */
  flushEvents(): TMeta['events'][] {
    const events = [...this._events];
    this._events = [];
    return events;
  }
}
```

## FR3 — Контракт использования

1. Агрегат **не** публикует события сам, только кладёт через `addEvent()`
2. UseCase после сохранения вызывает `flushEvents()` и публикует через EventBus
3. `flushEvents()` атомарен — исключает дублирование при сбоях публикации

## FR4 — Тесты

Unit-тесты в `packages/core/src/domain/ar/`:
- `addEvent` добавляет событие в коллектор
- `hasEvents` возвращает true/false корректно
- `flushEvents` возвращает события и очищает коллектор
- Повторный `flushEvents` возвращает пустой массив
- Проверка типов: `ArMeta.events` должен быть `DomainEvent`

## Критерии приёмки

- [ ] `ArMeta.events` добавлен
- [ ] `addEvent()` (protected), `hasEvents()` (public), `flushEvents()` (public)
- [ ] Unit-тесты проходят
- [ ] Существующие агрегаты не сломаны (`events: never` по умолчанию)
- [ ] `bun run check:p core`

## За рамками

- `publishEvents` в UseCase (→ Трек 2.3)
- Реализация событий в конкретных агрегатах (→ Трек 2.4, 3.2)
