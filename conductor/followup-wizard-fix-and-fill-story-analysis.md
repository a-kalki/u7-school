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
  (`captureInput.path = 'view-stream/enroll-key'`) — тот же баг. Теперь покрыт
  новым падающим тестом (см. «Воспроизведение» ниже): текстовое сообщение с
  кодовым словом не доходит до стори.

Стори, использующие путь **без** `/` (например `fill.story.ts` в callback-потоке
ставит `path: 'fill'`, onboarding — `path: 'questionnaire'`), не затронуты: для
них `execute()` корректно дополняет контроллер из существующего activeHandler.

### Второй баг в том же месте (обнаружен при покрытии тестом)

Помимо перетирания пути в `execute()`, есть второй баг — в самой стори
`view-stream.story.ts`. Её `handleMessage` сравнивает **полный** путь с
**относительным**:

```ts
if (!ctx || session.activeHandler?.path !== 'view-stream/enroll-key') {
  return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
}
```

После фикса транспорта путь станет `stream/view-stream/enroll-key`, и эта проверка
всё равно вернёт «Неизвестное сообщение». Проверка лишняя (стори уже получила
маршрут от контроллера через `#findStoryByPath`) — достаточно проверять только
`context`.

### Воспроизведение (новый падающий тест)

В `apps/u7-bot/tests/streams/view-stream.integration.test.ts` добавлен тест:

```
enroll-key: гость вводит кодовое слово и записывается
```

Сценарий: карточка потока `e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4` (Поток 5,
`enrollmentKey: secret123`) → кнопка «Записаться» → ввод `secret123`. Падает на
шаге ввода слова: message не доходит до стори (тот же баг). После фикса должен
стать зелёным.

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

---

## Часть 3. Дизайн: захват/освобождение ввода (captureInput / activeHandler)

### Суть проблемы в общем виде

Проект кодирует маршрут обработчика в строку с тремя уровнями
`контроллер / стори / подшаг` и использует в разных местах **разные и
одинаковые** разделители:

| Где | Формат | Пример | Амбивалентность |
|---|---|---|---|
| `callback_data` | `controller:story:action:id1:id2` | `stream:view-stream:view:<uuid>` | нет — контроллер всегда первый сегмент (добавляет `#prefixResponse`) |
| `activeHandler.path` | `controller/story/subpath` | `stream/view-stream/enroll-key` | нет — всегда полный |
| `captureInput.path` (задаёт стори) | `story`, `story/subpath` или `controller/story` | `fill`, `create-stream/wizard`, `questionnaire/fill` | **ДА** — то контроллер есть, то нет |

Баг Части 1 — следствие последней строки: `captureInput.path` бывает трёх видов,
и код угадывает вид через `includes('/')`.

### Предложение пользователя: отдельный разделитель для контроллера

Идея: дать имени контроллера свой разделитель, чтобы при разборе строки было
однозначно видно, есть ли сегмент контроллера. Пример автора:

```
ctrl-name_story-name:action-name:uuid1:uuid2
```

(контроллер от стори отделён `_`, стори/экшен/аргументы — `:`.)

**Плюсы:** строка самодокументируется; любой слой может отличить полный путь от
относительного без внешнего знания.

**Минусы/риски:**
1. Это «обнаружение», а не «предотвращение»: стори всё равно должна решать,
   писать ли ей контроллер — источник амбивалентности остаётся.
2. Новый символ сам становится источником хрупкости: если имя стори/контроллера
   содержит `_` (или выбранный символ) — нужна валидация/экранировка, то есть
   ещё одна договорённость.
3. Баг Части 1 живёт в `activeHandler.path` (разделитель `/`), а пример автора —
   про `callback_data` (`:`). Чтобы разделитель реально помог, его надо ввести в
   **обоих** форматах, то есть унифицировать.

Вывод: идея рабочая, но решает половину проблемы и добавляет договорённость о
символах. Предпочитаю другой путь (см. ниже).

### Моё предложение: «стори пишет только story-relative, префикс — ровно в одном месте»

Базовый принцип уже заявлен в styleguide для callback-кодов: **стори не знает
имени контроллера**. Распространяем его же на `captureInput.path`:

1. **`captureInput.path` всегда `story` или `story/subpath`** — без контроллера.
   - `fill.story.ts` (callback): `path: 'fill'` — уже так.
   - `fill.story.ts` (проактивный): сейчас `'questionnaire/fill'` → меняем на `'fill'`.
   - `create-stream.ts`: `'create-stream/wizard'` — уже story-relative.
   - `view-stream.story.ts`: `'view-stream/enroll-key'` — уже story-relative.

2. **Полный путь `controller/story/subpath` собирают только те, кто знает контроллер:**
   - callback-поток: `BotUiApp.#applyCapturedInput()` — уже делает
     `${controllerName}/${path}`.
   - проактивный поток: `BotController.send()` — **новое**. Контроллер перед
     отправкой префиксует `captureInput.path` своим именем (так же, как уже
     префиксует коды кнопок через `#prefixCommand`).

3. **`BotTransport.execute()` перестаёт трогать `activeHandler`** (остаются только
   send/edit + `releaseInput`). Он становится «тупым исполнителем».

4. **`BotTransport.send()`** (проактивный вход) сам ставит `activeHandler` из
   уже полного `captureInput.path`.

Что это даёт:
- амбивалентность исчезает в корне (стори никогда не пишет контроллер);
- не нужен новый разделитель и валидация имён;
- каждый формат собирается ровно в одном месте — эвристики не нужны.

### Конкретный план правок

1. `apps/u7-bot/src/infra/bot-transport.ts` — в `execute()` удалить блок
   `if (command.captureInput) { ... }` (оставить `releaseInput`).
2. `packages/core/src/ui/bot/bot-controller.ts` — в `send()` после
   `#prefixCommand` префиксовать `captureInput.path`:

   ```ts
   async send(telegramId, command) {
     const prepared = this.#prefixCommand(command);
     if (prepared.captureInput) {
       prepared.captureInput = {
         ...prepared.captureInput,
         path: `${this.name}/${prepared.captureInput.path}`,
       };
     }
     await this.proactiveSender.send(telegramId, prepared);
   }
   ```

3. `apps/u7-bot/src/infra/bot-transport.ts` — в `send()` ставить activeHandler:

   ```ts
   async send(telegramId, command) {
     let session = this.sessionMap.get(telegramId);
     if (!session) session = { activeHandler: null };
     const compressed = this.compressCommand(command);
     await this.execute(session, telegramId, compressed);
     if (compressed.captureInput) {
       session.activeHandler = {
         path: compressed.captureInput.path, // уже controller/story/...
         context: compressed.captureInput.context,
         expiresAt: compressed.captureInput.ttlSeconds
           ? Date.now() + compressed.captureInput.ttlSeconds * 1000
           : undefined,
       };
     }
     this.sessionMap.set(telegramId, session);
   }
   ```

4. `apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts` — в
   `handleMessage()` убрать сравнение полного пути с относительным (второй баг):

   ```ts
   // было: if (!ctx || session.activeHandler?.path !== 'view-stream/enroll-key')
   if (!ctx) {
     return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
   }
   ```

5. `apps/u7-bot/src/controllers/questionnaire/fill.story.ts` — в `#handleStartEvent`
   поменять `path: 'questionnaire/fill'` → `path: 'fill'` (стори не знает контроллер).

6. Прогнать: `bun test apps/u7-bot/tests/streams/ apps/u7-bot/tests/mentor/`
   и `bun run check:a u7-bot`.

### Что ещё проверить при фиксе

- `#findStoryByPath` в `BotController` берёт `parts[1]` как имя стори — при
  «всегда полный путь» это остаётся корректным.
- `onboarding/controller.ts` — контроллер **без стори**, использует
  `path: 'questionnaire'`. Убедиться, что после правки `execute()` его
  маршрутизация не сломалась (у него, вероятно, свой `handleMessage`).
- `fill.story.ts` после смены на `path: 'fill'` — проактивный `captureInput`
  должен по-прежнему давать полный `questionnaire/fill` в сессии (это сделает
  `BotController.send`).

### Почему предпочитаю это варианту с разделителем

- Убирает причину (стори не знает контроллер), а не симптом (как отличить формат).
- Не вводит «магический символ», который надо валидировать/экранировать.
- Переиспользует уже существующий принцип styleguide для callback-кодов.

Если захочется сделать строки самодокументируемыми (например, для отладки) —
можно дополнительно ввести разделитель контроллера, но это уже не обязательно.
