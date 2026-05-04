# Хранение и обработка ошибок

Система использует типизированную иерархию ошибок для обеспечения предсказуемого поведения на фронтенде и автоматического маппинга HTTP-статусов на уровне REST.

## Иерархия ошибок

### `AppError` (Базовый контракт)
Все ошибки в системе реализуют интерфейс `AppError`.
- **Поля:** `name`, `level` (domain/api), `kind`, `message`, `payload`.
- **`kind` (Категория):** Определяет семантику ошибки и используется для выбора HTTP-статуса:
    - `validation` -> 422 (Unprocessable Entity)
    - `not-found` -> 404 (Not Found)
    - `conflict` -> 409 (Conflict)
    - `access-denied` -> 403 (Forbidden)
    - `bad-request` -> 400 (Bad Request)
    - `internal` -> 500 (Internal Server Error)

## Уровни ошибок

- **`DomainError` (level: "domain"):** Ошибки предметной области. Нарушение инвариантов агрегата или доменных прав доступа.
- **`ApiError` (level: "api"):** Ошибки уровня приложения/инфраструктуры (ошибки авторизации, отсутствие команды в модуле, системные сбои).

## Исключения

Для прерывания потока выполнения используется класс **`AppException`**, который инкапсулирует объект `AppError`.

### Выброс ошибок (Best Practices)

Вместо прямого создания `AppException`, используются типизированные хелперы в базовых классах:

1. **В Агрегатах (`Aggregate`):**
    - `this.throwInvariant(name, message, payload)` — для `kind: "validation"`.
    - `this.throwConflict(name, message, payload)` — для `kind: "conflict"`.

2. **В Use Cases (`UseCase`):**
    - `this.throwNotFound(...)`
    - `this.throwAccessDenied(...)`
    - `this.throwValidation(...)`
    - И другие методы для каждого `kind`.

## Обработка на уровне контроллера

Контроллеры (REST, CLI) перехватывают любые исключения и используют хелпер `fromError(error)` для приведения их к стандартизированному JSON-ответу:
```json
{
  "success": false,
  "error": {
    "name": "UserNotFound",
    "kind": "not-found",
    "message": "Пользователь не найден",
    "payload": { "userId": "123" }
  }
}
```
