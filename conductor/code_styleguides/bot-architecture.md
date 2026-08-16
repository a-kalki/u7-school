# Архитектура Telegram-бота (bot-level)

**Назначение:** единый архитектурный разрез UI-слоя Telegram-бота: из чего он
собран, кто за что отвечает, как течёт запрос от Telegram до домена и обратно.

Живой код:
- базовые классы/типы — `packages/core/src/ui/bot/`;
- приложение бота — `apps/u7-bot/src/`;
- инфраструктура — `apps/u7-bot/src/infra/`.

---

## 1. Слои

```
Grammy (адаптер) → BotTransport (транспорт/исполнение) → BotUiApp (маршрутизация)
                → Controller (диспетчер) → Story (сценарий) → ApiApp (доменные UC)
```

| Слой | Объект | Где | Ответственность |
|---|---|---|---|
| Адаптер | `createBot`, `BotContext` | `apps/u7-bot/src/bot.ts`, `context.ts` | Grammy-бот + session middleware; тип контекста |
| Транспорт | `BotTransport` | `apps/u7-bot/src/infra/bot-transport.ts` | Единый слой Grammy↔BotUiApp: сессии, сжатие UUID, исполнение `BotCommand` |
| Маршрутизация | `BotUiApp` / `U7BotUiApp` | `packages/core/src/ui/bot/ui-app.ts`, `apps/u7-bot/src/core/ui-app.ts` | Core: резолв актора, диспетчеризация, `delegate`. U7: сбор меню, `/start`, `/help` |
| Диспетчер | `BotController` / `U7BotController` | `packages/core/src/ui/bot/bot-controller.ts`, `apps/u7-bot/src/core/u7-bot-controller.ts` | Core: реестр сторис, префиксация кнопок, `handleError`. U7: главное меню, `handleWelcome`/`handleHelpMessage` |
| Сценарий | `BotUiStory` / `U7BotUiStory` | `packages/core/src/ui/bot/bot-ui-story.ts`, `apps/u7-bot/src/core/u7-bot-ui-story.ts` | Логика одного экрана: UC → рендер `BotResponse` |
| Данные | `BotCommand` / `BotResponse` / `SessionData` | `packages/core/src/ui/bot/types.ts` | Типы между слоями |
| Домен | `ApiApp.execute()` | `packages/core/src/api/` | UseCase'ы доменных модулей |

---

## 2. Объекты и ответственности

### 2.1. `BotContext` + `createBot` (адаптер)

`context.ts` задаёт тип контекста:

```ts
export type BotContext = Context & SessionFlavor<SessionData>;
```

`createBot(token, sessionMap?)` (`bot.ts`) создаёт `Bot` и вешает `session`-
middleware. Ключевой момент: **`sessionMap` — общий** `Map<number, SessionData>`,
который GrammY использует как storage сессий, а `BotTransport` — как своё
хранилище. То есть `ctx.session` и `transport.sessionMap.get(tgId)` — один объект.

### 2.2. `BotTransport` (транспорт/исполнение)

`apps/u7-bot/src/infra/bot-transport.ts`. Владеет:

- **`sessionMap`** — `Map<number, SessionData>` (общая с GrammY).
- **сжатием UUID** — `compressCommand` / `compressAction` / `shrink` (на отправке),
  `expandAction` (на входе callback).
- **исполнением `BotCommand`** — `execute(session, tgId, command)`: send/edit,
  удаление клавиатуры, `lastBotMessage`, `captureInput`/`releaseInput`.
- **проактивной отправкой** — `send(telegramId, command)` (интерфейс `ProactiveSender`).

Методы-обработчики (`handleStart`, `handleCallback`, `handleMessage`,
`handleCancel`, `handleHelp`) принимают `ctx` и возвращают `void`.

> Префиксация кнопок здесь **не** выполняется — она переехала в `BotController`.

### 2.3. `BotUiApp` / `U7BotUiApp` (маршрутизация)

`packages/core/src/ui/bot/ui-app.ts` — центральный хаб. Владеет:

