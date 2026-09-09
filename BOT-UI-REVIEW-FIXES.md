# Bot-UI: правки по итогам независимого ревью (2026-09-09)

> **ВРЕМЕННЫЙ ФАЙЛ.** План + спеки работ для следующей сессии. После выполнения
> всех задач — удалить файл.
>
> Контекст: архитектура «Диалог и Экран» (v4) принята, треки 1/1.1 выполнены,
> прикладные стори сломаны (заявленное состояние, чинятся треками 2–5
> `bot-ui-dialog-nav/learning/questionnaire/mentor`). Этот план — точечные
> доработки ядра/транспорта/прикладного слоя **до трека 2** (после миграции
> стори они стали бы дороже).
>
> Документация уже актуализирована под целевое состояние (эта сессия):
> - `conductor/bot-ui-session-architecture.md` — решения §10.17–20, И2, §5.2a, глоссарий («хлебные крошки»);
> - `conductor/guides/bot-ui-concept.md` — концепция «хлебные крошек», delegate в командах;
> - `conductor/metrics-*.md` — сведено с tasks-system (приглашения анкет = задачи, прямой старт = delegate).
>
> Архитектурные правила: [bot-ui-session-architecture.md](./conductor/bot-ui-session-architecture.md),
> стильгайды — [conductor/code_styleguides/](./conductor/code_styleguides/).

---

## План (порядок исполнения)

| # | Задача | Слой | Зависимости |
|---|--------|------|-------------|
| З1 | Константы приложения — единый модуль | apps/u7-bot | — |
| З2 | `delegate` в stop-ответах команд + общая склейка | core | — |
| З3 | Склейка notify при delegate (mdJoin) | core | (входит в З2) |
| З4 | Дефолт `handleMessage` — `release` | core | — |
| З5 | `/cancel` с ответом pipe — добавить экран меню | apps/u7-bot | — |
| З6 | Кнопка выхода на экранах ошибок (хук) | core + apps/u7-bot | З1 |
| З7 | Гашение экрана при любом ответе после смены диалога | apps/u7-bot (транспорт) | З1 |
| З8 | Финальные проверки и сверка с документацией | всё | З1–З7 |

Рекомендуемый порядок: З1 → (З2+З3) → З4 → З5 → З6 → З7 → З8.

---

## З1. Константы приложения — единый модуль

**Проблема.** Системные коды и якоря размазаны и захардкожены:
`U7BotUiApp.MAIN_MENU_CODE`/`HELP_CODE`/`menuPath` (apps/u7-bot/src/core/ui-app.ts),
`INVITE_DIALOG_PATH = 'app/invite'` и `raw.startsWith('app:')` (apps/u7-bot/src/infra/bot-transport.ts),
`Routes.app.mainMenu = 'app:main-menu'` (apps/u7-bot/src/controllers/shared/routes.ts — дубль строки).
Транспорт знает о контроллере `app` хардкодом.

**Решение.** Новый файл `apps/u7-bot/src/shared/app-codes.ts` (без зависимостей):

```ts
/** Системные callback-коды приложения (перехватываются U7BotUiApp до маршрутизации). */
export const APP_CODES = {
  mainMenu: 'app:main-menu',
  help: 'app:help',
} as const;

/** Виртуальные якоря диалогов (сущностных стори нет — якорь для seq/штампов). */
export const APP_DIALOG_PATHS = {
  menu: 'app/menu',
  invite: 'app/invite',
} as const;

/** Префикс системных кодов — транспорт не сжимает их в shortId. */
export const APP_CODE_PREFIX = 'app:';
```

Потребители:
- `U7BotUiApp`: статические поля `MAIN_MENU_CODE`/`HELP_CODE` переопределяются как
  реэкспорт из `app-codes` (или заменяются прямыми импортами во всех местах использования —
  включая `controllers/shared/routes.ts`, где `Routes.app.mainMenu` начинает ссылаться на константу);
  `menuPath` → `APP_DIALOG_PATHS.menu`.
- `BotTransport`: `INVITE_DIALOG_PATH` → `APP_DIALOG_PATHS.invite`; проверка
  `raw.startsWith('app:')` в `compressAction` → `APP_CODE_PREFIX` (или принадлежность
  кода `APP_CODES`).

Импорт из `infra/` и `core/` в `../shared/app-codes` — без циклов (файл ни от чего не зависит).

**Приёмка.**
- `grep -rn "app:main-menu\|app:help\|app/menu\|app/invite" apps/u7-bot/src packages/core/src --include='*.ts' | grep -v test | grep -v app-codes.ts` — пусто
  (легаси-стори на старом контракте, которые переписываются треками 2–5, можно не трогать,
  но новые импорты обязательны для транспорта/uiApp/Routes).
