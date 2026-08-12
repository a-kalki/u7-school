# Миграция тестов бота на BotTransport — Фронт работ

**Назначение:** описать план перевода интеграционных и E2E тестов с `TestBotUiApp` на честный `BotTransport`, чтобы тесты проверяли тот же путь, что и прод.

---

## 1. Текущее состояние (проблемы)

После трека «BotTransport» тесты бота используют временную обёртку `TestBotUiApp`
(`apps/u7-bot/tests/helpers/test-app.ts`), которая эмулирует только префиксацию кнопок.

Что теряется:

- **Сжатие UUID не тестируется** на интеграционном уровне — тесты с длинным
  callback_data (>64 байт) падают.
- **`execute()` не тестируется** — удаление клавиатуры, `lastBotMessage`,
  `captureInput`/`releaseInput`, ack на callback идут мимо тестов.
- **`// @ts-nocheck`** в 9 файлах тестов — типы выключены.
- **`any`** в возвратах `TestBotUiApp`.

Схема сейчас: `Тест → TestBotUiApp → UiApp → Controller → Story`.

Схема в проде: `Grammy → BotTransport → UiApp → Controller → Story`.

---

## 2. Уровни тестов и их ответственность

| Уровень | Файлы | Вход | Что проверяет |
|---|---|---|---|
| Story (unit) | `src/controllers/**/*.story.test.ts` | story напрямую | рендер одного сценария, кнопки без префикса |
| Controller (unit) | `src/controllers/**/*controller.test.ts` | controller напрямую | маршрутизация между стори |
| Integration | `apps/u7-bot/tests/**/*.integration.test.ts` | **BotTransport** | полный путь события → ответ |
| E2E | `apps/u7-bot/tests/e2e/*.e2e.test.ts` | **BotTransport** | пользовательский путь (цепочка кнопок) |

Integration и E2E должны заходить через `BotTransport` — только так тесты
покрывают сжатие, execute, ack и сессии.

---

## 3. Фронт работ

### Шаг 1. Тестовый BotTransport

Создать `TestBotTransport` (или использовать `BotTransport` напрямую) с замоканным `Api`:

- мок `sendMessage` / `editMessageText` — пишут в массив, возвращают `{ message_id: N }`
- реальный `U7BotUiApp` (с actorResolver)
- реальный `Map<number, SessionData>`

Ссылка на прод-класс: `apps/u7-bot/src/infra/bot-transport.ts`.

### Шаг 2. Мок Grammy-контекста

Фабрика `makeBotContext()`:
`from.id`, `callbackQuery.data`, `session`, `reply`, `answerCallbackQuery`, `message.text`.

### Шаг 3. Миграция интеграционных тестов (~9 файлов)

Заменить `transport.handleCallback(data, tgId, session)` на:

```
await transport.handleCallback(ctx);
expect(botApi.sent[0].text).toBe(...);
```

Проверять ответы через накопленный вывод мок-Api, а не через return.

### Шаг 4. Миграция E2E тестов (~4 файла)

То же, но для длинных пользовательских путей (цепочки кнопок).

### Шаг 5. Удаление временных подпорок

- удалить `TestBotUiApp`
- убрать `// @ts-nocheck` из всех тестов
- восстановить строгие типы (`BotResponse` вместо `any`)

### Шаг 6. Проверка

- `bun run check` — чисто
- убедиться, что сжатие UUID покрыто интеграционными тестами
  (callback_data с длинным UUID успешно сжимается)

---

## 4. Связанные файлы

- Прод-класс: `apps/u7-bot/src/infra/bot-transport.ts`
- Unit-тесты BotTransport: `apps/u7-bot/src/infra/bot-transport.test.ts`
- Тестовый хелпер (временный): `apps/u7-bot/tests/helpers/test-app.ts`
- Правила тестирования бота: `conductor/code_styleguides/bot-test.md`
