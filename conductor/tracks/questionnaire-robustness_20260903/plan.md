# План реализации — Трек: Устойчивость анкеты (questionnaire-robustness_20260903)

> Методология: workflow.md (TDD Red → Green → Refactor, `bun run check` перед коммитом, git notes, контрольные точки по фазам).

## Фаза 1: MarkdownV2-мины (P0-B + inviteText) [checkpoint: a70e25a]

- [x] Task: Написать падающие тесты `handleError` (`apps/u7-bot/src/core/u7-bot-ui-story.test.ts`): internal-ошибка → fallback-текст с экранированной точкой проходит `assertMarkdownV2Safe`; ветка `validation` с issues, содержащими точки/скобки → field и message экранированы [bedac9b]
- [x] Task: Реализовать экранирование в `packages/core/src/ui/bot/bot-ui-story.ts`: fallback-текст (`обратитесь к администратору\\.`), ветка `validation` — `escapeMarkdown` для field/message [bedac9b]
- [x] Task: Написать падающие тесты `invite.story`: `inviteText` с точками и спецсимволами → текст в `#handleInviteEvent` и `#handleInvite` экранирован (по образцу `#handleWhy`) [0fdee05]
- [x] Task: Реализовать экранирование `inviteText` в обоих методах `invite.story.ts` [0fdee05]
- [x] Task: Conductor - User Manual Verification 'MarkdownV2-мины' (Protocol in workflow.md)

## Фаза 2: Graceful stale-ответы (домен + UI)

- [x] Task: Написать падающие тесты агрегата (`packages/questionnaire`): выбор несуществующего кода → ответ `stale_answer` (reason `stale_button`), состояние анкеты не меняется; «Далее» с пустым драфтом multiple → `stale_answer` (`empty_selection`); все валидные флоу работают как раньше [1679feb]
- [x] Task: Тип `stale_answer` в `types.ts` (`questionnaireId`, `question`, `selectedAnswers`, `progress`, `cancelWarning`, `reason: 'stale_button' | 'empty_selection'`); реализовать в `a-root.ts`: `#submitCurrentQuestion` (ValiError → `stale_answer` вместо `throwInternal`) и `#toggleDraftAnswer` (валидация кода до записи в драфт) [1679feb]
- [x] Task: Написать падающие тесты render/story: `stale_answer` → перерисовка актуального вопроса с пояснением по reason, `captureInput` сохраняется; `logger.warn` с questionCode'ами зафиксирован [b880713]
- [x] Task: Реализовать рендер `stale_answer` в `render.ts` + логирование `warn` в `fill.story.ts` [b880713]
- [x] Task: Conductor - User Manual Verification 'Graceful stale-ответы' (Protocol in workflow.md)

## Фаза 3: Движок — condition any-of, инвариант, честный прогресс

- [x] Task: Написать падающие тесты `getNextQuestion`: condition на multiple-вопрос матчит any-of (`'mon,wed'` против `answerCodes: ['mon']`) [8192615]
- [x] Task: Реализовать any-of (split по запятой + `some`) в `getNextQuestion` [8192615]
- [x] Task: Написать падающие тесты `validate()`: condition, ссылающийся на вопрос «вперёд» по пулу → ошибка валидации пула [ffb4b83]
- [x] Task: Реализовать инвариант «условие только назад» в `validate()` [ffb4b83]
- [x] Task: Написать падающие тесты `getProgress(questionCode, answers)`: index/total по активному маршруту (реальный пул: base-ветка — 10, intensive-ветка — 9 вместо 11) [173c847]
- [x] Task: Реализовать динамический маршрут в `getProgress` + передать `state.answers` из агрегата (`#progress`) [173c847]
- [x] Task: Conductor - User Manual Verification 'Движок' (Protocol in workflow.md)

## Фаза 4: Гонка сессии при двойном /start

### Исследование и дизайн guard — перенесены в отдельный документ

Исследование механики гонки сессии, сценарии интерливинга и полный дизайн guard'а
вынесены в самодостаточный документ концепции (родился из этой фазы):
**[`conductor/bot-ui-session-architecture.md`](../../bot-ui-session-architecture.md)** —
глоссарий, as-is архитектура, проблемы П1–П5, сценарии гонок S1–S3, дизайн guard (§5),
карта кода (§6), открытые вопросы концепции (§7).

Резюме для фазы: `lastBotMessage` «ничейный» — не помечен флоу-владельцем, edit-рендер
анкеты безусловно берёт его `messageId` → после двойного `/start` welcome затирается
вопросом. Guard: поле `flowPath` в `lastBotMessage` + проверка принадлежности перед
`editMessage` + fallback на `sendMessage` (детали — §5 документа концепции).

Параллельный треку процесс: концепция bot-ui прорабатывается в отдельной сессии по
этому же документу. Guard — минимальное точечное решение (лечит П1, не П2–П5),
самодостаточен и не блокирует будущие концептуальные решения.

> ### ⏭️ Решение пользователя (2026-09-03): реализация Фазы 4 перенесена в отдельный трек
>
> Guard editMessage будет решаться в рамках **нового трека**, который родится из
> проработки концепции bot-ui (`conductor/bot-ui-session-architecture.md`: as-is,
> проблемы П1–П5, сценарии гонок S1–S3, дизайн guard §5, карта кода §6).
> В этом треке выполнено только **исследование** — оно переносится в новый трек
> как готовая основа. Ручная верификация фазы не проводится (нечего верифицировать).

- [x] Task: Исследование: воспроизвести интерливинг (двойной `/start` + answer-callback в одной пачке апдейтов), задокументировать механику перезаписи `session.lastBotMessage` [86f0cf3]
- [x] Task: Написать падающие тесты guard: `editMessage` не применяется к сообщению, не относящемуся к активному флоу; fallback на sendMessage сохраняется — ⏭️ ПРОПУСК по решению пользователя (2026-09-03): перенесено в новый трек по концепции bot-ui
- [x] Task: Реализовать guard по дизайну из `conductor/bot-ui-session-architecture.md` §5 (flowPath в `lastBotMessage`, проверка принадлежности перед editMessage, fallback на sendMessage) — ⏭️ ПРОПУСК по решению пользователя (2026-09-03): перенесено в новый трек по концепции bot-ui
- [x] Task: Conductor - User Manual Verification 'Гонка сессии' (Protocol in workflow.md) — ⏭️ ПРОПУСК по решению пользователя (2026-09-03): перенесено в новый трек вместе с реализацией

## Фаза 5: Документация, техдолг, финал

- [ ] Task: `TODO.md` — запись в техдолг: optional-вопросы (флаг в схеме `question.ts`, skip-семантика `answerCode='skipped'`, кнопка «⏭️ Пропустить» сразу для single/text, «Далее» с пустым драфтом = skip для multiple, условия могут ссылаться на `skipped`)
- [ ] Task: Обновить `apps/u7-bot/src/controllers/questionnaire/ui-spec.md`: новый тип ответа `stale_answer`, поведение при устаревшей клавиатуре, прогресс «Вопрос N из M» по маршруту
- [ ] Task: Финальная проверка `bun run check` по всему монорепо
- [ ] Task: Conductor - User Manual Verification 'Документация, техдолг, финал' (Protocol in workflow.md)
