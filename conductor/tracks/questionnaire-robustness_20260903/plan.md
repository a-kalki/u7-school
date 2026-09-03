# План реализации — Трек: Устойчивость анкеты (questionnaire-robustness_20260903)

> Методология: workflow.md (TDD Red → Green → Refactor, `bun run check` перед коммитом, git notes, контрольные точки по фазам).

## Фаза 1: MarkdownV2-мины (P0-B + inviteText)

- [ ] Task: Написать падающие тесты `handleError` (`apps/u7-bot/src/core/u7-bot-ui-story.test.ts`): internal-ошибка → fallback-текст с экранированной точкой проходит `assertMarkdownV2Safe`; ветка `validation` с issues, содержащими точки/скобки → field и message экранированы
- [ ] Task: Реализовать экранирование в `packages/core/src/ui/bot/bot-ui-story.ts`: fallback-текст (`обратитесь к администратору\\.`), ветка `validation` — `escapeMarkdown` для field/message
- [ ] Task: Написать падающие тесты `invite.story`: `inviteText` с точками и спецсимволами → текст в `#handleInviteEvent` и `#handleInvite` экранирован (по образцу `#handleWhy`)
- [ ] Task: Реализовать экранирование `inviteText` в обоих методах `invite.story.ts`
- [ ] Task: Conductor - User Manual Verification 'MarkdownV2-мины' (Protocol in workflow.md)

## Фаза 2: Graceful stale-ответы (домен + UI)

- [ ] Task: Написать падающие тесты агрегата (`packages/questionnaire`): выбор несуществующего кода → ответ `stale_answer` (reason `stale_button`), состояние анкеты не меняется; «Далее» с пустым драфтом multiple → `stale_answer` (`empty_selection`); все валидные флоу работают как раньше
- [ ] Task: Тип `stale_answer` в `types.ts` (`questionnaireId`, `question`, `selectedAnswers`, `progress`, `cancelWarning`, `reason: 'stale_button' | 'empty_selection'`); реализовать в `a-root.ts`: `#submitCurrentQuestion` (ValiError → `stale_answer` вместо `throwInternal`) и `#toggleDraftAnswer` (валидация кода до записи в драфт)
- [ ] Task: Написать падающие тесты render/story: `stale_answer` → перерисовка актуального вопроса с пояснением по reason, `captureInput` сохраняется; `logger.warn` с questionCode'ами зафиксирован
- [ ] Task: Реализовать рендер `stale_answer` в `render.ts` + логирование `warn` в `fill.story.ts`
- [ ] Task: Conductor - User Manual Verification 'Graceful stale-ответы' (Protocol in workflow.md)

## Фаза 3: Движок — condition any-of, инвариант, честный прогресс

- [ ] Task: Написать падающие тесты `getNextQuestion`: condition на multiple-вопрос матчит any-of (`'mon,wed'` против `answerCodes: ['mon']`)
- [ ] Task: Реализовать any-of (split по запятой + `some`) в `getNextQuestion`
- [ ] Task: Написать падающие тесты `validate()`: condition, ссылающийся на вопрос «вперёд» по пулу → ошибка валидации пула
- [ ] Task: Реализовать инвариант «условие только назад» в `validate()`
- [ ] Task: Написать падающие тесты `getProgress(questionCode, answers)`: index/total по активному маршруту (реальный пул: base-ветка — 10, intensive-ветка — 9 вместо 11)
- [ ] Task: Реализовать динамический маршрут в `getProgress` + передать `state.answers` из агрегата (`#progress`)
- [ ] Task: Conductor - User Manual Verification 'Движок' (Protocol in workflow.md)

## Фаза 4: Гонка сессии при двойном /start

- [ ] Task: Исследование: воспроизвести интерливинг (двойной `/start` + answer-callback в одной пачке апдейтов), задокументировать механику перезаписи `session.lastBotMessage` прямо в этом плане
- [ ] Task: Написать падающие тесты guard: `editMessage` не применяется к сообщению, не относящемуся к активному флоу; fallback на sendMessage сохраняется
- [ ] Task: Реализовать guard (transport/сессии — детальный дизайн по итогам исследования, зафиксировать в плане перед кодом)
- [ ] Task: Conductor - User Manual Verification 'Гонка сессии' (Protocol in workflow.md)

## Фаза 5: Документация, техдолг, финал

- [ ] Task: `TODO.md` — запись в техдолг: optional-вопросы (флаг в схеме `question.ts`, skip-семантика `answerCode='skipped'`, кнопка «⏭️ Пропустить» сразу для single/text, «Далее» с пустым драфтом = skip для multiple, условия могут ссылаться на `skipped`)
- [ ] Task: Обновить `apps/u7-bot/src/controllers/questionnaire/ui-spec.md`: новый тип ответа `stale_answer`, поведение при устаревшей клавиатуре, прогресс «Вопрос N из M» по маршруту
- [ ] Task: Финальная проверка `bun run check` по всему монорепо
- [ ] Task: Conductor - User Manual Verification 'Документация, техдолг, финал' (Protocol in workflow.md)
