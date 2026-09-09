# Bot UI: концепция «Диалог и Экран»

> v4 (2026-09-08). Утверждённая целевая архитектура bot-ui и самодостаточный
> контекст для треков миграции (§9). Концепция проработана в сессии 2026-09-05,
> решения владельца зафиксированы в §10; дополнения трека 1.1 (жизненный цикл
> диалога, pipe команд, kind-уведомления) — 2026-09-06…08. История: v1/v2
> анализировали as-is (проблемы П1–П5, инцидент анкеты, guard-предложение);
> guard **не реализован** — вместо него принято это архитектурное решение.
> Живой контракт: `packages/core/src/ui/bot/types.ts` (ядро),
> `apps/u7-bot/src/infra/bot-transport.ts` (транспорт).

---

## 1. Глоссарий

- **Диалог** — активный интерактивный контекст пользователя: `path`
  (`controller/story`) + счётчик `seq` + ожидание ввода. До первого `/start`
  диалог **не открыт** (`dialog === undefined`, ФР-1). Заменяет `activeHandler`.
- **Экран** — сообщение бота с (опц.) клавиатурой. **Активный экран** — ровно
  один в чате, принадлежит диалогу (`ownerSeq`). Заменяет `lastBotMessage`.
- **Штамп (`seq`)** — монотонный счётчик открытий диалога. Проставляется
  транспортом в каждый `callback_data` (`:~<base36>`), сверяется при приёме.
  Кнопка валидна ⟺ её штамп == текущему `dialog.seq`.
- **Мост** — кнопка текущего экрана, ведущая в другой диалог/контроллер.
  Легальна по построению (валидный штамп). Полностью заменяет takeover.
- **Маркер выбора** — строка `—————\nВы выбрали: <текст кнопки>`, которой
  транспорт сопровождает ретир (снятие клавиатуры) прошлого экрана при
  send-пути. Текст кнопки ищется в клавиатуре ретируемого экрана по коду
  нажатой кнопки.
- **Финализация (`finalize`)** — перезапись активного экрана (текст стори,
  клавиатура снимается) перед показом нового. Паттерн анкеты «зафиксируй
  выбор → открой следующий вопрос».
- **Реплика (`notify`)** — фоновое сообщение поверх диалога: не экран, не
  трогает сессию и клавиатуры. Вид (`kind`) — единый словарь 🔔/ℹ️/⚠️,
  дефолт реплики — `info`. Канал для `/help`, подсказок, ошибок валидации.
- **Уведомление (`notify`)** — проактивное сообщение (дефолт вида `notify`,
  🔔). Проактивный канал: `notify` — текст без кнопок; временное исключение —
  `invite` (ФР-6, до tasks-system).
- **Команда** — глобальный слэш-переключатель (`/start`, `/cancel`, будущий
  `/tasks`). Единственный способ сменить диалог без кнопки. Обрабатывается
  трёхуровневым pipe `handleCommand` (§6).

## 2. Диагноз as-is (почему `BotResponse` не справляется)

`BotCommand` — императивный список транспортных операций, отсюда системные
проблемы (нумерация из v2):

- **П1** — `lastBotMessage` «ничейный»: edit-хелперы сторей (`editOrSend`,
  `respondInContext`, `renderPreviousQuestion`) безусловно берут `messageId`
  → любой флоу редактирует чужой экран.
- **П2** — конкурентность: webhook без сериализации, апдейты минуют
  `#enqueue` → lost update.
- **П3** — stale-callback: при `activeHandler == null` проверка «чужой
  контроллер» пропускается → старые кнопки доезжают до стори (инцидент анкеты).
- **П4** — сессии и `shortIds` в памяти.
- **П5** — ошибки Telegram API глушатся `.catch(() => {})`.

Факты, установленные проработкой (важны для скромности контракта):

- `sendMessages` **не используется** ни одной прод-сторией (welcome — одно
  сообщение) → серия экранов в контракт не входит.
- `ttlSeconds`/`expiresAt` **не используются** ни одной сторей; `handleTimeout` —
  мёртвый код → TTL удаляется (§7).
- `delegate` — 3 живых использования (enroll→menu, enroll-cancel→view,
  monitor→students) → сохраняется.