- Тесты ядра и транспорта зелёные.

---

## З2 (+З3). `delegate` в stop-ответах команд + единая склейка ответов

**Проблема.** `BotUiApp.handleCommand` (pipe) не исполняет `delegate` и не вызывает
`enterDialog` — подтверждено тестом «pipe не трогает диалог и seq». Следствия для
команд с экраном (`/tasks` — будущий основной потребитель):
- `dialog.path` остаётся прежним → `/help` покажет справку чужой стори, `/cancel`
  сделает `reset()` чужой стори, текстовый ввод адресуется не экрану, который видит пользователь;
- команда **до первого `/start`** (диалог не открыт): экран молча пропускается
  транспортом («ответ с экраном при закрытом диалоге пропущен», warn-лог) — тишина в UX.

**Решение.** `packages/core/src/ui/bot/ui-app.ts`:
1. Вынести склейку инициатор+делегат в общий приватный метод (сейчас — inline в
   `handleCallback`), использовать в обоих местах:
   ```ts
   async #resolveDelegate(initiator: DialogResponse, data: string, actor, session): Promise<DialogResponse>
   ```
2. В `handleCommand`: при `reaction === 'stop'` и `response.delegate` — исполнить
   делегат через `#dispatch(delegatePath)` (симметрично `handleCallback`) и вернуть склеенный ответ.
3. Склейка (исправление потери notify — задача З3):
   - `notify`: при наличии у обоих — `mdJoin([initiator, target], '\n\n')` (сейчас `??` теряет делегата);
   - `screen`: `target ?? initiator`; `awaitInput`: только target; `release`: `target ?? initiator`.
4. Кейс «диалог не открыт»: `enterDialog(switch)` из `undefined` создаёт диалог с
   `seq = 1` (уже работает) — экран команды отрендерится, `/tasks` до `/start` перестаёт молчать.
   Команда — легальный способ открыть диалог (решение §10.19).

**Тесты** (`packages/core/src/ui/bot/ui-app.test.ts`):
- команда `stop { screen, delegate }` → `dialog.path` переключён, `seq++`, экран делегата;
- notify инициатора + notify делегата → склеены в один (обе строки);
- delegate в несуществующий контроллер → экран ошибки, не падение;
- диалог не открыт → после команды диалог открыт (`seq = 1`), экран в ответе.

---

## З4. Дефолт `handleMessage` — снимать `awaitInput`

**Проблема.** Дефолт `BotUiStory.handleMessage` (страховка «awaitInput без обработчика»)
возвращает реплику-отказ, но НЕ снимает `dialog.input` → пользователь циклически получает
«сообщения не принимаются», выход только `/cancel`. Программная ошибка должна самоликвидироваться.

**Решение.** `packages/core/src/ui/bot/bot-ui-story.ts`: дефолт возвращает
`{ notify: { text: … }, release: true }`. Обновить docstring (контекст ввода сброшен,
пользователь выведен из зависшего ожидания). Транспорт применит `release` при рендере.

**Тест:** bot-ui-story.test.ts — дефолтный ответ содержит `release: true`.

---

## З5. `/cancel` с ответом pipe — экран меню, а не только реплика

**Проблема.** `U7BotUiApp.handleCommand`, ветка `/cancel`: если pipe вернул ответ
(notify «Отменено. Наберите /start»), uiApp делает `reopen(menu)` (seq++), но возвращает
ответ как есть — экран меню НЕ строится. Пользователь остаётся с мёртвой клавиатурой
прежнего экрана (все кнопки умерли вместе с seq++).

**Решение.** `apps/u7-bot/src/core/ui-app.ts`: в ветке `/cancel` после `enterDialog(reopen)`:
- если ответ pipe есть и **не содержит `screen`** — дополнить его экраном меню:
  `{ ...response, screen: await this.#shortMenuScreen(tgId) }` (notify стори сохраняется,
  транспорт отрендерит реплику первой, затем retire+send меню — уже умеет);
- если ответ содержит `screen` стори — оставить как есть (экран меню не нужен);
- пустой pipe — без изменений (экран меню уже возвращается).

**Тест** (`apps/u7-bot/src/core/ui-app.test.ts`): `/cancel` при активной стори → в ответе
и `notify` (текст стори), и `screen` меню (клавиатура `menuButtons`); `seq` инкрементирован.

---

## З6. Кнопка выхода на экранах ошибок

**Проблема.** `handleError` (BotController + BotUiStory) строит экраны ошибок без
клавиатуры — после ошибки в глубине флоу пользователь без единой кнопки, выход только командой.
Ядро не может само подставить `app:main-menu` (не знает приложение).

