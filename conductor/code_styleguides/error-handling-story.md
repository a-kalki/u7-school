# Обработка ошибок в story

## Когда нужен try/catch

`try/catch` в story нужен **только** когда требуется специфичная реакция на ошибку:

- Показать пользователю сообщение об ошибке валидации с конкретными полями
- Вернуть fallback-значение (например, «студентов: 0»)
- Повторить операцию с другими параметрами
- Выполнить компенсирующее действие (откат, очистка)

## Когда try/catch НЕ нужен

Если story просто вызывает `this.moduleApi.execute()` и не имеет специфичной реакции на ошибку —
**try/catch не нужен**. Необработанная ошибка пробросится до контроллера, который вызовет `handleError`.

Контроллер (`BotController`) перехватывает все необработанные ошибки из story
и дополнительно есть глобальный middleware в `main.ts`.

## Как использовать handleError

Метод `handleError(err)` определён в базовом классе `BotUserStory` и доступен всем story.

```typescript
// Пример: специфичная реакция на ошибку с fallback
try {
  const user = await this.appApi.execute('get-user', { uuid: userId });
  name = user.name;
} catch (err) {
  this.handleError(err); // логирует если internal/unauthorized, иначе молча
  // fallback: оставляем имя по умолчанию
}
```

## Что делает handleError

Метод различает типы ошибок через `fromError()`:

| Тип ошибки | Действие |
|---|---|
| `validation` | Показывает поля с ошибками пользователю |
| `not-found`, `conflict`, `access-denied`, `bad-request` | Показывает сообщение ошибки пользователю |
| `internal`, `unauthorized`, `default` | Логирует через `this.logger?.error()` и показывает общее сообщение |

## Правила логирования

- **Логируются:** `internal`, `unauthorized`, `default` (неизвестный тип)
- **НЕ логируются:** `validation`, `not-found`, `conflict`, `access-denied`, `bad-request`
  (это часть нормального потока)

## Доступ к логгеру

Логгер доступен через геттер `this.logger` в любом story-классе.
Он берётся из глобального логгера приложения (`getGlobalLogger()`).
