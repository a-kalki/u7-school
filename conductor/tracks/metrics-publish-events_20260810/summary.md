# Итоговый отчёт — Трек 2.3: publishEvents в UseCase

## Цель
Добавить в базовый `UseCase` метод `publishEvents()` для автоматической публикации доменных событий, накопленных агрегатом. Интегрировать `EventBus` в `ModuleResolver`.

## Выполненные задачи

### Фаза 1: ModuleResolver.eventBus
- Добавлено `eventBus?: EventBus` в `ModuleResolver` (опционально)
- Все существующие тесты проходят без изменений

### Фаза 2: publishEvents в UseCase
- `protected publishEvents(ar)` — принимает объект с `hasEvents()` и `flushEvents()` (утиная типизация)
- Проверки: нет событий → return, нет EventBus → return, иначе публикует каждое

## Изменённые файлы (3)
- `packages/core/src/domain/types.ts` — `ModuleResolver.eventBus?: EventBus`
- `packages/core/src/api/uc/use-case.ts` — импорт DomainEvent/EventBus + метод `publishEvents`

## Созданные файлы (1)
- `packages/core/src/api/uc/use-case-publish-events.test.ts` — 4 теста

## Архитектурные решения
- **Утиная типизация:** `publishEvents` принимает `{hasEvents, flushEvents}`, а не `Aggregate`. Не создаёт циклической зависимости на domain слой
- **Опциональный eventBus:** не ломает обратную совместимость — UseCase без EventBus просто не публикует
- **EventBus через resolve:** `(this.resolve as {eventBus?: EventBus}).eventBus` — минимальный контракт

## Отклонения от плана
Нет.

## Известные ограничения
- Публикация синхронная (publish не await'ится) — обработчики EventBus могут быть async