Корень проблем: «активный диалог» не материализован (есть только у capture-сторий,
не владеет экраном, перехватываем), а стори знают транспорт (messageId, edit/send,
keepPrevKeyboard). Решение — диалог как первоклассное понятие core и максимально
декларативный ответ стори.

## 3. Инварианты

- **И1. Диалог не более одного.** До первого `/start` диалога нет —
  состояние «не открыт» явное (`BotSession.dialog?`, ФР-1). Открытый диалог
  один, владеет вводом и экраном. Открытие/смена — только операция
  `enterDialog` (ФР-2: `reopen` — команды, `switch` — мост/delegate).
  Перехват не существует.
- **И2. Один живой экран.** Ровно одно сообщение в чате несёт клавиатуру —
  активный экран диалога. Новый экран гасит клавиатуру прежнего (retire).
  Кнопки не текущего экрана отвергаются транспортом alert'ом **без
  исключений** (штамп, ФР-3), до uiApp/стори не доезжают.
- **И3. Проактив не трогает диалог.** `notify` — текст без кнопок, не читает
  и не пишет сессию. «Проактивный запуск диалога» — вариант A (§10): сервер
  только зовёт. Временное исключение до tasks-system — `invite` (ФР-6):
  получателю без диалога открывается якорь `app/invite` (seq = 1).

## 4. Контракты (типы)

Живут в `packages/core/src/ui/bot/types.ts`. Направление: вверх к стори — всё
декларативнее, вниз к транспорту — машиннее. Сторя не видит ни `messageId`,
ни сессию, ни штампы.

### `MdText` + хелпер `md` — безопасный MarkdownV2

```ts
type MdText = string & { readonly __md: never };
function md(strings: TemplateStringsArray, ...values: unknown[]): MdText;
function mdRaw(text: string): MdText; // явный «уже с разметкой» (редкие случаи)
```

Экранирование решается на трёх уровнях: (1) **тип** — `Screen.text`,
`finalize.text`, `NotificationPayload.text` принимают только `MdText`,
производимый только `md`; доменные данные вставляются через `${}`-интерполяцию
и экранируются автоматически, забывание невозможно компилятором; (2) **формат
фиксирован** — `parseMode` исчезает из всех типов, транспорт всегда шлёт
MarkdownV2; (3) **fail-fast** — текущий `assertResponseMarkdownSafe` остаётся
(ловит битые литералы в `md`-шаблонах). Тексты кнопок — plain, как и сейчас.

### `Screen` — экран

```ts
interface Screen {
  text: MdText;
  keyboard?: KeyboardDescription; // только у активного экрана
}
```

### `KeyboardDescription` — клавиатура (почти без изменений)

`rows: { text: string; code: string; url?: string }[][]`, `isMultiple`.
Коды — `story:action[:id...]` без префикса контроллера (префиксует
контроллер), без сжатия и штампа (транспорт сжимает и штампует).
**Поле `takeover` удаляется** — мостом признаётся любая валидная кнопка.

### `DialogResponse` — ответ стори (замена `BotResponse`)

```ts
interface DialogResponse {
  screen?: Screen;              // показать экран диалога
  finalize?: { text: MdText };  // перезаписать активный экран (фиксация выбора)
  notify?: { text: MdText; kind?: NoticeKind }; // реплика поверх диалога (без клавиатуры)
  awaitInput?: { context?: unknown };   // ждать текстовый ввод (path уже известен — это dialog.path)
  release?: boolean;            // снять ожидание текста (диалог живёт на финальном экране)
  delegate?: { path: string };  // программный переход: seq++, рендер экрана целевой стори
}
```

Три способа повлиять на чат (`screen`/`notify`/`finalize`), два — на ввод
(`awaitInput`/`release`), один — на маршрут (`delegate`). Чего **нет**:
`messageId`, `keepPrevKeyboard`, `sendMessages`/`sendDelayMs`, `parseMode`,
`captureInput.path`, `takeover`, `ttlSeconds`, `info` (переименован в
`notify` с поглощением `Screen` — реплика без клавиатуры по построению;
ФР-5). Хелпер `errorNotify(err)` у стори — warn-реплика без захвата экрана:
при валидации ввода `awaitInput`-контекст сохраняется (переспрос).

