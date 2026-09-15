# Спецификация — Трек: Ядро контракта «Диалог и Экран» (bot-ui-dialog-core_20260905)

> **Материнский документ:** [bot-ui-session-architecture.md](../../roadmap/bot-ui-session-architecture.md) — утверждённая целевая архитектура bot-ui v3 (инварианты §3, контракты §4, политика рендера §5, слои §6). Трек 1 декомпозиции §9.

## Обзор

Перевод ядра bot-ui на контракт «Диалог и Экран» (v3): типы, транспорт, uiApp, контроллер, базовый класс стори. Прикладные стори сознательно остаются сломанными (tsc красный) — чинятся треками 2–5 (правило «трек уменьшает», §9).

## Функциональные требования

- Типы в `packages/core/src/ui/bot/types.ts`: `MdText` + `md`/`mdRaw` (в `packages/core/src/shared/markdown.ts` или новом `md.ts` в ui/bot), `Screen`, `KeyboardDescription` (без `takeover`), `DialogResponse` (`screen`/`finalize`/`info`/`awaitInput`/`release`/`delegate`), `DialogState`, `ScreenState`, `BotSession`, `NotificationPayload` (+`tone`), `ProactiveSender` без `send()`.
- Транспорт (`apps/u7-bot/src/infra/bot-transport.ts`): рендер-политика §5 (edit своих / send+retire чужих, маркер выбора «—————\nВы выбрали: …»), штампы `:~<seq36>` (дописывание на отправке, сверка на приёме, alert «нажмите /start»), per-chat очередь на все апдейты и notify, warn-логи ошибок Telegram API вместо глушения.
- `BotUiApp` (`packages/core/src/ui/bot/ui-app.ts`): маршрутизация без проверок «чужой контроллер», `seq++` при смене диалога, `awaitInput`/`release` без `path`, общий `/help`-fallback; удаление takeover-кодирования.
- `BotController`: `handleError` → `DialogResponse`; удаление `handleTimeout`.
- `BotUiStory`: `handleHelp(): Screen | null`, `confirm`/`handleError` на новом контракте; удаление `handleTimeout`, `escapeMarkdown`.
- Команды: `/start` (закрыть диалог, welcome send'ом, retire без маркера), `/cancel` (делегация `handleCancel`, дефолт — меню), `/help` (info-реплика, диалог не трогает).
- Тесты формата штампа, включая коллизию с кодами, начинающимися с `~` (§12.2).

## Нефункциональные требования

- Тесты ядра зелёные; `response-assert` сохранён как fail-fast для `md`-литералов.
- Формат фиксирован: `parseMode` исчезает из всех типов, транспорт всегда шлёт MarkdownV2.

## Критерии приёмки

- `packages/core` (ui/bot) и ядро `apps/u7-bot`: тесты зелёные, линт зелёный.
- `tsc` по прикладным сторям — красный (заявленное состояние), задокументировано.
- Все диалоговые пути ядра покрыты тестами (штампы, очередь, retire, finalize, delegate).

## За рамками

- Миграция любых прикладных стори (треки 2–5).
- Персистентность сессий (трек 6).
- Удаление старых типов (`BotCommand`, `BotResponse`, `SessionData`, …) — трек 5.
