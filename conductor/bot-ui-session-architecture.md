# Bot UI: сессия, сообщения и флоу — проработка концепции

> v2 (2026-09-03). Самодостаточная заготовка контекста для отдельной сессии
> ресёрча/проработки концепции bot-ui: **владение сообщениями, конкурентный доступ
> к сессии, stale-взаимодействия**. Происхождение — трек `questionnaire-robustness_20260903`
> (инцидент в флоу анкеты), но проблемы системные для всех стори. Документ описывает
> всё, что нужно для анализа, без внешних зависимостей.

---

## 1. Глоссарий

- **Сторя (story)** — пользовательский сценарий (`BotUiStory`): анкета, шаг урока, каталог.
- **Контроллер** — группа сторей одного домена (`U7BotController`): `questionnaire`, `learning`...
- **Флоу** — экземпляр взаимодействия: путь `controller/story` + контекст (например,
  `'questionnaire/fill'` + `{ questionnaireId }`).
- **`activeHandler`** — захват ввода: единственный «владелец» текстовых сообщений пользователя.
- **`lastBotMessage`** — последнее сообщение бота (`messageId`, текст, клавиатура):
  используется для edit-на-месте и снятия клавиатур.
- **Takeover-кнопка** — кнопка с маркером `!`: перехватывает ввод у чужого активного флоу
  (без alert-блокировки), с предупреждающей строкой в тексте.
- **Проактив** — сообщение, инициированное системой (планировщик, события), не пользователем.
- **Notify** — чистое уведомление: не занимает слот `lastBotMessage`, не трогает ввод.
- **Stale-взаимодействие** — клик/ввод, относящийся к уже неактуальному экрану
  (кнопка из прошлого сообщения, экран другого флоу).

## 2. Текущая архитектура bot-ui (as-is)

### Цепочка обработки

Grammy-апдейт → `BotTransport` (`apps/u7-bot/src/infra/bot-transport.ts`) → `BotUiApp`
(`packages/core/src/ui/bot/ui-app.ts`) → контроллер → сторя. Сторя возвращает `BotResponse`
(декларативная команда: `sendMessage`/`sendMessages`/`editMessage`, `captureInput`/
`releaseInput`, `keepPrevKeyboard`), транспорт исполняет его.

### Сессия

`SessionData` (`packages/core/src/ui/bot/types.ts`):

```ts
{
  activeHandler: { path: 'controller/story'; context?: unknown; expiresAt?: number } | null;
  lastBotMessage?: SendMessageDescription & { messageId: number }; // текст, клавиатура, parseMode
}
```

Хранение: `Map<number, SessionData>` **в памяти процесса** (`createBot`,
`apps/u7-bot/src/bot.ts`) — общий для Grammy-session и транспорта. Одна запись на
пользователя; все обработчики мутируют **один и тот же объект** (ссылка из Map).

### Пайплайн `execute()` (транспорт, единая точка исполнения)

1. **`editMessage`** — `editMessageText(chatId, messageId, text, {keyboard})`; обновляет
   текст/клавиатуру `lastBotMessage` (если он указывает на это сообщение). Ошибки глушатся.
2. **Шаг 1.5 (снятие клавиатуры)** — если в команде НЕТ `editMessage` и
   `keepPrevKeyboard !== true`: у предыдущего `lastBotMessage` снимается клавиатура
   (`editMessageText` с `reply_markup: undefined`). Ошибки глушатся.
3. **`sendMessage`/`sendMessages`** — отправка; `lastBotMessage` **перезаписывается**
   последним отправленным (messageId из ответа Telegram).
4. **`releaseInput`** — `activeHandler = null`. `captureInput` ставится вне `execute`
   (в `BotUiApp` — `#applyCapturedInput` — до возврата в транспорт; в `send()` — после).

### Захват ввода и маршрутизация

- `handleCallback(data)`: `BotUiApp` диспетчеризирует по префиксу контроллера. Если
  `activeHandler != null` и его контроллер ≠ контроллеру кнопки → alert «завершите
  текущее действие». **Если `activeHandler == null` — проверка пропускается**, кнопка
  доезжает до любой стори. Takeover-маркер `!` обходит проверку всегда.
- `handleMessage`: без `activeHandler` → текст уходит мимо приложения (next);
  с просроченным `expiresAt` → таймаут-ответ.
- `/start` (`handleStart`): **безусловно** `activeHandler = null`, затем welcome.
- `send(telegramId, command)` (проактив): берёт/создаёт сессию, исполняет команду,
  применяет `captureInput`/`releaseInput`.

### Конкурентность

- Режим `polling` (по умолчанию, `apps/u7-bot/src/config.ts`): Grammy обрабатывает
  апдейты строго последовательно.
- Режим `webhook`: каждый апдейт — отдельный HTTP-запрос, обрабатываются **параллельно**
  (`sequentialize` не подключён, `main.ts`).
