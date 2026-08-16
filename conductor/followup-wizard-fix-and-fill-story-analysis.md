# Follow-up: падающие тесты wizard + анализ разделения стори fill

> **Статус:** временный файл для работы в отдельной сессии. Трек
> `ui-proactive-sender_20260816` завершён и отправлен в архив.
> Этот файл содержит два независимых вопроса для будущей работы.

**Дата:** 2026-08-16
**Базовая точка:** коммит `efdfb1fe` (трек помечен `[x]`) + два незакоммиченных
файла `packages/core/src/ui/bot/{bot-controller,ui-app}.ts` (мелкие правки
комментариев и форматирования — закоммичены отдельно).

---

## Часть 1. Падающие тесты «Создание потока (wizard)»

### Симптомы

`bun run check:a u7-bot` падает на 4 тестах (pre-existing, НЕ вызваны треком
ProactiveSender — подтверждено на коммите `186f14ec` через `git worktree`):

- `apps/u7-bot/tests/mentor/mentor.integration.test.ts`
  - `CreateStream Wizard (интеграционный) > полный wizard: все шаги → поток создан`
  - `CreateStream Wizard (интеграционный) > wizard: отмена создания потока через /cancel`
- E2E-тест ментора «Создание потока (wizard)» (полный цикл и отмена).

Ошибка характерная:
```
expect(step1.sendMessage?.text).toContain('название потока');
error: Received value must be an array type, or both received and expected values must be strings.
```
То есть `step1.sendMessage` === `undefined`. При отладочной печати `step1 = {}`
(пустой `BotResponse`).

### Диагностика (что уже выяснено)

Причина: на втором шаге wizard-а `BotUiApp.handleCallback` упирается в ветку
«⚠️ Сначала завершите текущее действие (/cancel)», из-за чего
`BotTransport.handleCallback` показывает alert и **не отправляет сообщение**
(`#run` в `TestBotTransport` реконструирует пустой `BotResponse`).

Корень — рассинхрон формата `session.activeHandler.path`. После шага 0
(выбор модуля) в сессии лежит:

```json
{ "activeHandler": { "path": "create-stream/wizard", ... } }
```

Ожидалось `"mentor/create-stream/wizard"` (с префиксом контроллера). Первый
сегмент пути трактуется как имя контроллера: `"create-stream"` ≠ `"mentor"`,
поэтому резолв контроллера не удаётся и срабатывает «завершите текущее
действие» / releaseInput без сообщения.

### Корневая причина (механика)

`activeHandler.path` формируется в **двух местах**, и второе перетирает первое:

1. `packages/core/src/ui/bot/ui-app.ts` — `#applyCapturedInput()` (callback-поток)
   корректно ставит префикс контроллера:

   ```ts
   session.activeHandler = {
     path: `${controllerName}/${response.captureInput.path}`, // mentor/create-stream/wizard
     ...
   };
   ```

2. `apps/u7-bot/src/infra/bot-transport.ts` — `execute()` (общий для callback и
   проактивного потока) **перезаписывает** путь, если `captureInput.path`
   содержит `/` (эвристика «это уже полный путь»):

   ```ts
   if (command.captureInput) {
     const path = command.captureInput.path.includes('/')
       ? command.captureInput.path                 // create-stream/wizard — берётся как есть
       : `${session.activeHandler?.path.split('/')[0] ?? ''}/${command.captureInput.path}`;
     session.activeHandler = { path, ... };         // перетирает mentor/create-stream/wizard
   }
   ```

   `CreateStreamStory` использует `captureInput.path = WIZARD_PATH`, где
   `WIZARD_PATH = 'create-stream/wizard'` (формат `story/subpath`, содержит `/`),
   поэтому эвристика считает его «полным путём» и подставляет без префикса.

Эвристика `includes('/')` введена коммитом
`dc69eeff feat(u7-bot): подключить TelegramQuestionnaireBotFacade`. До него был
код, который всегда брал контроллер из существующего activeHandler:

```ts
const activeCtrl = session.activeHandler?.path.split('/')[0] ?? '';
session.activeHandler = { path: `${activeCtrl}/${command.captureInput.path}`, ... };
```

Этот старый вариант корректно работал для callback-потока, но ломал
проактивный поток (ведущий `/` при пустой сессии) — ради проактивного потока
его и заменили.

### Затронутые места (тот же паттерн бага)

Все стори, использующие в callback-потоке `captureInput.path` с `/`:

- `apps/u7-bot/src/controllers/mentor/stories/create-stream.ts`
  (`WIZARD_PATH = 'create-stream/wizard'`) — даёт видимые падения.
- `apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts`
  (`captureInput.path = 'view-stream/enroll-key'`) — потенциально тот же баг,
  но не покрыт тестами, поэтому не падает.

Стори, использующие путь **без** `/` (например `fill.story.ts` в callback-потоке
ставит `path: 'fill'`, onboarding — `path: 'questionnaire'`), не затронуты: для
них `execute()` корректно дополняет контроллер из существующего activeHandler.

### Направления фикса

**Рекомендуемый вариант — разнести ответственность по потокам:**

1. Убрать блок `captureInput` из `BotTransport.execute()` (он не должен трогать
   `activeHandler` в callback-потоке — там уже отработал `#applyCapturedInput`).
