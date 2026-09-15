# Итоговый отчёт — Трек bot-ui-dialog-core_20260905 «Ядро контракта «Диалог и Экран»»

**Цель:** фундамент для [bot-ui-session-architecture.md](../../roadmap/bot-ui-session-architecture.md): типы `DialogResponse`/`Screen`/`BotSession`, `MdText`, транспорт со штампами и очередью, ядро `BotUiApp`/`BotController`/`BotUiStory`, вырезка мёртвой механики старой архитектуры.

## Выполнено

| Фаза | Коммит | Суть |
|---|---|---|
| 1. Типы и MdText | `b1f831dc`, `a0604a3` | `MdText`/`md`/`mdRaw` (+валидатор); контракты `types.ts` (`Screen`, `DialogResponse`, `DialogState`, `BotSession`, `NotificationPayload{tone}`, `ProactiveSender` без `send`); `assertDialogResponseMarkdownSafe` |
| 2. Транспорт | `f1bf66fd` | штампы `:~<seq36>` в callback-кодах (сверка на приёме, crafted `~0` отвергается); per-chat очередь на всё; рендер-политика §5 (`finalize`/`screen`/`info`/`notify`, retire-маркер «Вы выбрали:»); warn-логи Telegram API; сессии — у транспорта |
| 3. Ядро | `3a58b33a` | `BotUiApp` (диалог=`controller/story`, `seq++` на смене, delegate-склейка, `/help`→info-реплика, `/cancel`→доменная очистка→короткое меню `8f3ee059`); `BotController` (префиксация screen/info/delegate.path, `handleError`→экран); `BotUiStory` (`handleHelp`, `confirm(MdText)`, `awaitInput`/`release`); Grammy-сессии вырезаны; app-домен (AppController, CommunityStory) конвертирован |
| 4. Финал | `78c0153e` | green-сверка ядра; гайды `bot-ui-story.md`/`bot-controller.md` под новый контракт (переписаны как чистые инструкции по ревью владельца) |

## Ключевые решения (владелец)

- **Диалог = `controller/story`**: переход между стори — retire+send (лог переходов в чате), edit-in-place — внутри одной стори.
- **`/cancel` — короткое меню** без приветствия (`buildCancelMenuScreen`); `/start` — полный welcome.
- **Штампы валидны с 1**: seq 0 = «диалог не открыт через /start».
- **Очередь всегда включена**: «polling no-op» — наблюдательно прозрачна.
- **`mdConcat`/`mdJoin`** — единственный способ композиции `MdText` (бренд только в типах; вложенная интерполяция экранирует повторно). Точки в md-литералах — `\\.`.
- **Grammy-сессии удалены целиком** (`context.ts`/`bot.ts`/`main.ts`) — `BotSession` живёт только в транспорте.

## Отклонения от плана

- Red/Green-пары объединялись в один коммит (согласовано с владельцем).
- AppController/CommunityStory мигрированы досрочно (иначе welcome/help Фазы 3 мертвы); помечено в плане трека `bot-ui-dialog-nav`.
- Старые типы/хелперы core (`BotResponse` и пр.) остаются до трека 5 — их ещё используют немигрированные прикладные стори (компиляция).

## Заявленное состояние (до треков 2–5)

- Прикладные стори/контроллеры (`courses`, `learning`, `mentor`, `questionnaire`, `streams`, `user`), `create-ui-app.ts`, e2e: tsc ~521 ошибка, ~99 юнит-тестов красные. Ядро зелёное: core `bun run check` (268 тестов), ядро u7-bot 101 тест.

## Файлы (основное)

- `packages/core/src/shared/markdown.ts` (+`mdConcat`/`mdJoin`, валидатор) — `markdown.test.ts`
- `packages/core/src/ui/bot/types.ts` — контракты; `response-assert.ts`
- `packages/core/src/ui/bot/bot-transport` — транспорт (`apps/u7-bot/src/infra/bot-transport.ts`)
- `packages/core/src/ui/bot/{ui-app,bot-controller,bot-ui-story}.ts` (+тесты; takeover-тест удалён)
- `apps/u7-bot/src/core/{ui-app,u7-bot-controller}.ts`; `context.ts`, `bot.ts`, `main.ts`
- `apps/u7-bot/src/controllers/app/{app-controller,stories/community.story}.ts` (+тесты)
- Гайды: `conductor/code_styleguides/skills/{bot-ui-story,bot-controller}.md`

## ui-spec

Не обновлялся осознанно: трек не менял экраны прикладных доменов (streams/learning/mentor/questionnaire/courses); изменённые системные экраны (`/start`, `/help` info-реплика, `/cancel`-меню) относятся к app-домену, у которого ui-spec отсутствует. Проверка «устаревших строк» — не применима (callback-коды доменов не менялись).

## Ограничения / что дальше

- Миграция прикладных стори — трек 2 (`bot-ui-dialog-nav`), learning-навигация — трек 3, mentor-мастерская — трек 4, e2e-хелпер и остаточная чистка core — трек 5, релиз — трек 6.
- `TreeNode.title` — строка; при миграции заголовки формируются через `md` (правило в гайде).
- E2e-хелпер `tests/helpers/test-bot-transport.ts` компилируем, но снимок без слотов `awaitInput`/`release` — полноценная миграция в треке 5.