- **`#enqueue`** — per-chat-очередь, сериализует ТОЛЬКО проактивные `send()`/`notify()`.
  Обработчики апдейтов (`handleStart`/`handleCallback`/`handleMessage`/`handleCancel`)
  вызывают `execute()` **напрямую, минуя очередь**.
- `notify()` восстанавливает `lastBotMessage` после отправки (не занимает слот).

### Уже исправленные части (as-is, важны для анализа кода)

- Домен анкеты: клик по кнопке с кодом, не принадлежащим текущему вопросу, возвращает
  `stale_answer` (не внутреннюю ошибку); «Далее» без выбора на multiple — тоже
  (`packages/questionnaire/src/domain/questionnaire/`, вариант ответа в `types.ts`).
- Все тексты в MarkdownV2 экранируются; транспорт fail-fast проверяет разметку
  (`assertResponseMarkdownSafe`) до отправки.

## 3. Инцидент-триггер (2026-09-03, 15:14)

Пользователь (telegramId 5528270576) во время заполнения анкеты дважды нажал `/start`;
гонка сессий (см. S1) оставила в чате сообщение со старой клавиатурой вопроса. Дальше:

1. Клик по старой кнопке → код ответа не принадлежит текущему вопросу анкеты →
   провал valibot-валидации в агрегате → `throwInternal` → 2 × `AR_INTERNAL_ERROR`
   (kind=internal) за клик.
2. Fallback-текст внутренней ошибки содержал неэкранированную точку → fail-fast
   валидатор MarkdownV2 отклонял команду → **сообщение об ошибке не отправлялось вовсе**.
3. Пользователь без обратной связи продолжал тыкать: 18 кликов → 36 CRITICAL в Logger Bot
   за 5 секунд.

Обе мины (stale-ответ и MarkdownV2) закрыты (см. §2). Оставшаяся причина — гонка сессии,
из-за которой старая клавиатура вообще осталась доступна, и связанная с ней модельная
проблема затирания чужих экранов — предмет этого документа.

## 4. Проблемы модели (системные)

**П1. `lastBotMessage` «ничейный».** Сообщение не знает флоу-владельца, а edit-хелперы
сторий **безусловно** берут его `messageId`:
- `apps/u7-bot/src/controllers/questionnaire/stories/render.ts` — `editOrSend`,
  `renderPreviousQuestion` (по флагу `editPrev`);
- `apps/u7-bot/src/controllers/learning/shared.ts` — `respondInContext`, `editOrSend`
  (безусловно).

Любой флоу отредактирует последний экран чужого флоу (welcome, приглашение, экран шага
урока) при клике по кнопке «из прошлого» (доставлена после `/start`, `/help`, проактива).

**П2. Конкурентный доступ к сессии → lost update.** Три источника интерливинга:
(а) webhook без `sequentialize`; (б) апдейты минуют `#enqueue`; (в) общий мутируемый
объект сессии. Симптомы: «зависшие» клавиатуры, edit в чужое сообщение, рассинхрон
`activeHandler`.

**П3. Stale-callback проходит маршрутизацию.** При `activeHandler == null` проверка
«чужой контроллер» пропускается (нужно для входа в новые флоу из меню) → старая кнопка
любого флоу доезжает до стори. Для анкеты домен отвечает `stale_answer`; для других
доменов поведение не специфицировано.

**П4. Сессии и `shortIds` — в памяти.** Перезапуск сервиса: `lastBotMessage`/
`activeHandler` теряются; кнопки со сжатыми UUID (`shortIds`, та же память) считаются
«устаревшими» → alert «нажмите /start». Пользователи посреди флоу теряют экран.

**П5. Ошибки Telegram API глушатся.** `.catch(() => {})` на `editMessageText` (шаги 1
и 1.5): «message is not modified», сеть, права — тихие потери без диагностики.

### Сценарии гонок (для воспроизведения/тестов)

**S1. Двойной `/start` + callback старой кнопки** (пачка `[/start, /start, callback(Q3)]`,
webhook — параллельно; polling — последовательно, но кнопка уже нажата в UI):
1. `/start` ×2: `activeHandler = null`; welcome перезаписывает `lastBotMessage`
   (при параллельных `execute` оба читают один `lastBotMessage` → один welcome
   остаётся с живой клавиатурой — «старые кнопки»).
2. Callback кнопки старого вопроса: `activeHandler == null` → маршрутизация пропускает
   проверку → fill-стори → edit-хелпер: `editMessage.messageId = lastBotMessage.messageId`
   — это **welcome**. Главное меню затёрто вопросом анкеты; реальный экран анкеты —
   в истории без клавиатуры.

**S2. Проактивный send × клик пользователя.** Планировщик шлёт приглашение
(`#enqueue`), пользователь параллельно жмёт кнопку текущего флоу (`execute` напрямую):
рендер прочитал `lastMsg` = экран флоу, параллельный `send()` перезаписал
`lastBotMessage` приглашением → edit уходит в чужое сообщение (или наоборот).

**S3. Lost update клавиатур.** Две параллельные `execute` (webhook): обе читают
`lastBotMessage = {#N, клавиатура}`; каждая шлёт своё сообщение; клавиатуру у #N
снимает только одна, вторая считает её уже снятой → сообщение #N с живой клавиатурой
остаётся навсегда.