2. Перенести установку `activeHandler` из `captureInput` в `BotTransport.send()`
   (проактивный поток). Там `captureInput.path` — **всегда полный путь**
   `controller/story` (например `questionnaire/fill`), поэтому его можно
   записывать как есть:

   ```ts
   async send(telegramId, command) {
     let session = this.sessionMap.get(telegramId);
     if (!session) session = { activeHandler: null };
     const compressed = this.compressCommand(command);
     await this.execute(session, telegramId, compressed);
     if (compressed.captureInput) {
       session.activeHandler = {
         path: compressed.captureInput.path,      // полный путь controller/story
         context: compressed.captureInput.context,
         expiresAt: compressed.captureInput.ttlSeconds
           ? Date.now() + compressed.captureInput.ttlSeconds * 1000
           : undefined,
       };
     }
     this.sessionMap.set(telegramId, session);
   }
   ```

   `releaseInput` оставить в `execute()` (идемпотентно для обоих потоков).

3. После фикса — прогнать `bun run check:a u7-bot` и убедиться, что 4 wizard-теста
   зелёные, плюс проактивная анкета (трек ProactiveSender) не регрессирует.

**Альтернативный (менее чистый) вариант:** в `execute()` заменить эвристику на
проверку, что первый сегмент пути — реальное имя контроллера; иначе дополнять
префиксом. Хрупко (список контроллеров транспорт не знает), поэтому не
рекомендуется.

---

## Часть 2. Анализ: разделять ли стори `fill` (проактивный запуск vs заполнение)

### Текущее состояние `FillStory` (`apps/u7-bot/src/controllers/questionnaire/fill.story.ts`)

`FillStory` (имя `'fill'`) сейчас совмещает **две** роли:

1. **Проактивную** (entry через доменные события):
   - `getEventSubscriptions()` → `questionnaire:start`, `questionnaire:invite`;
   - `#handleStartEvent` (S02–S04) и `#handleInviteEvent` (S01) шлют через
     `this.proactiveSender.send(...)` с полным `captureInput.path = 'questionnaire/fill'`.

2. **Интерактивную** (entry через кнопки/ввод пользователя):
   - `handleCallback` (`fill:start`, `fill:why`, `fill:invite`, `fill:decline`,
     `fill:answer`, `fill:next`, `fill:current`, `decline-confirm`, `cancel-confirm`);
   - `handleMessage` (текстовый ответ), `handleCancel`;
   - `#callUc` + рендеринг `#renderActionResponse`.

Обе роли делят **общий рендеринг** S01–S04:
`#renderActionResponse`, `#formatQuestionMd`, `#getKeyboard`, `#inviteKeyboard`,
`#makeNextCode`.

### Варианты

**A. Оставить как есть (один `FillStory`).**
- Плюсы: рендеринг не дублируется; обе роли оперируют одним `questionnaireId`
  и одним набором callback-кодов `fill:*`.
- Минусы: класс большой (~450 строк), смешаны два разных «входа» в сценарий;
  проактивная часть не совсем вписывается в модель «стори = один экран»
  (у неё нет осмысленного `handleCallback`/`handleMessage`).

**B. Разделить на две стори:**
- `FillStory` — только интерактивное заполнение (как сейчас, но без подписок).
- Новая стори (например `questionnaire-launch.story.ts`, имя `'launch'`) — только
  `getEventSubscriptions()` + рендер S01–S04 проактивно; `handleCallback`/
  `handleMessage` — заглушки «неизвестная команда».
- Общий рендеринг вынести в отдельный модуль/хелпер (например
  `controllers/questionnaire/render.ts`) или в базовый класс.

### Ключевой нюанс варианта B

Проактивная стори рендерит кнопки, которые ведут в **интерактивную** стори
`fill` (`fill:start`, `fill:why`, `fill:decline`, `fill:answer`, `fill:next`).
Сейчас `FillStory` генерит их через `this.cb(...)` (относительно себя). Если
выносить рендер наружу, он должен генерировать коды относительно имени `'fill'`
фиксированно (или через параметр storyName). Это добавляет индирекцию, но не
усложняет смысл: все экраны анкеты по-прежнему принадлежат стори `fill`.

### Вывод / рекомендация

Разделение **оправдано по чистоте ответственности**, но **не является
срочным** и не даёт выигрыша по объёму кода (рендеринг просто переезжает в
общий хелпер). Целесообразность:

- **Сейчас** (в ближайших треках) можно оставить один `FillStory` — он рабочий,
  тесты зелёные, рендеринг DRY.
- **Стоит разделить**, если планируется расширение проактивного поведения
  (новые события, отдельная логика приглашений, отличная от интерактивного
  invite) или если нужно тестировать проактивный запуск изолированно.

Если решим разделять — рекомендую схему:

```
controllers/questionnaire/
  render.ts                    # чистый рендер S01–S04 (генерит коды fill:*)
  fill.story.ts                # интерактивное заполнение (name='fill')
  launch.story.ts              # проактивный запуск (name='launch', только подписки)
```

`launch.story.ts` объявляет `getEventSubscriptions()`, вызывает `render.ts` и
шлёт через `this.proactiveSender.send(...)`. `fill.story.ts` вызывает тот же
`render.ts` в `#callUc`.

---

## Контекст выполненного трека (для ориентира)

Трек `ui-proactive-sender_20260816` (уже заархивирован) сделал:
- `ProactiveSender` перенесён в `packages/core/src/ui/bot/types.ts`;
- цепочка `transport → BotUiApp → BotController → BotUiStory` через
  `init(resolve, sender)` отдельным аргументом;
- `#prefixCommand` вынесен из `#prefixResponse` в `BotController`;
- `create-ui-app.ts` разделяет создание/init; `main.ts` вызывает
  `uiApp.init(resolve, transport)` + `uiApp.subscribeEvents()`;
- рендер S01–S04 перенесён из удалённого `TelegramQuestionnaireBotFacade` в
  `FillStory` (подписки `questionnaire:start`/`questionnaire:invite`).

Точное место проактивного `captureInput` (полный путь) — `fill.story.ts`,
`#handleStartEvent`; callback-поток использует `path: 'fill'` (без `/`), поэтому
описанный в Части 1 баг его не касается.
