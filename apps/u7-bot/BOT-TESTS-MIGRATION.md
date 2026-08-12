# Миграция тестов бота на BotTransport — Фронт работ

> Одноразовый документ для отдельной сессии. После выполнения — удалить.
> Цель: перевести интеграционные и E2E тесты с временной обёртки
> `TestBotUiApp` на честный `BotTransport`, чтобы тесты эмулировали прод.

---

## 1. Контекст: что произошло

В треке «BotTransport» (2.4a++ bis) был создан `BotTransport` — единый слой
между Grammy и UiApp (`apps/u7-bot/src/infra/bot-transport.ts`). Он владеет:

- сжатием UUID в callback_data (`compressResponse` / `shrink`)
- префиксацией кнопок именем контроллера (`prefixResponse`)
- исполнением `BotResponse` (`execute`): send/edit, удаление клавиатуры,
  `lastBotMessage`, `captureInput`/`releaseInput`
- сессиями (`sessionMap`)

**Прод-цепочка:**

```
Grammy ctx → BotTransport → UiApp → Controller → Story
```

**Текущая тестовая цепочка (нечестная):**

```
Тест → TestBotUiApp → UiApp → Controller → Story
```

`TestBotUiApp` (`apps/u7-bot/tests/helpers/test-app.ts`) — временная обёртка,
эмулирует **только** префиксацию кнопок. Сжатие, `execute`, ack, сессии — не
покрыты на интеграционном/E2E уровне.

---

## 2. Где «погашены» типы (полный список)

### 2.1. `// @ts-nocheck` — 9 файлов

Отключает проверку типов целиком:

- `apps/u7-bot/tests/streams/catalog.integration.test.ts`
- `apps/u7-bot/tests/streams/view-stream.integration.test.ts`
- `apps/u7-bot/tests/learning/hub.integration.test.ts`
- `apps/u7-bot/tests/mentor/mentor.integration.test.ts`
- `apps/u7-bot/tests/courses/course-catalog.integration.test.ts`
- `apps/u7-bot/tests/e2e/main-menu.e2e.test.ts`
- `apps/u7-bot/tests/e2e/curious-showcase.e2e.test.ts`
- `apps/u7-bot/tests/e2e/onboarding.e2e.test.ts`
- `apps/u7-bot/tests/e2e/mentor-management.e2e.test.ts`

### 2.2. `any` в `TestBotUiApp` — 14 мест

В `apps/u7-bot/tests/helpers/test-app.ts`:
`collectMainMenu(actor: any)`, `handleCallback(session: any)`,
`#prefix(...): any`, `prefixKeyboard(kb: any): any` и т.д.

Правильные типы: `User`, `SessionData`, `BotResponse`, `KeyboardDescription`
(из `@u7-scl/core/ui`).

### 2.3. Сам `TestBotUiApp`

Не совпадает с продом по поведению: нет сжатия, нет `execute`, нет ack,
нет управления сессиями через `sessionMap`. Это не эмуляция прода, а заглушка.

---

## 3. Целевая архитектура тестов

| Уровень | Вход | Моки? | Что проверяет |
|---|---|---|---|
| Story (unit) | story напрямую | да (модуль) | рендер одного экрана, кнопки без префикса |
| Controller (unit) | controller напрямую | да (стори) | маршрутизация между стори |
| Integration | **BotTransport** | нет (фикстуры БД) | полный путь события → ответ |
| E2E | **BotTransport** | нет | пользовательский путь (цепочка кнопок) |

Integration и E2E заходят через `BotTransport` — только так покрываются
сжатие, execute, ack и сессии.

---

## 4. Фронт работ

### Шаг 0. Перенести `prefixResponse` в `BotController`

Перенос префиксации кнопок из `BotTransport` в абстрактный `BotController`
(`packages/core/src/ui/bot/controller/bot-controller.ts`).

Методы `handleCallback`, `handleMessage`, `handleCancel`, `handleTimeout`
должны возвращать ответ стори с уже добавленным префиксом `this.name`
к кодам кнопок (аналогично тому, как `handleStart` уже префиксирует `action`,
а `cb()` формирует код).

После этого `BotTransport.prefixResponse` удаляется — остаётся только
`compressResponse` и `execute`.

### Шаг 1. Тестовый BotTransport

Создать хелпер в `apps/u7-bot/tests/helpers/` (например `test-bot-transport.ts`):

- мок `Api` (grammy): `sendMessage` / `editMessageText` пишут вызовы в массив,
  возвращают `{ message_id: N }` (инкрементальный счётчик)
- реальный `U7BotUiApp` с `actorResolver`
- реальный `Map<number, SessionData>`

### Шаг 2. Мок Grammy-контекста

Фабрика `makeBotContext()`: `from.id`, `callbackQuery.data`, `session`,
`reply`, `answerCallbackQuery`, `message.text`.

### Шаг 3. Миграция интеграционных тестов (~9 файлов)

Вместо:

```
const res = await transport.handleCallback('stream:catalog:list', tgId, session);
expect(res.sendMessage.text).toBe(...)
```

Нужно:

```
await transport.handleCallback(ctx);   // ctx — мок-контекст
const sent = botApi.sentMessages;      // накопленный вывод
expect(sent[0].text).toBe(...)
```

### Шаг 4. Миграция E2E тестов (~4 файла)

То же, но для длинных пользовательских путей (цепочки кнопок).

### Шаг 5. Удалить временные подпорки

- удалить `TestBotUiApp`
- удалить `// @ts-nocheck` из всех 9 файлов
- восстановить строгие типы (`BotResponse`, `User`, `SessionData` вместо `any`)

### Шаг 6. Проверка

- `bun run check` — чисто (lint + tsc + тесты)
- убедиться, что сжатие UUID покрыто: callback_data с длинным UUID
  (>64 байта) успешно сжимается и приходит обратно разжатым

---

## 5. Критерии готовности

- [ ] `TestBotUiApp` удалён из `test-app.ts`
- [ ] `// @ts-nocheck` нет ни в одном тесте
- [ ] `any` нет в тестовых хелперах
- [ ] Интеграционные тесты заходят через `BotTransport`
- [ ] E2E тесты заходят через `BotTransport`
- [ ] Сжатие UUID покрыто интеграционным тестом
- [ ] `bun run check` — чисто

---

## 6. Связанные файлы

- Прод-класс: `apps/u7-bot/src/infra/bot-transport.ts`
- Unit-тесты BotTransport (образец честного мока): `apps/u7-bot/src/infra/bot-transport.test.ts`
- Временный хелпер (удалить): `apps/u7-bot/tests/helpers/test-app.ts`
- Абстрактный контроллер: `packages/core/src/ui/bot/controller/bot-controller.ts`
- Правила тестирования бота: `conductor/code_styleguides/bot-test.md`
