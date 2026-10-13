# Манифесты

**Назначение:** семейство `define*`, обязательные поля и механизм проверки соответствия кода декларациям. API функций окончательно фиксируется в треке core (см. [migration.md](./migration.md)).

---

## 1. Семейство

| Функция | Слой (где лежит) | Что декларирует |
|---|---|---|
| `defineError` | domain | `code`, `kind`, `label`, `description`, схема `payload` |
| `defineEvent` | domain | `name` (`student.completed`), `label`, `description`, схема payload |
| `defineAggregate` | domain | схема entity, статусы и переходы, `events`, `errors` |
| `definePolicy` / `rule` | domain | именованные правила с `label` и `denyMessage`, композиция |
| `defineUseCase` | domain (контракт) | `type` (command/query), `aggregate`, `policy`, `auth`, `input`, `output`, `errors`, `emits` |
| `defineEventReaction` | domain (контракт) | `on` (событие), `touches` (агрегаты), `calls` (фасады), `emits` |
| `defineJob` | domain (контракт) | `schedule`, `scans`, `emits` |
| `defineFacade` | domain (контракт) | методы с `label`/`description` |
| `defineModule` | domain | `dependsOn`, состав (aggregates, useCases, reactions, jobs, facades) |
| `defineStory` | ui (позже) | цель пользователя, роли, вызываемые UC, слушаемые события |

Реализации подключают манифест через базовые классы: `UseCaseFromManifest`, `ReactionFromManifest`, `JobFromManifest`. Свойства (имя, схемы, тип) в классах **не дублируются**.

Обратные связи (какие UC управляют агрегатом, кто слушает событие) в манифестах **не пишутся** — их вычисляет граф-движок.

## 2. Обязательные описания

Без них уровни «PO» и «LLM» получаются бедными:

- `label` — короткое имя (кнопка, заголовок, строка таблицы);
- `description` — объяснение для аналитика и LLM: что делает, когда применять. Обязательно для UC, ER, Job, Event, Error, Aggregate;
- `v.description()` на **каждом поле** схем input/output/entity (базовые `F.*` ставят его сами из метки).

## 3. Схемы

- Базовые поля — только через `F.*` (core) и `shared/` (domain): `F.uuid('студента')`, `F.timestamp('зачисления')`, `BaseEntityFields`. Новые валидаторы для тех же полей не создаются.
- Схемы input/output **обязаны конвертироваться в JSON Schema** (`@valibot/to-json-schema`): без непереводимых `transform`/`custom` либо с явным fallback. Это основа OPTIONS и MCP.

## 4. Декларация + верификация (D-09)

| Декларация | Проверка |
|---|---|
| `errors` UC | тип: `this.err()` принимает только заявленные коды |
| `input` / `output` | тип + рантайм-валидация в `handle()` |
| `emits` UC/ER/Job | рантайм-ассерт в test/dev: публикация незаявленного события — ошибка |
| `touches` / `calls` ER | рантайм-ассерт через прокси резолвера в тестах |
| `dependsOn` модуля | контрактный тест по фактическим импортам и ссылкам манифестов |
| связность графа | контрактный тест: висячие подписчики, неопубликованные события, UC вне модуля |
| описания | контрактный тест: непустые `label`/`description`, описания полей |
| JSON Schema | контрактный тест: все input/output конвертируются |

## 5. Потребители графа (позже, отдельные треки)

- CLI `bun run domain` — `ar <name>`, `uc <name>`, `cascade <uc>`, `context-map`, `errors`.
- doc-gen — Mermaid (`stateDiagram-v2`, `sequenceDiagram`, `graph TD`) и таблицы ошибок.
- http — автороутинг (`POST` command, `GET` query), OPTIONS.
- mcp — tools из UC, resources из графа (D-11).