`release` не убивает диалог: финальный экран остаётся экраном диалога,
кнопка «⬅️ Меню» на нём валидна. Смена диалога — только команда/мост.

### Сессия (владение — транспорт и uiApp)

```ts
interface DialogState {
  path: string;                          // 'questionnaire/fill'
  seq: number;                           // штамп
  input?: { context?: unknown };         // ожидание текста (без expiresAt — см. §7)
}
interface ScreenState {
  messageId: number;                     // знает только транспорт
  ownerSeq: number;                      // seq диалога-владельца
  text: string;                          // MdText (для retire-маркера)
  keyboard?: KeyboardDescription;        // для retire: снятие + поиск текста кнопки
}
interface BotSession { dialog?: DialogState; screen?: ScreenState }
```

`dialog === undefined` — диалог **не открыт** (до первого `/start`; ФР-1):
ленивая сессия с фиктивным меню удалена. `seq` прирастает только операцией
входа `enterDialog` (ФР-2, единственная точка инкремента): `switch`
(мост/delegate) — другой path → `seq+1`, тот же — продолжение без
изменений; `reopen` (`/start`, `/cancel`) — всегда `seq+1`, в т.ч.
«меню → меню». Всё сериализуемо → персистентность (П4) — отдельный
механический трек, структуры готовы. Сторя видит только
`dialog.input.context` (аргумент обработчиков).

### Команды (ФР-4)

```ts
type CommandUpdate = {
  type: 'command'; command: string; args: string;
  telegramId: number; name?: string; username?: string;
};
type CommandReaction =
  | { reaction: 'pass' }                              // «не моё»
  | { reaction: 'continue'; notice?: MdText }         // «моё», обход продолжается
  | { reaction: 'stop'; response: DialogResponse };   // терминальный ответ
```

Конверт собирает транспорт из слэш-текста (§5.6); ядро имён команд не
знает — pipe на трёх уровнях (§6).

### Проактив

```ts
type NoticeKind = 'notify' | 'info' | 'warn';
interface NotificationPayload { text: MdText; kind?: NoticeKind }
interface ProactiveSender {
  notify(telegramId: number, payload: NotificationPayload): Promise<void>;
  // ВРЕМЕННЫЙ (ФР-6), удаляется с tasks-system: кнопки штампуются seq
  // эпохи получателя на момент отправки; без диалога — якорь app/invite (seq = 1).
  invite(telegramId: number, payload: { text: MdText; keyboard: KeyboardDescription }): Promise<void>;
  kickFromGroup(groupId: number | string, userId: number): Promise<void>;
}
```

`send()` удалён. Кнопочные проактивы (InactivityStory, HubStory,
InviteStory, fill-подписки) мигрируют на notify-текст («есть дело — /tasks»)
в своих треках — это же предписывает [tasks-system-architecture.md](./tasks-system-architecture.md).
Приглашения анкет (трек 4) — по варианту A: `invite` со штампом текущей
эпохи получателя; опция deep-link URL-кнопки — без штампа.

`BotUpdate` — без изменений.

### Таблица «кто производит → кто потребляет»

| Тип | Производит | Потребляет | Заменяет |
|---|---|---|---|
| `MdText` | `md`/`mdRaw` | Screen, finalize, notify | `parseMode` + ручной `escapeMarkdown` |
| `Screen` | стори | транспорт | `SendMessage/EditMessageDescription` |
| `DialogResponse` | стори/контроллер | uiApp (delegate), транспорт | `BotCommand`/`BotResponse` |
| `CommandUpdate` | транспорт (парсинг слэш-текста) | pipe `handleCommand` | поимённые grammy-хендлеры |
| `CommandReaction` | стори/контроллер | контроллер, uiApp (агрегация) | `handleHelp`/`handleCancel`/appCommand-хук |
| `DialogState` | uiApp (`enterDialog`) + транспорт | транспорт, uiApp | `activeHandler` |
| `ScreenState` | транспорт | транспорт | `lastBotMessage` |
| `NotificationPayload` | домены (`userFacade.notify`) | транспорт | `NotificationPayload` (+kind) |
| `ProactiveSender` | транспорт (реализация) | стори, домены | − (`send` удалён) |

## 5. Политика рендера транспорта (единая точка исполнения)

