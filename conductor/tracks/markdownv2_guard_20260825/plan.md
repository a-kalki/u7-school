# План: markdownv2_guard_20260825

> Полный контекст — в `spec.md` (анализ логов, root cause, точные файлы и строки,
> критерии приёмки). Перед реализацией прочитай `spec.md`.

## Фаза 1: Исправление экранирования программы курса (TDD) [checkpoint: 0b13c4e]

- [x] Задача: Написать падающие тесты (Red)
    - [x] `apps/u7-bot/src/controllers/streams/stories/view-stream.story.test.ts`,
          тест S03 (~строки 287–334): заменить санитарные данные на реалистичные
          со спецсимволами `-`, `(`, `)`, `.` (например: «Обработка ошибок: throw и try-catch»,
          «Математические операторы (+, -, *, /)», «Git, TDD и посимвольное сравнение строк»)
    - [ ] Запустить тест и убедиться, что `assertResponseMarkdownSafe` падает (Red)
- [x] Задача: Реализовать экранирование (Green) `ce40630`
    - [x] `view-stream.story.ts`, `handleProgramView`: экранировать `projectTitle`
          и `lessonTitle` через `escapeMarkdown` перед `renderTree`
          (образец: `course-catalog.story.ts`, `this.#esc`)
    - [x] Убедиться, что тест S03 зелёный, остальные тесты стори не сломаны
- [x] Задача: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md) `0b13c4e`

## Фаза 2: Единая точка проверки MarkdownV2 — fail-fast (TDD) [checkpoint: d7e8cc7]

- [x] Задача: Написать падающие тесты (Red) `5bd09eb`
    - [x] `apps/u7-bot/src/core/ui-utils.test.ts`: новые тесты —
          валидный MarkdownV2 не бросает; невалидный бросает `MarkdownV2ValidationError`
          (проверить sendMessage / sendMessages / editMessage)
- [x] Задача: Реализовать объединение проверок (Green) `5bd09eb`
    - [x] `packages/core/src/shared/markdown-validator.ts`: класс
          `MarkdownV2ValidationError` (issues + фрагмент текста в `message`);
          перевести `assertMarkdownV2Safe` на него
    - [x] `packages/core/src/ui/bot/response-assert.ts`: `assertResponseMarkdownSafe`
          остаётся единственной точкой проверки BotResponse (перебор
          sendMessage/sendMessages/editMessage уже там)
    - [x] `apps/u7-bot/src/core/ui-utils.ts`: `executeResponses` вызывает
          `assertResponseMarkdownSafe` из `@u7-scl/core/ui` вместо
          `validateResponseInPlace`; удалить `validateResponseInPlace`
    - [x] Проверить, что пользовательский текст об ошибке приходит через
          глобальный обработчик `apps/u7-bot/src/main.ts` (строки 83–93) —
          без изменений
- [x] Задача: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md) `d7e8cc7`

## Фаза 3: Документация [checkpoint: 9db552e]

- [x] Задача: Обновить `conductor/code_styleguides/bot-test.md` §4/§4.1
    - [x] Прод-поведение: fail-fast через `assertResponseMarkdownSafe` в `executeResponses`
    - [x] Правило: тестовые данные обязаны содержать спецсимволы
          (`-`, `(`, `)`, `.`, `!`, `+`) — санитарные не ловят регрессии
    - [x] Обновить список функций (warn-версии больше нет)
- [x] Задача: Обновить `conductor/code_styleguides/skills/bot-user-story.md` §4
    - [x] Правило: стори, формирующая `TreeNode[]`, экранирует заголовки
          через `escapeMarkdown` до `renderTree`
- [x] Задача: Обновить `apps/u7-bot/src/controllers/streams/ui-spec.md` S03
    - [x] Зафиксировать требование экранирования заголовков
    - [x] Формат приведён к реальному `renderTree` (проекты жирным, уроки с отступом)
- [x] Задача: Обновить JSDoc в `packages/core/src/shared/markdown-validator.ts`
    - [x] Роли: `escapeMarkdown` — producer; `validateMarkdownV2` — диагностика;
          `assertMarkdownV2Safe` / `assertResponseMarkdownSafe` — fail-fast
          (выполнено в Фазе 2, коммит `5bd09eb`)
- [x] Задача: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md) `9db552e`

## Фаза 4: Финальная проверка

- [x] Задача: Прогнать `bun run check` (biome + tsc + тесты)
- [x] Задача: Проверить покрытие (`bun test --coverage`, >80%)
- [x] Задача: Убедиться, что в логах больше нет warn-блоков `[MarkdownV2]`
- [ ] Задача: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)
