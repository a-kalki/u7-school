# Спецификация — BotTransport: единый слой Grammy ↔ UiApp

## Проблема

При реализации трека 2.4a++ проявились архитектурные проблемы:

1. **Сжатие UUID размазано** между `UiApp` (compressResponse, prefixResponse) и `BotController` (compressAction — уже убрано). Единая ответственность неясна.

2. **Упреждающая отправка** (`uiApp.send()`) требует доступа к Grammy API и сессиям. `connect-ui-app.ts` умеет отправлять `BotResponse` через Grammy, но только в ответ на обновления (callback/message). Для фасадов (инициативная отправка) этот же механизм недоступен.

3. **Логика исполнения BotResponse** (`executeResponses` в `ui-utils.ts`) завязана на Grammy-контекст (`ctx`): удаление кнопок, `lastBotMessage`, `reply`, `editMessageText`. При упреждающей отправке контекста нет — логика дублируется или теряется.

4. **Сессии** управляются Grammy-мидлварью (внутренний Map). Для упреждающего управления `activeHandler` нужен внешний доступ к тому же хранилищу.

## Решение: BotTransport

Создать класс `BotTransport` — единый слой между Grammy и UiApp, владеющий всей логикой:

```
Grammy ctx                      Фасады
    │                               │
    ▼                               ▼
┌────────────────────────────────────────────┐
│              BotTransport                  │
│                                            │
│  implements BotUpdateHandler               │
│    handleCallback(ctx): Promise<void>      │
│    handleMessage(ctx): Promise<void>       │
│    handleCancel(ctx): Promise<void>        │
│    handleStart(ctx): Promise<void>         │
│    handleHelp(ctx): Promise<void>          │
│                                            │
│  implements ProactiveSender                │
│    send(telegramId, response): Promise<void>│
│                                            │
│  Владеет:                                  │
│   • uiApp (маршрутизация)                  │
│   • botApi (Grammy API)                    │
│   • sessionMap (сессии)                    │
│   • compress (сжатие UUID)                 │
│   • execute (отправка, кнопки, сессия)     │
└────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────┐
│              UiApp (core)                  │
│                                            │
│  Принимает tgId, резолвит User             │
│  init(apiApp, actorResolver)               │
│  handleCallback(data, tgId, session)       │
│  handleMessage(update, tgId, session)      │
│  handleCancel(tgId, session)               │
│  handleWelcome(tgId)                       │
│  handleHelp(tgId)                          │
│                                            │
│  НЕ знает про Grammy, сжатие, сессии       │
└────────────────────────────────────────────┘
```

## FR1 — UiApp: убрать сжатие, добавить actorResolver, принимать tgId

**Изменения в `packages/core/src/ui/bot/ui-app.ts`:**

- `init(apiApp, actorResolver: (tgId: number) => Promise<TActor>)` — резолвинг актора
- Публичные методы принимают `tgId: number` вместо `TActor`:
  - `handleCallback(data, tgId, session)` → внутри резолвит актора, вызывает контроллер
  - `handleMessage(update, tgId, session)` → аналогично
  - `handleCancel(tgId, session)` → аналогично
  - `handleWelcome(tgId)` / `handleHelp(tgId)` → аналогично
- **Убрать:** `compressResponse`, `prefixResponse`, `#expandCallbackData`, `#hasStaleIds`, `#shrink`, `#compressAction`, `shortIds` — всё сжатие уходит в BotTransport
- `handleStart` — без изменений (принимает `TActor`)

**`U7BotUiApp`** остаётся — закрывает дженерики `U7BotAppMeta, User`.

## FR2 — BotTransport: новый класс

**Файл:** `apps/u7-bot/src/infra/bot-transport.ts`

### Интерфейс BotUpdateHandler
```typescript
interface BotUpdateHandler {
  handleCallback(ctx: BotContext): Promise<void>;
  handleMessage(ctx: BotContext, next: () => Promise<void>): Promise<void>;
  handleCancel(ctx: BotContext): Promise<void>;
  handleStart(ctx: BotContext): Promise<void>;
  handleHelp(ctx: BotContext): Promise<void>;
  handleTimeout(ctx: BotContext): Promise<void>;
}
```

### Интерфейс ProactiveSender
```typescript
interface ProactiveSender {
  send(telegramId: number, response: BotResponse): Promise<void>;
}
```

