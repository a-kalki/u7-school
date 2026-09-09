# План реализации — Трек: Жизненный цикл диалога (bot-ui-dialog-lifecycle_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md). Источник проблем: [bot-ui-dialog-lifecycle.md](../../bot-ui-dialog-lifecycle.md). Скоуп: ядро `packages/core/src/ui/bot/*` + `apps/u7-bot/src/infra/bot-transport.ts` (+`main.ts` wiring). Прикладные стори не трогаем.

## Фаза 1: Модель диалога — состояние и операция входа

- [x] Task: Написать падающие инвариант-тесты: первый `/start` (seq=1, кнопки живы), повторный `/start` (reopen, не no-op), кнопка до `/start` → alert «Наберите /start», дубль-тап по мосту (второй — alert), delegate «меню→меню» (seq не растёт) и кросс-контроллерный (seq++) [5fb5ae0]
- [x] Task: ФР-1 `BotSession.dialog?` — явное состояние «не открыт»; удалить `INITIAL_DIALOG_PATH` и ленивый фиктивный диалог в `#session` [24110ea]
- [x] Task: ФР-2 `#enterDialog(path, mode: 'switch' | 'reopen')` — единственная точка инкремента `seq`; провести через неё `/start`, `/cancel`, delegate, мосты (`#dispatch`) [bbd26cb]
- [x] Task: ФР-3 валидация кнопок без исключений: не открыт → «Наберите /start»; штамп ≠ seq → «Экран устарел — нажмите /start»; адаптировать тесты транспорта [ede3089]
- [x] Conductor - User Manual Verification 'Модель диалога' (Protocol in workflow.md)

## Фаза 2: Единый вход команд

- [x] Task: Написать падающие тесты конвейера `handleCommand`: appCommand-хук → активная стори → core-дефолт; парсинг конверта (аргументы, суффикс `@botname`, без аргументов); `/help` три уровня (стори → main-help на меню → fallback), `/cancel` (доменная очистка → меню), команды при не открытом диалоге [79c6445]
- [x] Task: Core: `BotUiApp.handleCommand(cmd, tgId, session)` + appCommand-хук (`null` = «пропускаю») + `BotUiStory.handleCommand` (обобщение `handleHelp`/`handleCancel`, `null` = «не моё») [27e643d]
- [x] Task: Транспорт: один `handleCommand(ctx)` вместо `handleStart/handleHelp/handleCancel`; перехват всех слэш-текстов в едином `message:text`-хендлере (фильтр `/`-префикса), без поимённой grammy-регистрации; парсинг слэш-текста в конверт `{ command, args }` (ведущий `/`, суффикс `@botname`, разбив по пробелам) [3d31b5a]
- [x] Task: u7-bot: appCommand-гейт (гост-регистрация на `/start`, админ-гейт `/log_level`, `/help` на меню → сборка описаний главных кнопок); welcome-меню как сейчас; без словаря команд и `setMyCommands` — команда доставляется конвейером по адресу (решение владельца) [c1794c4]
- [x] Conductor - User Manual Verification 'Команды' (Protocol in workflow.md)

## Фаза 2.1: Ревизия ФР-4 — трёхуровневый pipe команд

> Решения владельца (сессия 2026-09-06): единственный обработчик команд `handleCommand` на уровнях uiApp/uiController/uiStory; ядро не знает имён команд; реакция `pass | continue(notice) | stop(response)`; меню — декларативные данные `menuButtons` (не обработчики); активная стори сама проверяет `isActive(session)`. Поведение для пользователя не меняется. Подробности — ФР-4 в spec.md.

