# Спецификация — Трек: Mentor-стори и демонтаж старого мира (bot-ui-dialog-mentor_20260905)

> **Материнский документ:** [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md) — целевая архитектура bot-ui v4 (инварианты §3, контракты §4, карта кода §11, решения трека 1.1 §10.10–16). Трек 5 декомпозиции §9, финальный миграционный.

## Обзор

Последняя миграционная волна + зачистка: mentor-стори (submenu, my-streams, view-stream-mentor, create-stream, activate-stream, monitor) и удаление старого контракта целиком. Финальный трек приводит весь репозиторий в зелёное (§9).

## Функциональные требования

- Mentor-стори на `DialogResponse` (включая delegate monitor→students, если ещё не переведён); команды — дефолт pipe (`pass`, доменные команды — override `handleCommand`); ошибки валидации — `errorNotify`.
- **Удаление старых типов**: `BotCommand`, `BotResponse`, `SessionData`, `SendMessage/EditMessageDescription`, takeover-код, цепочка `handleTimeout`, `escapeMarkdown`, старые ассерты, остатки именных обработчиков команд (`handleHelp`/`handleCancel`/`handleWelcome`/`handleStart`/appCommand-хук) и `notifyWithButtons` (заменён временным `invite`).
- Временное остаётся: `ProactiveSender.invite` и якорь `app/invite` (ФР-6) — их удаляет tasks-system, не этот трек.
- Зачистка ассертов, `apps/u7-bot/src/context.ts` окончательно на `BotSession`.
- Обновление стильгайдов (`code_styleguides/bot-architecture.md`, `code_styleguides/skills/bot-ui-story.md`, `code_styleguides/skills/bot-controller.md`) и `ui-spec.md` (полная сверка всех экранов).

## Нефункциональные требования

- Никаких адаптеров совместимости между контрактами (§9).

## Критерии приёмки

- **Весь репозиторий зелёный**: `bun run check` (biome + `tsc --noEmit` + тесты).
- Grep по кодовой базе: не осталось упоминаний старых типов.

## За рамками

- Персистентность сессий (трек 6); система задач (tasks-system).
