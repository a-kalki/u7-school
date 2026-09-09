# План реализации — Трек: Mentor-стори и демонтаж старого мира (bot-ui-dialog-mentor_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

## Фаза 1: Mentor-стори

- [ ] Task: Написать падающие тесты submenu, my-streams, view-stream-mentor, create-stream, activate-stream, monitor на `DialogResponse` (включая delegate monitor→students); команды — дефолт pipe, ошибки — `errorNotify`
- [ ] Task: **Убедиться, что «⚠️ Снять с учёбы» (mark-abandoned, cause=inactivity, FR-5) доступен ментору без проактива:** точка входа в monitor (карточка студента) с confirm-диалогом — ex-кнопка проактива inactivity, удалённая треком bot-ui-dialog-nav [7034c7e]; приёмка — сценарий снятия проходит из monitor, студент исключён из TG-группы (FR-6), реплика «✅ Студент снят с учёбы…» доставляется
- [ ] Task: Мигрировать тесты домена: e2e `mentor-management`, integration `tests/mentor/mentor.integration.test.ts` — на `DialogResponse` (тест-стенд `tests/helpers/test-bot-transport.ts` уже на новом контракте — мигрирован треком bot-ui-dialog-nav [6e1147a4], хелперы нажатий готовы: `pressedCode`/`stampedCode` [94fa7a1e])
- [ ] Task: Перевести все mentor-стори
- [ ] Conductor - User Manual Verification 'Mentor-стори' (Protocol in workflow.md)

## Фаза 2: Демонтаж старого мира

- [ ] Task: Удалить старые типы и код: `BotCommand`, `BotResponse`, `SessionData`, `SendMessage/EditMessageDescription`, takeover, `handleTimeout`, `escapeMarkdown`, старые ассерты, остатки именных обработчиков команд и `notifyWithButtons`; `context.ts` финально на `BotSession` (временные `invite`/`app/invite` не трогать — их удаляет tasks-system)
- [ ] Task: Весь репозиторий зелёный: `bun run check` (biome + tsc + тесты — включая tests/helpers и e2e ВСЕХ доменов); grep не находит старых типов
- [ ] Conductor - User Manual Verification 'Демонтаж' (Protocol in workflow.md)

## Фаза 3: Документация и финал трека 5

- [ ] Task: Обновить `bot-architecture.md`, `ui-spec.md` (полная сверка всех экранов), стильгайды; создать `summary.md`
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