- **реестром контроллеров** (`getController(name)`);
- **резолвером актора** (`actorResolver: (tgId) => Promise<TActor>`, задаётся в `init`);
- **маршрутизацией**: `handleCallback/handleMessage/handleCancel/handleTimeout(tgId, ...)`;
- **обработкой `delegate`**: `#handleDelegate` + `#mergeResponses` (delegate.path — всегда полный маршрут `controller:story:action:...`, первый сегмент резолвится как контроллер).

`handleCallback(data, tgId, session)`:
1. `resolveActor(tgId)` → `User`;
2. `extractControllerName(data)` → имя контроллера;
3. `controller.handleCallback(extractRestData(data), actor, session)`;
4. `#applyCapturedInput(session, controllerName, response)`;
5. если `response.delegate` — `#handleDelegate` (первый сегмент `delegate.path` — имя контроллера) и смержить через `#mergeResponses`.

`U7BotUiApp` (`apps/u7-bot/src/core/ui-app.ts`) закрывает дженерики
`<U7BotAppMeta, User>` и добавляет систему меню: `collectMainMenu`, `collectHelp`,
`collectAllMenuItems`, `collectAllHelpDescriptions`, `handleWelcome`, `handleHelp`.

### 2.4. `BotController` / `U7BotController` (диспетчер)

`packages/core/src/ui/bot/bot-controller.ts`. Владеет:

- `name` — префикс контроллера в `callback_data`;
- `stories` — реестр сторис;
- **префиксацией кнопок и `delegate.path`** (`#prefixResponse` / `#prefixCode`): к кодам стори
  добавляется `${name}:`; коды с префиксом другого контроллера (`app:main-menu`)
  не трогаются;
- `handleError(err)` — универсальный обработчик ошибок;
- `cb(action)` — `${name}:${action}`; `stripPrefix(data)`.

`handleCallback/handleMessage/handleCancel/handleTimeout` находят стори
(`${story.name}:`-префикс или `session.activeHandler.path`), делегируют и
возвращают ответ **с уже добавленным префиксом**.

`U7BotController` (`apps/u7-bot/src/core/u7-bot-controller.ts`) закрывает
дженерики `<U7BotAppMeta, User>` и добавляет систему меню: `handleStart`,
`handleWelcome`, `handleHelpMessage`, поле `uiApp`.

### 2.5. `BotUiStory` / `U7BotUiStory` (сценарий)

`packages/core/src/ui/bot/bot-ui-story.ts`. Сценарий одного экрана:
выполняет UC через `this.appApi.execute(...)`, формирует `BotResponse`
(текст MarkdownV2, клавиатуру, `captureInput`/`releaseInput`/`delegate`).

Хелперы: `cb(action, ...ids)` (код своей стори), `cbFor(story, action, ...ids)`
(код соседней стори того же контроллера), `confirm(...)`, `escapeMarkdown`,
`formatDate`, `handleError`.

`U7BotUiStory` закрывает дженерики `<U7BotAppMeta, User>` и добавляет
`handleStart(actor)` — кнопку стори в главном меню.

### 2.6. `BotCommand` / `BotResponse` (типы)

`packages/core/src/ui/bot/types.ts`:

```ts
BotCommand   // «приказ» транспорту: send/edit + сессия (captureInput/releaseInput)
BotResponse extends BotCommand  // + delegate (маршрутная директива, ест BotUiApp)
```

Стори/контроллеры возвращают `BotResponse`; `BotTransport.execute()`/`send()`
принимают `BotCommand`. `delegate` до транспорта не доходит — его съедает `BotUiApp`.

### 2.7. `SessionData` (сессия)

`{ activeHandler: { path, context?, expiresAt? } | null, lastBotMessage? }`.

- `activeHandler` — какой обработчик активен (для `handleMessage`/`handleCancel`
  и `captureInput`/`releaseInput`).
- `lastBotMessage` — последнее сообщение бота (для удаления клавиатуры и `editMessage`).

---

## 3. Поток обработки

### 3.1. Вход события

`main.ts` регистрирует Grammy-обработчики:

```ts
bot.command('start', (ctx) => transport.handleStart(ctx));
bot.command('help',  (ctx) => transport.handleHelp(ctx));
bot.command('cancel', (ctx) => transport.handleCancel(ctx));
privateBot.on('callback_query:data', (ctx) => transport.handleCallback(ctx));
privateBot.on('message:text', (ctx, next) => transport.handleMessage(ctx, next));
```

### 3.2. Callback (нажатие кнопки)

```
Grammy ctx (callback_query.data)
  → BotTransport.handleCallback(ctx)
    → expandAction(data)                      // разжатие UUID (shortIds)
    → BotUiApp.handleCallback(data, tgId, ctx.session)
      → resolveActor(tgId)                    // User из userFacade
      → extractControllerName → controller
      → controller.handleCallback(rest, actor, session)
        → поиск стори → story.handleCallback(...)
          → appApi.execute(UC) → BotResponse
        ← BotResponse (коды с префиксом name:)
      ← delegate: обработать + #mergeResponses
    ← BotResponse (без delegate)
    → compressCommand(response)               // сжатие UUID кнопок
    → execute(session, tgId, command)         // grammy Api: send/edit + сессия
    → ctx.answerCallbackQuery()               // ack Telegram
```

### 3.3. Текстовое сообщение (`captureInput`)

`handleMessage` аналогичен, но маршрут идёт через `session.activeHandler.path`
(`<controller>/<story>`), а не через `callback_data`. Если `activeHandler` пуст —
`next()` (сообщение не боту).

### 3.4. `/start`, `/help`, `/cancel`

- `/start` → `handleWelcome` → приветствие + главное меню; `activeHandler = null`.
- `/help` → `handleHelpMessage` → инструкция + список описаний кнопок.
- `/cancel` → `handleCancel` → активная стори или «Нечего отменять».

### 3.5. Проактивные сообщения

Фасады (например `TelegramQuestionnaireBotFacade`) шлют через
`transport.send(telegramId, command)` — минуя `BotUiApp`. Поэтому `execute()` сам
применяет `captureInput`/`releaseInput` и сжатие (`compressCommand`).

---

## 4. Формат `callback_data` и сжатие

Формат: `controller:story:action:...ids`.

- **Префиксация** — в `BotController` (`#prefixCode`): стори возвращает
  `story:action`, контроллер превращает в `controller:story:action`. Коды, уже
  содержащие префикс контроллера (`app:main-menu`), не трогаются.
- **Кросс-контроллерные коды** — канонические адреса в реестре `Routes`
  (`apps/u7-bot/src/controllers/shared/routes.ts`), готовые кнопки — в
  `buttons.mainMenu(text?)` (`apps/u7-bot/src/controllers/shared/buttons.ts`). `delegate.path`
  всегда полный маршрут: стори пишет относительный путь через `cb`/`cbFor`,
  контроллер префиксует его в `#prefixResponse`, `BotUiApp` резолвит первый
  сегмент как контроллер.
- **Сжатие** — в `BotTransport`: каждый UUID-сегмент заменяется на первые 8
  hex-символов (`shortIds`), на входе `expandAction` разворачивает обратно.
  Гарантирует `callback_data ≤ 64 байта`.

---

## 5. Сборка приложения

`main.ts`:

1. `config = loadConfig()`.
2. `sessionMap = new Map<number, SessionData>()`.
3. `bot = createBot(config.botToken, sessionMap)`.
4. `apiBundle = createApiApp(config, logger, tgFacade)` — доменные модули + репозитории.
5. `createUiApp(apiApp, apiBundle, config)` — все контроллеры + `U7BotUiApp`,
   `uiApp.init(resolve)` — каскадная инициализация по дереву (resolve = `{ eventBus, actorResolver, appApi, uiApp }`).
6. `transport = new BotTransport(uiApp, bot.api, sessionMap)`.
7. Регистрация Grammy-обработчиков → `transport.handle*`.

---

## 6. Связанные документы

- [BotController Styleguide](./skills/bot-controller.md)
- [BotUiStory Styleguide](./skills/bot-ui-story.md)
- [Тестирование бота](./bot-test.md)
- [Границы архитектуры](./architecture.md)
- [Domain boundaries](./domain-boundaries.md)
