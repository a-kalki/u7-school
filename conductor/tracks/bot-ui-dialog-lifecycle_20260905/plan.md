# План реализации — Трек: Жизненный цикл диалога (bot-ui-dialog-lifecycle_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md). Источник проблем: [bot-ui-dialog-lifecycle.md](../../bot-ui-dialog-lifecycle.md). Скоуп: ядро `packages/core/src/ui/bot/*` + `apps/u7-bot/src/infra/bot-transport.ts` (+`main.ts` wiring). Прикладные стори не трогаем.

## Фаза 1: Модель диалога — состояние и операция входа

- [ ] Task: Написать падающие инвариант-тесты: первый `/start` (seq=1, кнопки живы), повторный `/start` (reopen, не no-op), кнопка до `/start` → alert «Наберите /start», дубль-тап по мосту (второй — alert), delegate «меню→меню» (seq не растёт) и кросс-контроллерный (seq++)
- [ ] Task: ФР-1 `BotSession.dialog?` — явное состояние «не открыт»; удалить `INITIAL_DIALOG_PATH` и ленивый фиктивный диалог в `#session`
- [ ] Task: ФР-2 `#enterDialog(path, mode: 'switch' | 'reopen')` — единственная точка инкремента `seq`; провести через неё `/start`, `/cancel`, delegate, мосты (`#dispatch`)
- [ ] Task: ФР-3 валидация кнопок без исключений: не открыт → «Наберите /start»; штамп ≠ seq → «Экран устарел — нажмите /start»; адаптировать тесты транспорта
- [ ] Conductor - User Manual Verification 'Модель диалога' (Protocol in workflow.md)

## Фаза 2: Единый вход команд

- [ ] Task: Написать падающие тесты конвейера `handleCommand`: appCommand-хук → активная стори → core-дефолт; `/help` три уровня (стори → main-help на меню → fallback), `/cancel` (доменная очистка → меню), команды при не открытом диалоге
- [ ] Task: Core: `BotUiApp.handleCommand(cmd, tgId, session)` + appCommand-хук (`null` = «пропускаю») + `BotUiStory.handleCommand` (обобщение `handleHelp`/`handleCancel`, `null` = «не моё»)
- [ ] Task: Транспорт: один `handleCommand(ctx)` вместо `handleStart/handleHelp/handleCancel`; перехват всех слэш-текстов в едином `message:text`-хендлере (фильтр `/`-префикса), без поимённой grammy-регистрации
- [ ] Task: u7-bot: словарь команд + appController-гейт (гост-регистрация, админ-проверки `/log_level`, `/help` на меню → сборка описаний главных кнопок); welcome-меню как сейчас; `setMyCommands` — опция wiring'а
- [ ] Conductor - User Manual Verification 'Команды' (Protocol in workflow.md)

## Фаза 3: Kind-уведомления

- [ ] Task: Написать падающие тесты рендера: проактив `kind` (🔔/ℹ️/⚠️, дефолт `'notify'`), диалоговая `info`-реплика с `kind` (дефолт `'info'`)
- [ ] Task: ФР-5 `NoticeKind = 'notify' | 'info' | 'warn'`; `NotificationPayload.kind` (замена `tone`); `DialogResponse.info = { text, kind }` вместо `Screen`; единая таблица рендера в транспорте; обновить потребителей ядра
- [ ] Conductor - User Manual Verification 'Kind-уведомления' (Protocol in workflow.md)

## Фаза 4: Документация и последующие треки

- [ ] Task: ФР-7 обновить `bot-ui-session-architecture.md` (§4 состояние/типы, §5 валидация и рендер, §6 команды, §10 решения) и `bot-ui-dialog-lifecycle.md` (пометка о решениях: вариант A, «без исключений», легаси-контракт приглашений — ФР-6)
- [ ] Task: ФР-8 обновить спеки/планы треков 2–5 (nav, learning, questionnaire, mentor) под решения: info-kind, `handleCommand` у сторей, приглашения анкет по варианту A (штамп текущей эпохи + подсказка /start / deep-link опция)
- [ ] Task: Проверки скоупа зелёные (`bun run check:p core`, `bun run check:a u7-bot` — транспорт и wiring; легаси-стори заявленно красные); создать `summary.md`
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
