---
name: ddd-domain
description: Правила и шаблоны для Domain-слоя — Entity, Aggregate, Repo (интерфейс), Policy, Enum, Types. Используй при создании или изменении файлов в src/domain/.
---

# DDD Domain Layer — Styleguide

## Директива

Ты ДОЛЖЕН следовать этим правилам при создании или изменении любых файлов в `src/domain/`. Это **Закон** для доменного слоя.

Покрытие тестами доменного слоя — исключительно полное.

## Карта файлов

Ниже — соответствие паттернов, файлов в проекте и полных styleguide-файлов с примерами кода.
Если нужен полный пример — прочитай указанный styleguide-файл.

| Паттерн | Файл в проекте | Полный styleguide |
|---|---|---|
| Entity | `domain/<entity>/entity.ts` | `conductor/code_styleguides/skills/entity.md` |
| Aggregate | `domain/<entity>/a-root.ts` | `conductor/code_styleguides/skills/aggregate.md` |
| Repo (интерфейс) | `domain/<entity>/repo.ts` | `conductor/code_styleguides/skills/repo.md` |
| Policy | `domain/<entity>/policy.ts` | `conductor/code_styleguides/skills/policy.md` |
| Errors (usecase) | `domain/<entity>/commands/errors.ts` | `conductor/code_styleguides/skills/errors.md` |
| Enum | `domain/<entity>/<enum>.ts` | `conductor/code_styleguides/skills/enum.md` |
| Types | `domain/<entity>/types.ts` | `conductor/code_styleguides/skills/types.md` |
| Facade | `domain/facade.ts` | `conductor/code_styleguides/skills/facade.md` |
| Domain Service | `domain/<module>-ds.ts` | `conductor/code_styleguides/skills/domain-service.md` |

---

## 1. Entity — `domain/<entity>/entity.ts`

**Назначение:** единственный источник истины для структуры данных предметной области.

### Ключевые правила
1. Все поля имеют валидацию через Valibot.
2. Тип сущности (`<EntityName>`) выводится из валидационной схемы: `v.InferOutput<typeof Schema>`.
3. В этом же файле объявляется мета-тип агрегата `<Name>ArMeta`.
5. В `Meta` — только ошибки, выбрасываемые самим агрегатом.
6. **Без бизнес-логики** — только структура и валидация.
7. Отличное покрытие тестами различных вариантов валидационных правил сущности.

### Структура файла
```typescript
import * as v from "valibot";
// 1. Схема валидации
export const <EntityName>Schema = v.object({...});
// 2. Тип сущности
export type <EntityName> = v.InferOutput<typeof <EntityName>Schema>;
// 3. Мета-тип агрегата (ошибки + опциональное)
export interface <EntityName>ArMeta { ... }
```

---

## 2. Aggregate — `domain/<entity>/a-root.ts`

**Назначение:** богатый доменный объект — инкапсулирует состояние и бизнес-логику изменений.

### Ключевые правила
1. Наследуется от `Aggregate<ArMeta>` из `@u7/core`.
2. Принимает состояние через конструктор, проверяет инварианты через схему.
3. Можно расширить проверку инвариантов логикой, не покрываемой схемой.
4. Содержит **только** фабричные методы (`create()`) и методы изменения состояния.
5. **Не содержит** схему валидации — импортирует из `entity.ts`.
6. **Не обращается** к репозиторию, БД и внешним сервисам.
7. **Не пишет бизнес-логику запросов** — только изменения.
8. Каждый сложный метод покрыт тестами различных вариантов сценариев.

---

## 3. Repo (интерфейс) — `domain/<entity>/repo.ts`

**Назначение:** контракт хранения и извлечения сущностей. Каждый агрегат имеет свой репозиторий.

### Ключевые правила
1. Только `interface`, никаких классов.
2. Все методы возвращают `Promise` или `MaybePromise`.
3. Методы поиска возвращают `undefined` (не `null`) при отсутствии результата.
4. **Без бизнес-логики** — только CRUD-контракт.
5. Имена методов — domain-friendly (на языке предметной области).

---

## 4. Policy — `domain/<entity>/policy.ts`

**Назначение:** правила доступа к операциям над сущностью. Stateless.

### Ключевые правила
1. Экспортирует plain-object или набор функций.
2. **Только синхронные** проверки — без async.
3. Каждый метод принимает `actor` и опционально `target`.
4. Возвращает `boolean`.
5. Покрытие тестов гарантирующую правильную политику прав доступа.

---

## 5. Errors — `domain/<entity>/commands/errors.ts`

- **Атомарные** (`<Name>UcError`) — явно определенный тип ошибки с фиксированным `name`, `kind`, `level`.
- **ModuleError** (`<ModuleName>ModuleError`) — union всех атомарных ошибок модуля.
- **CmdError** — union только тех ошибок, которые конкретная команда может выкинуть.

### Ключевые правила
1. Каждый `name` уникален в рамках модуля.
2. `kind` определяет HTTP-статус: `not-found` → 404, `conflict` → 409, `validation` → 422.
3. `message` — человекочитаемое описание.
4. `payload` — опциональные данные для отладки.

---

## 6. Enum — `domain/<entity>/<enum>.ts`

**Назначение:** перечисления, относящиеся к сущности (например, `Role`).

### Ключевые правила
1. Используй `enum` для type-safety и автодополнения.
2. Создавай `*Schema` через `v.picklist`.
3. JSDoc-комментарии для документации значений.
4. Если перечисление простое — можно включить в `entity.ts`.

---

## 7. Types — `domain/<entity>/types.ts`

**Назначение:** вспомогательные типы, не вошедшие в другие файлы.

### Ключевые правила
- Семантические обёртки над примитивами: `UserId`, `TelegramId`.
- Union-типы, вспомогательные интерфейсы.

---

## Использование доменных объектов в других пакетах

**Domain Service, Aggregate, Policy, Schema, Entity-типы** можно импортировать и использовать в других пакетах напрямую, без UC и `appApi.execute`.

### Что можно
- `Domain Service` (DS) — совместная работа нескольких доменных объектов
- `Aggregate` — методы работы с определенным агрегатом
- `Schema` — валидационные схемы valibot
- `Policy` — stateless проверки прав доступа
- `Entity`-типы, `value`-типы (`ContentSnapshot`, `ContentPath` и т.д.)

### Что нельзя
- `*Repo` — интерфейсы репозиториев (только внутри пакета-владельца)

### Критерий
Если требует изменение состояния доменных объектов — usecase, facade, moduleApi, appApi
Если требует получения состояния доменных объектов — usecase, facade, moduleApi, appApi
Если нужны чистые не мутирующие доменные операции — прямой импорт доменного объекта и использование его api

---

## Предотвращение регресса (для всех паттернов)

- **Не ломай существующее** — меняй только то, что относится к задаче.
- **Не удаляй и не переписывай тесты** — только добавляй новые.
- **Критические ошибки вне задачи** — задокументируй в отчёте, не исправляй без согласования.