## 5. Предлагаемое минимальное решение: guard для editMessage

Точечная защита в транспорте (не концепция — лечит П1, не трогает П2–П5):

1. `lastBotMessage` получает опциональное поле `flowPath?: string` — путь флоу-владельца
   в формате `activeHandler.path` (`controller/story`). Транспорт помечает владельца при
   создании сообщения: интерактивные ответы (`handleCallback`/`handleMessage`/
   `handleCancel`) — текущий `session.activeHandler?.path` (к этому моменту
   `captureInput` нового флоу уже применён в `BotUiApp`); `/start`, `/help`,
   проактивные `send()` — без владельца (`undefined`). Сессии в памяти — миграций нет;
   записи без поля = «ничейные».
2. Guard перед шагом 1 пайплайна: `editMessage` применяется только при одновременном:
   - `edit.messageId === lastBotMessage.messageId` (редактируем именно последнее сообщение);
   - `lastBotMessage.flowPath !== undefined` (у экрана есть владелец);
   - `lastBotMessage.flowPath === session.activeHandler?.path` (владелец — активный флоу).
3. При нарушении (коллизия): если в команде уже есть `sendMessage`/`sendMessages` —
   `editMessage` дропается (новый экран уйдёт отправкой, шаг 1.5 корректно снимет
   клавиатуру у прошлого сообщения); если `editMessage` — единственный контент —
   конвертируется в `sendMessage` того же текста/клавиатуры (fallback-отправка).

**Решает:** затирание чужих экранов (П1) для любых стори — guard стоит в единой точке
исполнения (`execute`), включая `respondInContext` learning-флоу, без правок сторий.

**Не решает:** П2 (сериализации нет — гонки остаются, но их последствия сужаются до
«лишнее/дублирующее сообщение» вместо «затёртый чужой экран»), П3, П4, П5.

**Trade-off:** проактивно созданный экран не помечен владельцем (транспорт не знает
имя контроллера для `captureInput.path` — `send()` получает путь стори без префикса)
→ первый ответ пользователя после проактивного старта уйдёт `sendMessage` вместо edit
(один косметический дубль вопроса), последующие — edit'ом.

## 6. Карта кода для анализа

| Файл | Что смотреть |
|---|---|
| `apps/u7-bot/src/infra/bot-transport.ts` | `execute()`, `#enqueue`, `handleStart`/`handleCallback`/`handleMessage`, `send()`/`notify()`, глушение ошибок |
| `packages/core/src/ui/bot/types.ts` | `SessionData`, `BotCommand`/`BotResponse`, `NotificationPayload` |
| `packages/core/src/ui/bot/ui-app.ts` | маршрутизация callback, проверка «чужой контроллер», `#applyCapturedInput`, takeover-кодирование |
| `apps/u7-bot/src/bot.ts`, `apps/u7-bot/src/main.ts`, `apps/u7-bot/src/config.ts` | session storage (Map), polling/webhook, отсутствие `sequentialize` |
| `packages/core/src/ui/bot/bot-ui-story.ts` | базовый класс стори: `confirm`, `handleError`, capture/release |
| `apps/u7-bot/src/controllers/questionnaire/stories/render.ts` | edit-рендер анкеты (`editPrev`, `editOrSend`) |
| `apps/u7-bot/src/controllers/learning/shared.ts` | `respondInContext`, `editOrSend` — безусловный edit learning-флоу |
| `apps/u7-bot/src/infra/short-id.ts` | сжатие UUID в памяти (П4) |
| `apps/u7-bot/src/infra/bot-transport.test.ts` | стиль тестов транспорта, моки `Api`/`UiApp` |

## 7. Открытые вопросы концепции

1. **Владение сообщением — первоклассное понятие core?** Guard (§5) — хак на уровне
   транспорта. Должен ли `BotResponse`/`BotCommand` нести декларативный контракт
   «обнови МОЙ экран» (edit-политика в core), вместо императивных `editMessage.messageId`
   в сторях? Тогда edit-хелперы (`respondInContext`, `editOrSend`,
   `renderPreviousQuestion`) исчезают как класс.
2. **Сериализация апдейтов.** `sequentialize` по chat_id для webhook + пропуск апдейтов
   через `#enqueue` (единая per-chat очередь «апдейты + проактивы») — стоит ли, где
   граница ответственности очереди?
3. **Stale-callback как общий механизм.** Версионирование экранов/кнопок (кнопка несёт
   контекст флоу, транспорт/сторя сверяет актуальность) вместо доменной обработки
   «по случаю» (анкетный `stale_answer`)?
4. **Персистентность сессий** (и `shortIds`) — переживать перезапуск? Формат, хранилище.
5. **История сообщений вместо одного `lastBotMessage`?** Модель «одно последнее сообщение»
   фундаментально не описывает многоэкранные флоу (анкета: «зафиксируй старый вопрос +
   пришли новый»).