Правило: **владеешь экраном — обновляешь (edit), не владеешь — создаёшь
(send + retire прежнего)**.

0. **Валидация callback — без исключений (ФР-3)**, порядок строгий: диалог
   не открыт → alert «Наберите /start»; штампа нет или ≠ `seq` → alert
   «Экран устарел — нажмите /start»; shortId из прошлой жизни сервиса →
   alert про рестарт. До uiApp доезжают только валидные кнопки — исключений
   валидации uiApp не получает вовсе.
1. **`finalize`** → edit активного экрана, только если
   `screen.ownerSeq === dialog.seq` (иначе warn-лог, пропуск): текст стори,
   клавиатура снимается. Без маркера выбора — сторя сама пишет финальные маркеры.
2. **`screen`** → если экран наш (`ownerSeq === seq`) и нет `finalize` → edit
   на месте; иначе → **retire** прошлого экрана (если есть клавиатура:
   клавиатура снять, добавить маркер выбора при известном коде кнопки;
   команды `/start` — retire без маркера) → send нового → `ScreenState`
   (ownerSeq = seq). Экран не наш → send (мост/команда/новый диалог).
3. **`notify`** → реплика в per-chat очередь; вид — единая таблица ФР-5
   (🔔 `notify` / ℹ️ `info` / ⚠️ `warn`; дефолт реплики — `info`, проактива —
   `notify`), сессию и экран не трогает — `awaitInput` живёт. Контекстный и
   общий `/help` рендерятся сюда.
4. **`awaitInput` / `release`** → `dialog.input` ставится/снимается. Ответ с
   экраном/вводом при не открытом диалоге — программная ошибка: warn-лог и
   пропуск (не падение); только `notify` возможен и без диалога.
5. **`delegate`** → uiApp (до транспорта): маршрутизация в целевую сторю,
   `enterDialog(switch)`, её ответ исполняется по тем же правилам;
   `notify`-реплика/`screen` инициатора склеиваются с ответом делегата по
   правилам слотов.
6. **Команды (ФР-4)**: слэш-текст перехватывается в едином `message:text`
   хендлере (`/`-префикс — это не ввод) и парсится в конверт
   `CommandUpdate`: ведущий `/`, суффикс `@botname` отброшен, `args` — вся
   строка после команды (сторя сам решает, как его парсить). Без
   поимённой grammy-регистрации и `setMyCommands`. Не-слэш-текст без
   ожидания ввода (или без адресата) — реплика-подсказка транспорта, до
   uiApp не доходит (next не нужен).

Механизмы транспорта:

- **Штампы**: на отправке транспорт дописывает `:~<seq36>` в код каждой
  callback-кнопки; на приёме сверяет первым делом (после проверки «диалог
  открыт», §5.0). Несовпадение (старый экран, кнопка из истории, гонка,
  рестарт, крафтовый `~0`, легаси-кнопка без штампа) → `answerCallbackQuery`
  «Экран устарел — нажмите /start», до uiApp не доходит. URL-кнопки — без
  штампа. Штамп — всегда последний сегмент, поэтому коллизия с короткими
  кодами, начинающимися с `~`, закрыта порядком парсинга. Старые (до
  деплоя) кнопки один раз умрут с тем же alertом — принято.
- **Очередь**: per-chat очередь на **всё** — `handle*` апдейты и `notify`
  (замена отсутствующему `sequentialize` в webhook; в polling — no-op).
  Закрывает П2 и сценарии S1–S3.
- **Ошибки Telegram API**: warn-лог вместо глушения (П5).
- **Сжатие UUID** (shortIds) — без изменений; штамп — дополнительный сегмент,
  в лимит 64 байта влезает.

## 6. Слои: что меняется, что нет

Поток не меняется: `Grammy → BotTransport → BotUiApp → Controller → Story → ApiApp`.

