# MarkdownV2 в Telegram-боте

## Правило

Любое сообщение с `parseMode: 'MarkdownV2'` в `SendMessageDescription` или
`EditMessageDescription` **обязано** проходить валидацию через
`assertResponseMarkdownSafe()` в тестах (unit, story, e2e).

## Зарезервированные символы

Telegram MarkdownV2 резервирует символы: `` _ * [ ] ( ) ~ ` > # + - = | { } . ! ``

| Категория | Символы | Правило |
|-----------|---------|---------|
| Никогда не форматирующие | `.` `!` `+` `-` `=` `\|` | **Всегда** должны быть экранированы: `\\.` |
| Форматирующие | `*` `_` `~` `` ` `` | Должны быть **парными** (чётное количество) |
| Парные последовательности | `__` (underline), `\|\|` (spoiler) | Учитываются как легитимные пары |

## Как экранировать

### Статические строки

Ручное экранирование в исходном коде:

```typescript
// ❌ Ошибка: точка и восклицательный знак не экранированы
text: 'Поток запущен! Первые задания выданы студентам.',
parseMode: 'MarkdownV2',

// ✅ Правильно
text: 'Поток запущен\\! Первые задания выданы студентам\\.',
parseMode: 'MarkdownV2',
```

### Динамические значения

Использовать `escapeMarkdown` из `@u7-scl/core/shared`:

```typescript
import { escapeMarkdown } from '@u7-scl/core/shared';

`📋 *${escapeMarkdown(stream.title)}*`;
```

**Важно:** `escapeMarkdown` экранирует ВСЕ зарезервированные символы,
включая форматирующие `*`, `_`. Поэтому его **нельзя** применять
к строке, уже содержащей Markdown-разметку — только к отдельным
значениям, вставляемым в шаблон.

### Валидация в коде

Функции для проверки:

| Функция | Назначение | Где использовать |
|---------|-----------|-------------------|
| `validateMarkdownV2(text)` | Возвращает `MarkdownValidationResult` | `executeResponses` (dev-assert) |
| `assertMarkdownV2Safe(text)` | Бросает ошибку при проблемах | Тесты (низкоуровневые) |
| `assertResponseMarkdownSafe(response)` | Рекурсивно проверяет `BotResponse` | Тесты стори/контроллеров/e2e |

Все функции экспортируются из `@u7-scl/core/ui` и `@u7-scl/core/shared`.

#### В тестах стори и контроллеров

```typescript
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';

test('...', async () => {
  const response = await story.handleCallback(...);
  assertResponseMarkdownSafe(response); // бросит при неэкранированных символах
});
```

**Требование:** после **каждого** вызова `handleCallback`, `handleMessage`,
`handleCancel`, `handleStart` (если возвращает `BotResponse`), а также
`router.handle*()` — добавлять `assertResponseMarkdownSafe(response)`.

#### В e2e-тестах

```typescript
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';

test('e2e: сценарий заполнения анкеты', async () => {
  // ... симуляция взаимодействия с ботом ...

  const response = await router.handleCallback(...);
  assertResponseMarkdownSafe(response);
});
```

#### В рантайме (dev)

`executeResponses()` в `apps/u7-bot/src/ui-utils.ts` автоматически вызывает
`validateMarkdownV2` для каждого MarkdownV2-сообщения и пишет `console.warn`
при обнаружении проблем. Это не прерывает работу бота, но сигнализирует
разработчику о потенциальном баге.

## Связанные файлы

| Файл | Назначение |
|------|-----------|
| `packages/core/src/shared/markdown.ts` | `escapeMarkdown()` |
| `packages/core/src/shared/markdown-validator.ts` | `validateMarkdownV2()`, `assertMarkdownV2Safe()` |
| `packages/core/src/ui/bot/response-markdown-assert.ts` | `assertResponseMarkdownSafe()` |
| `apps/u7-bot/src/ui-utils.ts` | dev-assert в `executeResponses()` |
