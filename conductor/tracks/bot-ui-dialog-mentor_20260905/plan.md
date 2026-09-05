# План реализации — Трек: Mentor-стори и демонтаж старого мира (bot-ui-dialog-mentor_20260905)

> Материнский документ: [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md)

## Фаза 1: Mentor-стори

- [ ] Task: Написать падающие тесты submenu, my-streams, view-stream-mentor, create-stream, activate-stream, monitor на `DialogResponse` (включая delegate monitor→students)
- [ ] Task: Перевести все mentor-стори
- [ ] Conductor - User Manual Verification 'Mentor-стори' (Protocol in workflow.md)

## Фаза 2: Демонтаж старого мира

- [ ] Task: Удалить старые типы и код: `BotCommand`, `BotResponse`, `SessionData`, `SendMessage/EditMessageDescription`, takeover, `handleTimeout`, `escapeMarkdown`, старые ассерты; `context.ts` финально на `BotSession`
- [ ] Task: Весь репозиторий зелёный: `bun run check` (biome + tsc + тесты); grep не находит старых типов
- [ ] Conductor - User Manual Verification 'Демонтаж' (Protocol in workflow.md)

## Фаза 3: Документация и финал трека 5

- [ ] Task: Обновить `bot-architecture.md`, `ui-spec.md` (полная сверка всех экранов), стильгайды; создать `summary.md`
- [ ] Conductor - User Manual Verification 'Финал' (Protocol in workflow.md)
