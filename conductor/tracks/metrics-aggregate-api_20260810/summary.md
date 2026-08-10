# Итоговый отчёт — Трек 2.2: API событий в Aggregate

## Цель
Расширить базовый класс `Aggregate` и тип `ArMeta`, чтобы агрегаты могли накапливать доменные события для последующей публикации через EventBus.

## Выполненные задачи

### Фаза 1: ArMeta.events
- Добавлено опциональное поле `events?: DomainEvent` в `ArMeta`
- Добавлен conditional тип `EventsOf<TMeta>` — извлекает тип событий, default `never`
- Написан тест на типовую совместимость (агрегат без `events` компилируется с `events: never`)

### Фаза 2: Методы Aggregate
- `private _events: EventsOf<TMeta>[]` — коллектор неопубликованных событий
- `protected addEvent(event)` — добавить событие
- `public hasEvents(): boolean` — проверить наличие
- `public flushEvents(): EventsOf<TMeta>[]` — выдать копию и очистить (атомарно)
- Написаны тесты: addEvent, hasEvents, flushEvents + очистка + повторный flush

## Изменённые файлы (2)
- `packages/core/src/domain/ar/aggregate.ts` — ArMeta.events, EventsOf, _events, addEvent, hasEvents, flushEvents
- `packages/core/src/domain/ar/aggregate.test.ts` — 2 новых теста для событий

## Архитектурные решения
- **events опционально:** `events?: DomainEvent` в ArMeta. Не сломало ни один существующий агрегат
- **EventsOf<TMeta>:** conditional тип с дефолтом `never`. Агрегаты без событий не меняют код
- **Агрегат не публикует:** только кладёт через `addEvent()`. Публикация — в UseCase (Трек 2.3)
- **flushEvents атомарен:** копирование + очистка — исключает дублирование при сбоях

## Отклонения от плана
Нет.

## Известные ограничения
- Нет проверки на дубликаты событий
- Нет лимита на размер коллектора