| Слой | Изменения |
|---|---|
| Grammy-адаптер | апдейты → `transport.handle*`; режимы polling/webhook как есть |
| **Transport** | политика рендера (§5), штампы, очередь на всё, `BotSession` вместо `SessionData`, `MdText`-тексты; единый вход команд (парсинг конверта), kind-таблица рендера, `invite`-якорь |
| **BotUiApp** | маршрутизация без проверок «чужой контроллер» (штамп решил); `enterDialog` — единственная точка `seq++` (`switch`/`reopen`); pipe `handleCommand` контроллеров с агрегацией реакций; ретрансляция `invite` |
| **BotController** | префиксация кодов (как есть); pipe своих стори с агрегацией; `handleError` → `DialogResponse` |
| **BotUiStory** | `handleCommand` (дефолт `pass`); **`contextHelp()`** — публичный мост для uiApp (справка только активной стори); `errorNotify(err)` — warn-реплика без захвата экрана; дефолт `handleMessage` — warn + реплика-отказ; `confirm()`/`handleError` на новом контракте; `md`-хелпер |
| **Прикладной u7-слой** | `U7BotUiApp`: `/start` и `/help` напрямую (мимо pipe), welcome/общий help из декларативных `menuButtons(actor)`, `/cancel` — `reopen(menu)`; `U7BotUiStory`: `isActive(session)`, дефолт cancel — сброс только активной |

**Команды (ФР-4, трёхуровневый pipe `handleCommand`: uiApp → контроллер → стори):**

- `/start` — НЕ через pipe (уровень приложения): гост-регистрация → лог →
  `reopen(menu)` → welcome-экран send'ом (retire прежнего без маркера);
  клавиатура — сбор `menuButtons(actor)` у всех стори. Явный сброс —
  принцип владельца.
- `/help` — тоже мимо pipe (ревизия ревью 2.2): активная стори → только её
  `contextHelp()`; во всех остальных случаях (меню, закрытый диалог,
  активная без справки) — общий справочник из `menuButtons`. Результат —
  `notify`-реплика. Инвариант: неактивная стори на `/help` не отвечает
  никогда — активность проверяет uiApp, не стори. Диалог и экраны живы.
- `/cancel` — через pipe: активная стори сбрасывает себя (`stop` с
  `notify`-ответом); неактивные — `pass` без побочных действий (сброс
  только активной; глобальный сброс делает uiApp). Глобальный возврат
  диалога в меню (`reopen(menu)` + короткое меню) делает uiApp после pipe.
- прочие — pipe: активный контроллер первым (активная стори первой),
  агрегация: первый `stop` побеждает, `continue`-нотисы склеиваются, все
  `pass` → дефолты приложения. `/log_level` — обычный pipe-override
  app-контроллера (админ/не-админ), не исключение. Неизвестная команда —
  подсказка уровня приложения.
- Клавиатура меню — **декларативные данные** `MenuButton` (кнопка,
  описание, приоритет), не обработчики; `menuButtons(actor)` собирают
  контроллеры от стори, экраны строит uiApp. Словаря команд и
  `setMyCommands` нет — команда доставляется конвейером по адресу.

## 7. TTL ввода — удаляется

Проверено: `ttlSeconds` не задаётся ни одной сторей; `expiresAt` всегда
undefined; ветка `handleTimeout` — мёртвый код. Долгое бездействие обслуживают
доменные механизмы: sweep брошенных анкет (questionnaire-модуль), будущие
задачи-продолжения (tasks-system). Поэтому: `awaitInput` без `ttlSeconds`,
`input` без `expiresAt`, цепочка `handleTimeout` удаляется из контрактов.
Вернуть при реальной потребности — неразрушающее расширение.

## 8. Совместимость с tasks-system

- **Доменные рендеры кнопок**: список `/tasks` — обычный экран диалога
  `tasks`; кнопки задач несут штамп. `TaskRenderInfo` (канало-независимые
  actions) + `TaskKindRenderer` (контроллер-владелец, `actionCode → cbFor`)
  ложатся без изменений: `[Снять]` → валидный штамп → **мост в контроллер
  streams** → confirm → UC владельца → `taskFacade.close`. Транспорт доменам
  не виден.
- **Проактив задач** — notify «есть дело — /tasks» (И3).
- **Stale-кнопки задач** (задача уже закрыта) — штамп + идемпотентный close
  + валидация UC.
- **Трек `delivery-ordering`** из декомпозиции tasks закрывается сквозной
  per-chat очередью — отдельный трек не нужен.
- **Manual-задачи уровень 3** («после [Выполнено] → Завести анкету») —
  delegate.

## 9. Декомпозиция на треки

