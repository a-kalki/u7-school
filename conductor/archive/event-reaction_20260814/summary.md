# Итоговый отчёт трека event-reaction_20260814

## Название и цель

**EventReaction в core — механизм подписки модулей на события.**

В `@u7-scl/core` добавлен механизм декларативной реакции модулей на доменные события: абстрактный класс **`EventReaction`** (ER), его контракт **`ErMeta`** и тип документации **`ErDocType`**. Модуль объявляет реакции в поле `reactions`, и они автоматически подписываются на свои события при `ApiModule.init()`.

До трека шина событий умела только публиковать (`UseCase.publishEvents`), а `EventBus.subscribe()` нигде не вызывался в проде.

## Выполненные задачи

### Фаза 1: EventReaction + ErMeta
- Реализованы `ErMeta`, `ErDocType`, абстрактный `EventReaction` (`init`/`getErName`/`getEventName`/`handle`/`getDocType`).
- Написаны unit-тесты (5 штук).
- ER экспортирован из `packages/core/src/api/index.ts`.

### Фаза 2: Интеграция в ApiModule
- Добавлено опциональное поле `reactions` в `ApiModule`.
- Реализована авто-подписка в `init()`: `er.init(resolve)` + `eventBus.subscribe(er.getEventName(), handler)`.
- Написаны тесты авто-подписки (3 штуки).

### Фаза 3: Документация ER
- Создан styleguide `conductor/code_styleguides/skills/event-reaction.md`.
- ER зарегистрирован в таблице решений `arch-boundary-design/SKILL.md`, в `conductor/index.md` и в таблице объектов `naming.md`.

## Список созданных и изменённых файлов

### Созданные
- `packages/core/src/api/er/event-reaction.ts` — `ErMeta`, `ErDocType`, `EventReaction`
- `packages/core/src/api/er/event-reaction.test.ts` — unit-тесты ER
- `conductor/code_styleguides/skills/event-reaction.md` — styleguide ER

### Изменённые
- `packages/core/src/api/index.ts` — экспорт `EventReaction`, `ErMeta`, `ErDocType`
- `packages/core/src/api/module/api-module.ts` — поле `reactions` + авто-подписка
- `packages/core/src/api/module/api-module.test.ts` — тесты авто-подписки
- `.pi/skills/arch-boundary-design/SKILL.md` — ряд EventReaction (ER) в таблице решений
- `conductor/index.md` — ссылка на styleguide ER
- `conductor/code_styleguides/naming.md` — строка «Реакция на событие (ER)»
- `conductor/tracks/event-reaction_20260814/plan.md` — отметки выполненных задач

## Принятые архитектурные решения

1. **ER — отдельный абстрактный класс** по аналогии с `UseCase`, но минимальный: без `type`/`requiresAuth`/`inputSchema`/`outputSchema`/`errors`/`arMeta`. «Вход» — само событие; выхода нет.
2. **`eventName` не хранится отдельно** — выводится из `TEvent['eventName']`. Переименование события в типе ломает несоответствующие реакции на уровне типов (tsc).
3. **`DomainEvent` остаётся не дженериком** — конкретное событие сужает `eventName` литералом.
4. **`EventBus.subscribe` без типизации событий** — автоматика подписки работает по строковому `eventName`, типизация живёт внутри ER.

## Отклонения от первоначального плана

1. **`reactions` сделан НЕ `abstract`.** В spec поле описано как `abstract readonly reactions?`, но `abstract` + `?` противоречит цели «не все модули реагируют» и сломало бы все существующие подклассы `ApiModule` (stream, course, user, onboarding, questionnaire), которые не объявляют `reactions`. Реализовано как обычное опциональное поле `readonly reactions?`.
2. **Авто-подписка идемпотентна.** Тест выявил, что повторный `init()` дублирует подписки (конструкторы доменных модулей вызывают `init()`). Добавлено хранение unsubscribe-функций и отписка от старых подписок перед повторной подпиской.

## Известные ограничения

- Конкретные ER в доменных модулях (`questionnaire`, `wish`) — в следующих треках (B/C1/C2).
- Шина событий (`EventBus`) не менялась — осталась как есть.

## Проверки

- `bun run check:p core` — biome + tsc + тесты: чисто.
- `bun run check` (весь проект) — 1514 тестов, 0 fail.
- Покрытие нового кода: `event-reaction.ts` — 100% строк, `api-module.ts` — 100% строк.