**Решение.**
1. Core — точка расширения:
   ```ts
   // bot-ui-story.ts и bot-controller.ts
   /** Кнопки выхода на экранах ошибок (ядро не знает кодов приложения). */
   protected errorExitRows(): { text: string; code: string }[][] { return []; }
   ```
   `handleError` при построении каждого экрана ошибки добавляет эти строки в клавиатуру
   (если строки есть; иначе экран без клавиатуры, как сейчас).
2. Прикладной слой (`U7BotUiStory`, `U7BotController`): переопределить —
   `[[{ text: '⬅️ Меню', code: APP_CODES.mainMenu }]]` (использовать константы из З1).
   Для контекста задач в будущем — «⬅️ Мои задачи» добавит kind-рендерер владельца (вне этой работы).
3. `errorNotify` — НЕ трогать (реплика-переспрос, экран и ввод не трогает).

**Тесты:** core — хук подставляет кнопки во все виды экранов ошибок; u7 — экран ошибки
содержит кнопку «⬅️ Меню» с кодом из `APP_CODES`.

---

## З7. Гашение экрана при любом ответе после смены диалога («хлебные крошки»)

**Проблема.** Retire+маркер выполняется только в `screen`-ветке рендера. Если после
смены диалога (seq++ по мосту/команде) ответ **не содержит `screen`** (notify-only или
пустой) — прежний экран остаётся с висящей мёртвой клавиатурой (кнопки дают alert, но
визуальный мусор; «крошки» неполны). Закреплено целевым правилом И2/§5.2a архитектуры.

**Решение.** `apps/u7-bot/src/infra/bot-transport.ts`, метод `#render` — после
исполнения `notify` и проверки «диалог открыт», **до** ветки `finalize`:
```ts
// Гашение устаревшего экрана при любом ответе — «хлебные крошки» (§5.2a):
// смена диалога без screen не оставляет мёртвую клавиатуру.
if (session.screen?.keyboard && session.screen.ownerSeq !== dialog.seq) {
  await this.#retireScreen(tgId, session, opts.pressedCode);
}
```
Замечания:
- `#retireScreen` идемпотентен (`guard: !screen?.keyboard → return`) — повторный вызов
  из `screen`-ветки безопасен;
- маркер выбора добавится при известном `pressedCode` (нажатие кнопки-моста); команды
  гасят без маркера — как и в `/start` (кнопки не было);
- `finalize` при чужом экране по-прежнему warn-лог и пропуск (не менять).

**Тесты** (`apps/u7-bot/src/infra/bot-transport.test.ts`):
- мост в другую стори (кнопка → seq++), ответ стори `{ notify }` без screen →
  editMessageText прежнего экрана с маркером «Вы выбрали …» и снятой клавиатурой;
- то же с пустым ответом `{}` → клавиатура снята;
- ответ без смены диалога (тот же seq) → прежний экран НЕ тронут.

---

## З8. Финальные проверки и сверка

1. `bunx tsc --noEmit` — новых ошибок в тронутых файлах нет:
   `packages/core/src/ui/bot/*`, `apps/u7-bot/src/core/*`, `apps/u7-bot/src/infra/*`,
   `apps/u7-bot/src/shared/app-codes.ts`, `apps/u7-bot/src/controllers/shared/routes.ts`.
   (Прикладные стори на старом контракте уже красные — заявленное состояние треков 2–5,
   не наша зона; не чинить их здесь.)
2. `bunx biome check` на изменённых файлах — чисто.
3. Тесты зелёные: `bun test packages/core/src/ui/bot/ apps/u7-bot/src/core/ apps/u7-bot/src/infra/`.
4. Сверка с документацией (уже обновлена под целевое состояние):
   - §10.17–20 `conductor/bot-ui-session-architecture.md` соответствуют коду;
   - `conductor/guides/bot-ui-concept.md` — таблица слоёв и §2/§3 не разошлись с кодом;
   - при расхождениях — править код или документацию по факту (архитектура — источник истины).
5. `git add` по файлам, commit: `feat(bot-ui): правки ядра и транспорта по итогам ревью (крошки, delegate команд, константы, кнопки ошибок)`.
6. Удалить этот файл (`BOT-UI-REVIEW-FIXES.md`).

---

## Вне скоупа (не делать в этой работе)

- Миграция прикладных стори на новый контракт — треки 2–5 (`conductor/tracks/`).
- Персистентность сессий/shortIds — трек `bot-ui-session-persist` (рекомендация ревью:
  не откладывать после трека 5, до `task-ui`).
- Модули `task`/`peer-review`/`metrics` — отдельные инициативы; механика сведена
  в `conductor/metrics-*.md` и `conductor/tasks-system*.md`.
- Демонтаж `invite` (ФР-6) — с приходом tasks-system.