**Правило «трек уменьшает»:** трек завершён ⟺ всё, что он трогал, целиком
на новом контракте (зелёные tsc/biome/тесты своего скоупа). Вне скоупа трека
могут лежать сломанные стори/тесты — до своего трека. Никаких адаптеров
совместимости между контрактами. Финальный трек приводит весь репозиторий
в зелёное.

| # | Трек | Скоуп |
|---|---|---|
| 1 | `bot-ui-dialog-core` | Типы (`MdText`/`md`, `Screen`, `DialogResponse`, `BotSession`), транспорт (рендер-политика, штампы, очередь, тон-каналы, логи), `BotUiApp`, `BotController`, `BotUiStory` (`handleHelp`, `confirm`, `handleError`). Тесты ядра зелёные. Прикладные стори сломаны (tsc красный) — заявленное состояние |
| 2 | `bot-ui-dialog-nav` | app (community), user (notify), courses (catalog), streams (catalog, view-stream, inactivity → notify-текст). Простая навигация, edit-in-place, enroll-capture, delegate |
| 3 | `bot-ui-dialog-learning` | hub, step-view, nav-tree, progress — edit-интенсивная навигация |
| 4 | `bot-ui-dialog-questionnaire` | fill, invite, render.ts — `finalize`-паттерн, resume, умирание takeover-подписок (→ notify) |
| 5 | `bot-ui-dialog-mentor` | submenu, my-streams, view-stream-mentor, create-stream, activate-stream, monitor + **удаление старых типов** (`BotCommand`, `BotResponse`, `SessionData`, `SendMessage/...Description`), зачистка ассертов, весь репозиторий зелёный |

Порядок: 1 → 2 → (3 ∥ 4) → 5. Персистентность сессий (`bot-ui-session-persist`)
и shortIds — опциональный трек после 5: структуры сериализуемы.

## 10. Принятые решения (сводка, 2026-09-05)

1. Ошибки — экран (`handleError` → `screen`); для валидации ввода есть
   `errorNotify` — warn-реплика без захвата экрана (дополнение трека 1.1).
2. `/help` — реплика поверх диалога; контекстный help — только у активной
   стори (`contextHelp()`, мимо pipe — скорректировано в 1.1, см. 15) +
   общий fallback.
3. Деплой: старые кнопки в чатах один раз умирают с alert «нажмите /start» —
   приемлемо.
4. `seq` в памяти с нуля после рестарта — старые кнопки мертвы (как с
   shortIds сегодня); лечится персистентностью (трек 6).
5. Серия экранов не входит в контракт (`sendMessages` не используется);
   при необходимости — `preamble`-расширение позже.
6. Маркер выбора «—————\nВы выбрали: …» при retire — да (UX-запрос).
7. `delegate` сохраняется (3 использования, нужен tasks).
8. TTL ввода удаляется (§7).
9. Трек 1 ломает прикладные стори — допустимо, чинятся в треках 2–5.

### Дополнения трека 1.1 (жизненный цикл, 2026-09-06…08)

10. Явное состояние «диалог не открыт» (`BotSession.dialog?`, ФР-1);
    единственная операция входа `enterDialog` (`switch`/`reopen`) —
    единственная точка `seq++` (ФР-2); ленивый фиктивный диалог меню удалён.
11. Валидация кнопок — без исключений (ФР-3): «Наберите /start» (диалога
    нет) / «Экран устарел — нажмите /start» (штамп ≠ seq); до uiApp
    невалидные кнопки не доезжают.
12. Проактивный запуск диалога — **вариант A**: диалог открывается только
    действием пользователя; сервер только зовёт. Легаси-контракт
    приглашений (ФР-6): временный `invite(telegramId, { text, keyboard })`
    — кнопки штампуются текущей эпохой получателя; без диалога — якорь
    `app/invite` (seq = 1), приглашение не умирает. Метод и якорь — к
    удалению с tasks-system; опция deep-link URL-кнопки — трек 4.
13. Команды — трёхуровневый pipe `handleCommand` (`pass`/`continue`/`stop`,
    ФР-4): ядро имён команд не знает; именных обработчиков
    (`handleHelp`/`handleCancel`/`handleWelcome`/`handleStart`/appCommand-хук)
    нет ни на одном уровне; меню — декларативные `menuButtons`.
