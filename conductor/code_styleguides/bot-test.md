# Тестирование Telegram-бота (bot-test) — Styleguide

**Назначение:** правила тестирования UI-слоя Telegram-бота на трёх уровнях: unit, интеграционном, E2E.

---

## 1. Уровни тестирования

| Уровень | Расположение | Что проверяет | Моки |
|---|---|---|:---:|
| **Unit** | `packages/<module>/src/ui/bot/stories/*.test.ts` | Логика одной стори/контроллера в изоляции | ✅ `moduleApi`, `appApi` |
| **Интеграционный** | `tests/bot/integration/<module>/*.integration.test.ts` | Стори + роутер + контроллер + реальные JSON-репозитории | ❌ |
| **E2E** | `tests/bot/e2e/<module>/*.e2e.test.ts` | Полные пользовательские цепочки через `code` кнопок | ❌ |

---

## 2. Ключевые правила

1. **Unit:** стори вызывается напрямую (`story.handleCallback(...)`), без роутера. Не проверяются `code` кнопок — только текст и наличие кнопок.
2. **Integration:** вызов через `router.handleCallback('stream:catalog:list', ...)` с полным callback_data. Проверяется семантика ответа, НЕ `code`.
3. **E2E:** каждый шаг извлекает `code` из кнопки предыдущего ответа и передаёт дальше. Единственный уровень, ловящий ошибки формирования callback_data.
4. **MarkdownV2-валидация обязательна** на всех уровнях (см. §4).
5. **Изоляция:** каждый `describe` со своим `TestApp` (отдельные фикстуры), чтобы изменения состояния не влияли на другие сценарии.

---

## 3. Структура и хелперы

```
tests/bot/
├── helpers/
│   ├── test-app.ts          # createTestApp() — ApiApp с временными репозиториями
│   └── fixture-loader.ts    # loadFixtures() — copy-on-write из templates/
├── fixtures/templates/      # эталонные JSON-фикстуры (один набор на все тесты)
├── integration/<module>/
└── e2e/<module>/user-flows.e2e.test.ts   # один файл на модуль
```

Примеры живых тестов: `packages/stream/src/ui/bot/stories/catalog.story.test.ts` (unit), `tests/bot/integration/stream/` (integration), `tests/bot/e2e/stream/` (E2E).

### Формат callback_data

```
stream:catalog:list                  — CatalogStory
stream:view-stream:view:<uuid>       — ViewStreamStory
stream:learning:my-study             — LearningStory
```

Первая часть — имя контроллера, вторая — имя стори, третья — экшен. Контроллер сжимает UUID (см. [bot-controller.md](./skills/bot-controller.md), §5).

---

## 4. Валидация BotResponse

| Функция (`@u7-scl/core/ui`) | Проверяет | Где использовать |
|---|---|---|
| `assertResponseMarkdownSafe` | Только MarkdownV2 | Unit (стори без контроллера) |
| `assertBotResponseValid` | MarkdownV2 **+** длина `code` ≤ 64 байт | Integration, E2E |

```typescript
const response = await router.handleCallback(...);
assertBotResponseValid(response);
```

### 4.1 Экранирование MarkdownV2

Любое сообщение с `parseMode: 'MarkdownV2'` обязано проходить `assertResponseMarkdownSafe()`.

Telegram резервирует: `` _ * [ ] ( ) ~ ` > # + - = | { } . ! ``

| Категория | Символы | Правило |
|---|---|---|
| Никогда не форматирующие | `. ! + - = \|` | **Всегда** экранировать (`\\.`) |
| Форматирующие | `* _ ~ \`` | Парные (чётное количество) |

- **Статические строки** — ручное экранирование.
- **Динамические значения** — `escapeMarkdown` из `@u7-scl/core/shared`. Нельзя применять к строке с готовой разметкой — только к отдельным значениям.

Функции: `validateMarkdownV2` (dev-assert), `assertMarkdownV2Safe` (низкоуровневые тесты), `assertResponseMarkdownSafe` (стори/контроллеры/e2e). Код: `packages/core/src/shared/markdown.ts`, `markdown-validator.ts`, `packages/core/src/ui/bot/response-markdown-assert.ts`.

---

## 5. E2E: хелперы и сценарии

```typescript
/** Найти кнопку в ответе по вхождению подстроки в текст */
function findButton(response: BotResponse, textContains: string): { text: string; code: string } {
  const btn = response.sendMessage?.keyboard?.rows.flat()
    .find(b => b.text.includes(textContains));
  if (!btn) throw new Error(`Кнопка «${textContains}» не найдена`);
  return btn;
}
```

Минимальный набор сценариев на модуль: гость (меню → каталог → карточка → назад), кандидат (запись на поток), студент («Моя учёба»), ментор (каталог → студенты → детали).

---

## 6. Запуск и отладка

```bash
bun test packages/stream/src/ui/bot/          # unit
bun test tests/bot/integration/                # integration
bun test tests/bot/e2e/                        # e2e

KEEP_FIXTURES=1 bun test tests/bot/integration/stream/catalog.integration.test.ts   # не удалять фикстуры
```

---

## Связанные документы

- [Общие правила тестирования](../testing.md)
- [BotController](./skills/bot-controller.md) — сжатие id, handleError
- [BotUserStory](./skills/bot-user-story.md) — стиль сторис
- [DDD принципы](../ddd.md)