### Внутреннее устройство

```typescript
class BotTransport implements BotUpdateHandler, ProactiveSender {
  constructor(
    uiApp: U7BotUiApp,
    botApi: Api,
    sessionMap: Map<number, SessionData>,
  )

  // private:
  //   shortIds, shrink, expandCallbackData, compressResponse, prefixResponse
  //   execute(session, tgId, response) — единая точка отправки + сессия
}
```

**`execute(session, tgId, response)`:**
1. `editMessage` → `botApi.editMessageText(tgId, messageId, text, ...)`
2. Удалить клавиатуру у предыдущего сообщения (если `keepPrevKeyboard !== true`)
3. Сохранить `lastBotMessage` в сессию
4. `sendMessage` / `sendMessages` → `botApi.sendMessage(tgId, text, ...)`
5. `captureInput` → `session.activeHandler = { path, context, expiresAt }`
6. `releaseInput` → `session.activeHandler = null`
7. `questionnaireCompleted` — передаётся как есть

**`handleCallback(ctx)`:**
```
tgId = ctx.from.id
user = resolveActor(tgId)  // через uiApp, который внутри вызовет actorResolver
session = ctx.session
data = ctx.callbackQuery.data
response = uiApp.handleCallback(data, tgId, session)
// response уже без сжатия (UiApp не сжимает)
compressed = compressResponse(prefixResponse(extractControllerName(data), response))
execute(session, tgId, compressed)
ctx.answerCallbackQuery() // ack
```

**`send(tgId, response)`:**
```
session = sessionMap.get(tgId) ?? { activeHandler: null }
compressed = compressResponse(response) // фасад даёт коды с префиксом контроллера
execute(session, tgId, compressed)
sessionMap.set(tgId, session)
```

**Регистрация на Grammy (`main.ts`):**
```typescript
const transport = new BotTransport(uiApp, bot.api, sessionMap);
bot.command('start', (ctx) => transport.handleStart(ctx));
bot.on('callback_query:data', (ctx) => transport.handleCallback(ctx));
bot.on('message:text', (ctx, next) => transport.handleMessage(ctx, next));
bot.command('cancel', (ctx) => transport.handleCancel(ctx));
bot.command('help', (ctx) => transport.handleHelp(ctx));
```

## FR3 — Удаление старого кода

**Удалить:**
- `apps/u7-bot/src/handlers/connect-ui-app.ts` — заменён BotTransport
- `apps/u7-bot/src/core/ui-utils.ts` — executeResponses переезжает в BotTransport
- `apps/u7-bot/src/core/ui-utils.test.ts`
- `U7BotUiApp.send()` и `setTgTransport()` — не нужны
- `apps/u7-bot/src/bot.ts` — `sessionMap` больше не передаётся в createBot

**Обновить:**
- `apps/u7-bot/src/main.ts` — создать BotTransport, зарегистрировать на Grammy, передать transport в фасады
- `apps/u7-bot/src/create-ui-app.ts` — больше не передаёт sessionMap
- `apps/u7-bot/src/infra/questionnaire-bot-facade.ts` — заменить `uiApp.send()` на `transport.send()`
- `apps/u7-bot/src/controllers/questionnaire/fill.story.ts` — кнопки без префикса контроллера (префикс добавит BotTransport.prefixResponse)

## FR4 — Тесты

**Новые:**
- `apps/u7-bot/src/infra/bot-transport.test.ts` — unit-тесты: execute (send/edit/сессия), сжатие/разжатие
- Обновить существующие тесты, которые ломаются от переноса сжатия

## Критерии приёмки

- [ ] UiApp не содержит сжатия — все методы compress/shrink/expand удалены
- [ ] BotTransport.handleCallback/handleMessage/handleCancel/handleStart/handleHelp работают
- [ ] BotTransport.send() отправляет через Grammy и управляет сессией
- [ ] connect-ui-app.ts удалён
- [ ] ui-utils.ts удалён
- [ ] Все существующие тесты адаптированы и проходят
- [ ] `bun run check` — чисто

## За рамками

- Миграция OnboardingController на новый questionnaire (трек 2.5)
- Интеграционные/E2E тесты questionnaire (оставшаяся часть трека 2.4a++)