14. `/start` и `/help` — прямые пути uiApp мимо pipe: `/start` —
    гост-регистрация + reopen + welcome из `menuButtons`; `/help` —
    `contextHelp()` только активной стори (неактивная стори на `/help` не
    отвечает никогда), иначе общий справочник из `menuButtons`.
15. Kind-уведомления (ФР-5): единая таблица 🔔/ℹ️/⚠️ для проактива и
    реплик; `DialogResponse.notify { text, kind? }` (дефолт `info`,
    переименование `info` + поглощение `Screen`);
    `NotificationPayload.kind` (дефолт `notify`, замена `tone`);
    `errorNotify(err)` — переспрос ввода без захвата экрана.
16. Ввод без ожидания / без адресата — реплика-подсказка транспорта
    (`next` в контракте нет); дефолт `BotUiStory.handleMessage` — warn
    разработчику + реплика-отказ (страховка `awaitInput` без обработчика).

## 11. Карта кода для миграции

| Файл | Что происходит |
|---|---|
| `packages/core/src/ui/bot/types.ts` | новые типы; старые удаляются в треке 5 |
| `packages/core/src/ui/bot/ui-app.ts` | seq через `enterDialog` (switch/reopen), маршрутизация без «чужого контроллера», pipe `handleCommand`, `awaitInput`, ретрансляция `invite`; удалить takeover-кодирование |
| `packages/core/src/ui/bot/bot-controller.ts` | префиксация как есть; pipe `handleCommand` своих стори с агрегацией; `handleError` → `DialogResponse`; удалить `handleTimeout` |
| `packages/core/src/ui/bot/bot-ui-story.ts` | `handleCommand` (дефолт pass), `contextHelp`, `errorNotify`, дефолт `handleMessage`, `confirm`, `handleError`, `md`; удалить `handleTimeout`, `escapeMarkdown` |
| `packages/core/src/ui/bot/response-assert.ts` | проверка MdText-литералов (fail-fast остаётся) |
| `packages/core/src/shared/markdown.ts` | `md`/`mdRaw`/`MdText` (или новый `md.ts` в ui/bot) |
| `apps/u7-bot/src/infra/bot-transport.ts` | рендер-политика, штампы, очередь на всё, kind-таблица, логи, маркер выбора, единый вход команд (перехват слэш-текстов), `invite`-якорь `app/invite` |
| `apps/u7-bot/src/core/ui-app.ts`, `u7-bot-controller.ts` | welcome/help на новом контракте |
| Стори (24 файла): app/1, user/1, courses/1, streams/3, learning/4, mentor/6, questionnaire/2 (+render.ts) | по трекам 2–5; удалить `editOrSend`/`respondInContext` (learning/shared.ts, questionnaire/render.ts) |
| Проактивные подписки с кнопками: inactivity, hub, invite, fill-events | на notify-текст в треках 2/4 |
| `apps/u7-bot/src/context.ts` | `BotSession` вместо `SessionData` |

## 12. Открытые вопросы

1. ~~Диалог меню после `/start`: имя пути~~ — решено (трек 1.1): `app/menu`
   (якорь для seq/штампов; сущностной стори меню нет).
2. ~~Формат штампа при коллизии с короткими кодами кнопок~~ — решено:
   штамп всегда дописывается последним сегментом, парсер берёт последний
   сегмент — порядок закрывает коллизию (тест в `bot-transport.test.ts`).
3. Персистентность сессий + shortIds: хранилище и формат — трек 6 (не блокирует).

## Связанные документы

- [tasks-system-architecture.md](./tasks-system-architecture.md) — этап B: задачи как замена кнопочных проактивов.
- [tasks-system-layers.md](./tasks-system-layers.md) — TaskRenderInfo/TaskKindRenderer, ложатся на мосты и штампы.
- [code_styleguides/bot-architecture.md](./code_styleguides/bot-architecture.md) — актуальный as-is разрез (обновить после трека 5).
- [code_styleguides/skills/bot-ui-story.md](./code_styleguides/skills/bot-ui-story.md) — стильгайд стори (обновить после трека 1).
- [code_styleguides/skills/bot-controller.md](./code_styleguides/skills/bot-controller.md) — стильгайд контроллера (обновить после трека 1).
