# Итоговый отчёт: markdownv2_guard_20260825

> MarkdownV2 — единая точка проверки (fail-fast) и исправление экранирования программы курса.
> Тип: bug. Создан 2026-08-25 по итогам анализа продакшен-логов после релиза 23.08.

## Цель

Устранить падение экрана «Программа курса» (S03) с `GrammyError 400: can't parse entities`
(8 случаев в день после релиза 23.08) и сделать невозможным повтор: единая fail-fast проверка
MarkdownV2 перед отправкой + реалистичные тестовые данные + явные правила в документации.

## Выполненные задачи

### Фаза 1 — Исправление экранирования программы курса (TDD)
- **Red:** тест S03 переведён с санитарных данных («Основы», «Введение») на реалистичные со
  спецсимволами: «Git, TDD и посимвольное сравнение строк», «Обработка ошибок: throw и try-catch»,
  «Математические операторы (+, -, *, /)». Тест падал ровно с прод-ошибкой.
- **Green:** `handleProgramView` экранирует `projectTitle`/`lessonTitle` через `this.escapeMarkdown`
  до `renderTree` (образец: `course-catalog.story.ts #handleProjects`). Контракт `TreeNode.title`
  («уже экранированный») соблюдён.

### Фаза 2 — Единая точка проверки MarkdownV2 (fail-fast, TDD)
- **Red:** новые тесты `ui-utils.test.ts` — валидный MarkdownV2 не бросает; невалидный бросает
  `MarkdownV2ValidationError` для sendMessage / sendMessages / editMessage; отправка не выполняется.
- **Green:**
  - `MarkdownV2ValidationError` (issues + фрагмент текста в `message`) — в
    `packages/core/src/shared/markdown-validator.ts`; `assertMarkdownV2Safe` переведён на него
    (единый тип для тестов и прода).
  - `executeResponses` вызывает `assertResponseMarkdownSafe` из `@u7-scl/core/ui` (единственная
    точка проверки BotResponse); warn-версия `validateResponseInPlace` удалена полностью.
  - Битый текст не уходит в Telegram: глобальный обработчик `main.ts` логирует через
    `serializeError` и отвечает пользователю «Произошла внутренняя ошибка. Попробуйте позже.».

### Фаза 3 — Документация
- `conductor/code_styleguides/bot-test.md` §4/§4.1: прод-поведение fail-fast; правило — тестовые
  данные обязаны содержать спецсимволы; список функций без warn-версий; исправлен несуществующий
  путь `response-markdown-assert.ts` → `response-assert.ts`.
- `conductor/code_styleguides/skills/bot-user-story.md` §4: стори, формирующая `TreeNode[]`,
  экранирует заголовки через `escapeMarkdown` до `renderTree`.
- `apps/u7-bot/src/controllers/streams/ui-spec.md` S03: требование экранирования; формат приведён
  к реальному `renderTree` (проекты жирным, уроки с отступом; шаги списком не выводятся).
- JSDoc `markdown-validator.ts`: роли `escapeMarkdown` (producer) / `validateMarkdownV2`
  (диагностика) / `assertMarkdownV2Safe` + `assertResponseMarkdownSafe` (fail-fast).

### Фаза 4 — Финальная проверка
- `bun run check`: 1418 тестов, 0 fail; biome и tsc чистые.
- Покрытие: All files 87.37% функций / 97.04% строк; `markdown-validator.ts` 100%,
  `response-assert.ts` 100%/90%, `view-stream.story.ts` 88%/86%.
- warn-блоков `[MarkdownV2]` в коде нет; `validateResponseInPlace` отсутствует.

## Изменённые файлы

**Код:**
- `apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts` — экранирование заголовков (S03)
- `apps/u7-bot/src/core/ui-utils.ts` — fail-fast, удаление warn-версии
- `packages/core/src/shared/markdown-validator.ts` — класс `MarkdownV2ValidationError`, JSDoc ролей
- `packages/core/src/shared/index.ts` — экспорт класса
- `packages/core/src/ui/bot/response-assert.ts` — JSDoc (fail-fast в проде)

**Тесты:**
- `apps/u7-bot/src/controllers/streams/stories/view-stream.story.test.ts` — S03 со спецсимволами
- `apps/u7-bot/src/core/ui-utils.test.ts` — 5 новых тестов fail-fast

**Документация:**
- `conductor/code_styleguides/bot-test.md`
- `conductor/code_styleguides/skills/bot-user-story.md`
- `apps/u7-bot/src/controllers/streams/ui-spec.md`
- `conductor/tracks.md` (статус трека)

## Архитектурные решения

1. **Fail-fast вместо warn:** warn-проверка только писала в консоль и всё равно отправляла битый
   текст. Теперь `executeResponses` бросает `MarkdownV2ValidationError` до отправки — единственная
   точка проверки (`assertResponseMarkdownSafe`), единый тип ошибки для тестов и прода.
2. **Класс ошибки в shared-слое core:** `MarkdownV2ValidationError` живёт рядом с валидатором —
   его могут использовать и тесты, и прод-код без дублирования.
3. **Экранирование на producer-стороне:** заголовки экранируются до `renderTree` — контракт
   `TreeNode.title` («уже экранированный») не нарушается; рендерер остаётся чистой функцией.
4. **Реалистичные тестовые данные:** санитарные значения не ловят регрессии экранирования —
   правило зафиксировано в `bot-test.md` §4.1.

## Отклонения от плана

- JSDoc `markdown-validator.ts` (задача Фазы 3) выполнен в составе Фазы 2 (коммит `5bd09eb`) —
  логичнее: класс и роли функций менялись вместе.
- `packages/stream/src/ui/bot/ui-spec.md` из workflow «Завершение трека» не существует — после
  рефакторинга Bot UI актуальный spec находится в `apps/u7-bot/src/controllers/streams/ui-spec.md`.
- Формат S03 в ui-spec приведён к реальному `renderTree` (в описании был устаревший формат
  «уроки жирным + шаги списком»).

## Известные ограничения

- Авто-экранирование / fallback на этапе отправки сознательно не делается (за рамками трека).
- Другие стори на предмет экранирования не ревизовались — fail-fast выявит новые случаи
  отдельной задачей.
- `ui-utils.ts` покрыт на 66–70% (ветки Telegram-API: editMessage, удаление клавиатуры) — вне
  области трека.
- В `streams/ui-spec.md` S02 кнопка «📊 Студенты» описана как `monitor:students:{id}`, но в коде
  ведёт на `view-stream:students:{id}` (расхождение существовало до трека; S02 не менялся).
