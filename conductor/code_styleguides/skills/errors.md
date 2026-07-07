# Ошибки — Styleguide

**Назначение:** типизированная иерархия ошибок модуля. Где лежит: `domain/<entity>/commands/errors.ts` (атомарные ошибки), ре-экспорт в `domain/index.ts`.

---

## 1. Контракт AppError

Все ошибки реализуют интерфейс `AppError` с полями:

| Поле | Назначение |
|---|---|
| `name` | Уникальный идентификатор ошибки в модуле (`USER_NOT_FOUND`) |
| `level` | `"domain"` — нарушение доменных правил; `"api"` — уровень приложения/инфраструктуры |
| `kind` | Категория → HTTP-статус (см. ниже) |
| `message` | Человекочитаемое описание |
| `payload?` | Опциональные данные для отладки (uuid, telegramId и т.п.) |

### kind → HTTP

| kind | HTTP |
|---|---|
| `validation` | 422 |
| `not-found` | 404 |
| `conflict` | 409 |
| `access-denied` | 403 |
| `bad-request` | 400 |
| `internal` | 500 |

Приложение обязано возвращать `AppError` обёрнутый в `AppException` при запросах извне. Обычный `throw Error(...)` допустим только в момент загрузки приложения.

---

## 2. Атомарные vs Union

- **Атомарная** (`<Name>UcError`) — один конкретный тип с фиксированным `name`, `kind`, `level`.
- **ModuleError** (`<ModuleName>ModuleError`) — объединение всех атомарных ошибок модуля для удобства импорта.
- **CmdError** — union только тех атомарных ошибок, которые конкретная команда может выкинуть.

Примеры — см. живой код: `packages/user/src/domain/user/commands/errors.ts`.

---

## 3. Ключевые правила

1. Каждый `name` уникален в рамках модуля.
2. `kind` определяет HTTP-статус (таблица выше).
3. `message` — человекочитаемое описание.
4. `payload` — опциональные данные для отладки.

---

## 4. Выброс ошибок

Для прерывания потока используется класс **`AppException`**, принимающий объект `AppError`.

Вместо прямого создания `AppException` используй **типизированные хелперы-конструкторы** (`errNotFound`, `throwError` и т.п. из `domain/errors/error-helpers.ts`) и методы выброса в классе UseCase/Aggregate.

---

## 5. Обработка на уровне контроллера

Контроллеры (REST, CLI, bot) перехватывают исключения и приводят их к стандартизированному ответу через `fromError(error)` из `domain/errors/error-helpers.ts`. Для bot-контроллера см. `handleError` в [bot-controller.md](./bot-controller.md).

REST-ответ:
```json
{
  "success": false,
  "error": { "name": "UserNotFound", "kind": "not-found", "message": "...", "payload": { "userId": "123" } }
}
```

---

## 6. Тестирование

Ошибки тестируются косвенно — через тесты UC, которые их выбрасывают. Отдельный unit-тест на тип ошибки не нужен. Проверка в тестах — по `name` и `kind` выброшенного `AppException`.

---

## Связанные файлы

- [Общая архитектура](../architecture.md) — поток выполнения команды
- [BotController](./bot-controller.md) — `handleError` для bot
