# План: markdownv2_guard_20260825

> Полный контекст — в `spec.md` (анализ логов, root cause, точные файлы и строки,
> критерии приёмки). Перед реализацией прочитай `spec.md`.

## Фаза 1: Исправление экранирования программы курса (TDD)

- [ ] Задача: Написать падающие тесты (Red)
    - [ ] `apps/u7-bot/src/controllers/streams/stories/view-stream.story.test.ts`,
          тест S03 (~строки 287–334): заменить санитарные данные на реалистичные
          со спецсимволами `-`, `(`, `)`, `.` (например: «Обработка ошибок: throw и try-catch»,
          «Математические операторы (+, -, *, /)», «Git, TDD и посимвольное сравнение строк»)
    - [ ] Запустить тест и убедиться, что `assertResponseMarkdownSafe` падает (Red)
- [ ] Задача: Реализовать экранирование (Green)
    - [ ] `view-stream.story.ts`, `handleProgramView`: экранировать `projectTitle`
          и `lessonTitle` через `escapeMarkdown` перед `renderTree`
          (образец: `course-catalog.story.ts`, `this.#esc`)
    - [ ] Убедиться, что тест S03 зелёный, остальные тесты стори не сломаны
- [ ] Задача: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: Единая точка проверки MarkdownV2 — fail-fast (TDD)

- [ ] Задача: Написать падающие тесты (Red)
    - [ ] `apps/u7-bot/src/core/ui-utils.test.ts`: новые тесты —
          валидный MarkdownV2 не бросает; невалидный бросает `MarkdownV2ValidationError`
          (проверить sendMessage / sendMessages / editMessage)
- [ ] Задача: Реализовать объединение проверок (Green)
    - [ ] `packages/core/src/shared/markdown-validator.ts`: класс
          `MarkdownV2ValidationError` (issues + фрагмент текста в `message`);
          перевести `assertMarkdownV2Safe` на него
    - [ ] `packages/core/src/ui/bot/response-assert.ts`: `assertResponseMarkdownSafe`
          остаётся единственной точкой проверки BotResponse (перебор
          sendMessage/sendMessages/editMessage уже там)
    - [ ] `apps/u7-bot/src/core/ui-utils.ts`: `executeResponses` вызывает
          `assertResponseMarkdownSafe` из `@u7-scl/core/ui` вместо
          `validateResponseInPlace`; удалить `validateResponseInPlace`
    - [ ] Проверить, что пользовательский текст об ошибке приходит через
          глобальный обработчик `apps/u7-bot/src/main.ts` (строки 83–93) —
          без изменений
- [ ] Задача: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Документация

- [ ] Задача: Обновить `conductor/code_styleguides/bot-test.md` §4/§4.1
    - [ ] Прод-поведение: fail-fast через `assertResponseMarkdownSafe` в `executeResponses`
    - [ ] Правило: тестовые данные обязаны содержать спецсимволы
          (`-`, `(`, `)`, `.`, `!`, `+`) — санитарные не ловят регрессии
    - [ ] Обновить список функций (warn-версии больше нет)
- [ ] Задача: Обновить `conductor/code_styleguides/skills/bot-user-story.md` §4
    - [ ] Правило: стори, формирующая `TreeNode[]`, экранирует заголовки
          через `escapeMarkdown` до `renderTree`
- [ ] Задача: Обновить `apps/u7-bot/src/controllers/streams/ui-spec.md` S03
    - [ ] Зафиксировать требование экранирования заголовков
- [ ] Задача: Обновить JSDoc в `packages/core/src/shared/markdown-validator.ts`
    - [ ] Роли: `escapeMarkdown` — producer; `validateMarkdownV2` — диагностика;
          `assertMarkdownV2Safe` / `assertResponseMarkdownSafe` — fail-fast
- [ ] Задача: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)

## Фаза 4: Финальная проверка

- [ ] Задача: Прогнать `bun run check` (biome + tsc + тесты)
- [ ] Задача: Проверить покрытие (`bun test --coverage`, >80%)
- [ ] Задача: Убедиться, что в логах больше нет warn-блоков `[MarkdownV2]`
- [ ] Задача: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)
