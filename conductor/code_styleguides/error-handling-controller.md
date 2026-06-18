# Обработка ошибок в контроллере

## Перехват на верхнем уровне

Контроллер (`BotController`) перехватывает необработанные ошибки из story
в методах `handleCallback` и `handleMessage`:

```typescript
async handleCallback(data: string, actor: TActor, session: SessionData): Promise<BotResponse> {
  try {
    // ... делегирование в story ...
  } catch (err) {
    return this.handleError(err);
  }
}
```

Это гарантирует, что пользователь **никогда** не увидит stack trace или детали внутренней ошибки.

## Метод handleError в контроллере

Контроллер имеет собственный метод `handleError`, который:

1. Различает типы ошибок через `fromError()`
2. Логирует `internal`, `unauthorized`, `default` ошибки
3. Возвращает безопасное сообщение пользователю (без деталей)

```typescript
protected handleError(err: unknown): BotResponse {
  const appError = fromError(err);

  if (
    appError.kind === 'internal' ||
    appError.kind === 'unauthorized' ||
    appError.kind === 'default'
  ) {
    this.logger?.error('bot', 'Необработанная ошибка в контроллере', serializeError(err));
  }

  return {
    releaseInput: true,
    sendMessage: {
      text: '⚠️ *Произошла внутренняя ошибка*\n\nПожалуйста, попробуйте позже...',
      parseMode: 'MarkdownV2',
    },
  };
}
```

## Двойная защита

Помимо контроллера, в `main.ts` есть глобальный middleware, который ловит ошибки,
пробросившиеся мимо контроллера. Это вторая линия защиты.

## Когда переопределять handleError в контроллере

Если контроллеру нужна специфичная обработка ошибок (например, для OnboardingController),
можно переопределить `handleError`. Базовый метод в `BotController` уже покрывает общий случай.