- [x] Task: Написать падающие тесты: core — pipe триада (pass/continue/stop на стори и контроллере, активная первой, первый stop побеждает, склейка notice-вкладов, все pass → null); u7 — `/start` uiApp без pipe (гость → welcome из menuButtons), дефолты help/cancel/unknown, контракт u7-стори (isActive: help/cancel → stop, неактивна → pass, start → throw), app-контроллер log_level, menuButtons-сбор [2ff4717]
- [x] Task: Core: `CommandReaction` + `handleCommand` на трёх уровнях (uiApp pipe контроллеров → uiController pipe стори с агрегацией); удалить именные `handleHelp`/`handleCancel` (стори), `handleAppCommand`-хук (uiApp) [91b8463]
- [x] Task: u7-bot: `U7BotUiApp.handleCommand` — `/start` напрямую (гость → лог → reopen → welcome из menuButtons), прочее → super + дефолты (help общий из menuButtons, cancel короткое меню, unknown); `U7BotUiStory`-контракт с isActive; app-контроллер: log_level-override + menuButtons; `menuButtons(actor)` у стори/контроллера вместо handleStart, welcome/main-help тексты переезжают в u7UiApp; удалить handleWelcome/handleHelpMessage/MenuAggregator-гейт-остатки [bb52b59]
- [x] Task: Проверки скоупа зелёные (core; u7-bot: transport/wiring/новый контракт) + коммиты с notes [5381039]
- [x] Conductor - User Manual Verification 'Pipe-конвейер команд' (Protocol in workflow.md)

## Фаза 2.2: Правки ревью фазы 2.1 (решения владельца) [checkpoint: 133cf6e]

- [x] Task: Core: активная стори первой в pipe контроллера (порядок: активная стори → остальные стори активного контроллера → остальные контроллеры); контракт ввода — стори обязана ответить (`handleMessage` без null); убрать next из транспорта: ввод без ожидания / без адресата — реплика-подсказка транспорта [bcee785]
- [x] Task: Временный проактив `invite(telegramId, { text, keyboard })` до tasks-system (ФР-6): кнопки штампуются seq диалога получателя на момент отправки; без диалога — текст с подсказкой /start; ретрансляция на всех уровнях ProactiveSender [bcee785]
- [x] Task: Правки ревью 2.2: invite без диалога — временный якорь `app/invite` (seq = 1, приглашение не умирает); дефолт `BotUiStory.handleMessage` (не abstract) — warn + реплика-отказ «Извините, на данном этапе сообщения не принимаются» (страховка awaitInput без обработчика); `/help` — второй прямой путь uiApp, мимо pipe: активной стори задаётся публичный `contextHelp()`, остальным — общий справочник (неактивная стори на /help не отвечает никогда); концепция (bot-ui-concept.md): `/log_level` — не исключение (обычный pipe) [9514506]
- [x] Task: Чистка комментариев скоупа фазы: докстринги только для ответственности (классы, функции, основные методы); тривиальные — убрать [bcee785]
- [x] Conductor - User Manual Verification 'Правки ревью' (Protocol in workflow.md) — подтверждена владельцем 2026-09-08

## Фаза 3: Kind-уведомления

- [x] Task: Написать падающие тесты рендера: проактив `kind` (🔔/ℹ️/⚠️, дефолт `'notify'`), диалоговая реплика `notify` с `kind` (дефолт `'info'`), `errorNotify` — переспрос ввода без захвата экрана (решение владельца при ревью 2.1) [f18afcb]
- [x] Task: ФР-5 `NoticeKind = 'notify' | 'info' | 'warn'`; `NotificationPayload.kind` (замена `tone`); `DialogResponse.notify = { text, kind }` — переименование слота `info` + поглощение `Screen`; хелпер `errorNotify(err)` у стори (валидация — переспрос, `awaitInput`-контекст сохраняется); единая таблица рендера в транспорте; обновить потребителей ядра [15e89a0]
- [x] Conductor - User Manual Verification 'Kind-уведомления' (Protocol in workflow.md)

## Фаза 4: Документация и последующие треки

- [~] Task: ФР-7 обновить `bot-ui-session-architecture.md` (§4 состояние/типы, §5 валидация и рендер, §6 команды, §10 решения) и `bot-ui-dialog-lifecycle.md` (пометка о решениях: вариант A, «без исключений», легаси-контракт приглашений — ФР-6)
- [ ] Task: ФР-8 обновить спеки/планы треков 2–5 (nav, learning, questionnaire, mentor) под решения: info-kind, `handleCommand` у сторей, приглашения анкет по варианту A (штамп текущей эпохи + подсказка /start / deep-link опция)
- [ ] Task: Проверки скоупа зелёные (`bun run check:p core`, `bun run check:a u7-bot` — транспорт и wiring; легаси-стори заявленно красные); создать `summary.md`
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
