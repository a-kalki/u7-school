# План реализации — Трек: Ядро контракта «Диалог и Экран» (bot-ui-dialog-core_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

## Фаза 1: Типы и MdText

- [ ] Task: Написать падающие тесты `md`/`mdRaw`/`MdText`: интерполяция `${}` экранирует доменные данные, `mdRaw` пропускает как есть, битые литералы ловятся `response-assert` (fail-fast)
- [ ] Task: Реализовать `MdText`/`md`/`mdRaw` (`packages/core/src/shared/markdown.ts`)
- [ ] Task: Объявить контракты в `packages/core/src/ui/bot/types.ts`: `Screen`, `KeyboardDescription` (без `takeover`), `DialogResponse`, `DialogState`, `ScreenState`, `BotSession`, `NotificationPayload` (+`tone`), `ProactiveSender` (без `send()`); старые типы пока остаются рядом
- [ ] Conductor - User Manual Verification 'Типы и MdText' (Protocol in workflow.md)

## Фаза 2: Транспорт

- [ ] Task: Написать падающие тесты штампов: дописывание `:~<seq36>` в коды callback-кнопок на отправке, сверка на приёме, alert «нажмите /start» при несовпадении, коллизия с кодами на `~` (§12.2)
- [ ] Task: Реализовать штампы в `bot-transport.ts`
- [ ] Task: Написать падающие тесты per-chat очереди: сериализация всех `handle*`-апдейтов и `notify` (webhook), no-op в polling
- [ ] Task: Реализовать очередь на всё
- [ ] Task: Написать падающие тесты рендер-политики §5: `finalize` (edit только своего экрана, иначе warn+пропуск), `screen` (edit своих / retire с маркером выбора + send), `info`/`notify` (тон-каналы, сессию не трогают), `/start`-retire без маркера
- [ ] Task: Реализовать рендер-политику, тон-каналы, warn-логи ошибок Telegram API (замена `.catch(() => {})`)
- [ ] Conductor - User Manual Verification 'Транспорт' (Protocol in workflow.md)

## Фаза 3: BotUiApp, BotController, BotUiStory

- [ ] Task: Написать падающие тесты uiApp: маршрутизация без «чужого контроллера», `seq++` при смене диалога, `delegate` (info/screen инициатора до экрана делегата, без `#mergeResponses`), `awaitInput`/`release` без `path`, `/help` (handleHelp стори → fallback, info-реплика)
- [ ] Task: Реализовать `ui-app.ts`, удалить takeover-кодирование
- [ ] Task: Написать падающие тесты `BotUiStory`: `handleHelp(): Screen | null`, `confirm`, `handleError` → `DialogResponse`
- [ ] Task: Реализовать `bot-ui-story.ts`; удалить `handleTimeout`, `escapeMarkdown`
- [ ] Task: `BotController`: `handleError` → `DialogResponse`, удалить `handleTimeout`; команды `/start` (закрытие диалога, welcome send'ом), `/cancel` (делегация `handleCancel`, дефолт — меню)
- [ ] Task: `apps/u7-bot/src/context.ts`: `BotSession` вместо `SessionData`
- [ ] Conductor - User Manual Verification 'Ядро' (Protocol in workflow.md)

## Фаза 4: Финал трека 1

- [ ] Task: Тесты и линт ядра зелёные (`bun run check` для core/ui + ядра u7-bot); красный tsc прикладных сторей зафиксирован как заявленное состояние
- [ ] Task: Обновить стильгайды `bot-ui-story.md` и `bot-controller.md` (новый контракт)
- [ ] Conductor - User Manual Verification 'Финал ядра' (Protocol in workflow.md)
