# Спецификация — Трек: Стори навигации app/user/courses/streams (bot-ui-dialog-nav_20260905)

> **Материнский документ:** [bot-ui-session-architecture.md](../../bot-ui-session-architecture.md) — утверждённая целевая архитектура bot-ui v3 (инварианты §3, контракты §4, политика рендера §5). Трек 2 декомпозиции §9.

## Обзор

Миграция сторей простой навигации на контракт «Диалог и Экран»: app (community), user (notify), courses (catalog), streams (catalog, view-stream, inactivity).

## Функциональные требования

- Перечисленные стори на `DialogResponse`; edit-in-place для своих экранов; кнопки — мосты (валидный штамп).
- Delegate (3 живых использования): enroll→menu, enroll-cancel→view, monitor→students.
- enroll-capture: `awaitInput`/`release` без `path`.
- Inactivity: кнопочные проактивные подписки → notify-текст (И3: проактив без кнопок, сессию не трогает).
- Удаление `editOrSend`/`respondInContext` там, где затронуты.

## Нефункциональные требования

- Правило «трек уменьшает» (§9): трек завершён ⟺ всё, что он трогал, целиком на новом контракте; никаких адаптеров совместимости.

## Критерии приёмки

- Скоуп трека целиком на новом контракте, тесты/линт/tsc скоупа зелёные; вне скоупа допустим красный tsc (заявленное состояние).
- Grep по скоупу: не осталось `BotResponse`/`editOrSend`/`respondInContext`.

## За рамками

- Learning-, questionnaire-, mentor-стори (треки 3–5).
- Удаление старых типов (трек 5); персистентность (трек 6).
