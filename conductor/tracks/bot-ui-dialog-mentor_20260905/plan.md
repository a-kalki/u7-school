# План реализации — Трек: Mentor-стори и демонтаж старого мира (bot-ui-dialog-mentor_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

## Фаза 1: Mentor-стори

- [x] Task: **Инвентаризация кнопок/реплик** всех mentor-стори из `ui-spec.md` и кода → зафиксировать в падающих тестах с точными keyboard-ассертами; протокол «миграция без потери функциональности» — решение владельца, ревью трека 3 (см. spec) [e40280d2]
- [x] Task: Написать падающие тесты submenu, my-streams, view-stream-mentor, create-stream, activate-stream, monitor на `DialogResponse` (включая delegate monitor→students); команды — дефолт pipe, ошибки — `errorNotify` [e40280d2]
- [x] Task: **Убедиться, что «⚠️ Снять с учёбы» (mark-abandoned, cause=inactivity, FR-5) доступен ментору без проактива:** точка входа в monitor (карточка студента) с confirm-диалогом — ex-кнопка проактива inactivity, удалённая треком bot-ui-dialog-nav [7034c7e]; приёмка — сценарий снятия проходит из monitor, студент исключён из TG-группы (FR-6), реплика «✅ Студент снят с учёбы…» доставляется
- [ ] Task: Мигрировать тесты домена: e2e `mentor-management`, integration `tests/mentor/mentor.integration.test.ts` — на `DialogResponse` (тест-стенд `tests/helpers/test-bot-transport.ts` уже на новом контракте — мигрирован треком bot-ui-dialog-nav [6e1147a4], хелперы нажатий готовы: `pressedCode`/`stampedCode` [94fa7a1e])
- [x] Task: Перевести все mentor-стори [df4e9892]
- [ ] Task: **Восстановить кнопочные проактивы InactivityStory через `invite`** (решение владельца, ревью трека 3): «🚪 Покинуть учёбу» студенту (предупреждение 5+ дней) и «⚠️ Снять с учёбы» ментору (уведомление об отстающем) — прежние тексты/переходы из [7034c7e~1]; тесты на обе кнопки (keyboard-ассерты + сценарий нажатия)
- [ ] Conductor - User Manual Verification 'Mentor-стори' (Protocol in workflow.md)

## Фаза 2: Демонтаж старого мира

- [ ] Task: Удалить старые типы и код: `BotCommand`, `BotResponse`, `SessionData`, `SendMessage/EditMessageDescription`, takeover, `handleTimeout`, `escapeMarkdown`, старые ассерты, остатки именных обработчиков команд и `notifyWithButtons`; `context.ts` финально на `BotSession` (временные `invite`/`app/invite` не трогать — их удаляет tasks-system)
- [ ] Task: Весь репозиторий зелёный: `bun run check` (biome + tsc + тесты — включая tests/helpers и e2e ВСЕХ доменов); grep не находит старых типов
- [ ] Conductor - User Manual Verification 'Демонтаж' (Protocol in workflow.md)

## Фаза 3: Документация и финал трека 5

- [ ] Task: Обновить `bot-architecture.md`, `ui-spec.md` (полная сверка всех экранов — спек источник истины: расхождения — вопрос владельцу, функциональность восстанавливается, спек не подгоняется), стильгайды; создать `summary.md`
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
