# Итоговый отчёт — Трек: Устойчивость анкеты (questionnaire-robustness_20260903)

## Цель

Анкета не должна ломаться на граничных сценариях: неактуальные ответы
(устаревшая клавиатура, пустой драфт multiple) возвращают `stale_answer`
вместо внутренних ошибок; MarkdownV2-мины (точки/скобки в динамических
текстах) экранируются на границе рендера; condition в движке матчится any-of
и ссылается только назад; прогресс «Вопрос N из M» считается по активному
маршруту, а не по всему пулу. Гонка сессии при двойном `/start` исследована
и вынесена в отдельную концепцию.

## Выполненные задачи

### Фаза 1 — MarkdownV2-мины
- `handleError` в `packages/core` (`bot-ui-story.ts`): fallback-текст с
  экранированной точкой и validation-ветка (field/message) проходят
  `assertMarkdownV2Safe`.
- `invite.story.ts`: `inviteText` экранируется в `#handleInviteEvent` и
  `#handleInvite` (по образцу `#handleWhy`).
- Follow-up дебрифа №28: `renderActionResponse` (ветка invited) тоже
  экранирует `inviteText` (`escapeMarkdown`).

### Фаза 2 — Graceful stale-ответы
- Новый тип ответа `stale_answer` (`types.ts`): актуальный вопрос,
  прогресс, cancelWarning, `reason: 'stale_button' | 'empty_selection'`.
- `a-root.ts`: `#submitCurrentQuestion` — `ValiError` (пустой драфт multiple)
  → `stale_answer (empty_selection)`; `#toggleDraftAnswer` — проверка кода до
  записи в драфт → `stale_answer (stale_button)`.
- Follow-up дебрифа №28: чужая кнопка «Далее», next на non-multiple, callback
  на text-вопросе — тоже `stale_answer` вместо `bad_request`.
- `render.ts`: перерисовка актуального вопроса с пояснением по reason,
  `captureInput` сохраняется; `fill.story.ts` — `logger.warn` с questionCode'ами.

### Фаза 3 — Движок: condition, инвариант, честный прогресс
- `getNextQuestion`: condition на multiple-вопрос матчится any-of
  (split по запятой + `some`).
- `validate()`: инвариант «условие только назад» — ссылка на вопрос вперёд
  по пулу → ошибка валидации пула.
- `getProgress(questionCode, answers)`: index/total по активному маршруту
  (base-ветка — 10, intensive — 9 вместо 11); агрегат передаёт
  `state.answers` (`#progress`).

### Фаза 4 — Гонка сессии при двойном /start (только исследование)
- Механика интерливинга задокументирована в самодостаточном документе
  [`conductor/bot-ui-session-architecture.md`](../../roadmap/bot-ui-session-architecture.md):
  проблемы П1–П5, сценарии гонок S1–S3, дизайн guard (§5), карта кода (§6).
- Реализация guard по решению пользователя перенесена в будущий трек,
  рождающийся из проработки концепции bot-ui.

### Фаза 5 — Документация, техдолг, финал
- `TODO.md`: техдолг optional-вопросов (флаг в схеме, skip-семантика,
  кнопка «⏭️ Пропустить», условия со ссылкой на `skipped`).
- `apps/u7-bot/src/controllers/questionnaire/ui-spec.md`: тип `stale_answer`
  (S10), поведение при устаревшей клавиатуре, прогресс по маршруту.
- Финальный `bun run check` — 1931 тест / 0 fail, biome + tsc чисто.

## Созданные файлы
- `packages/questionnaire/src/domain/questionnaire/standard/stale-answer.test.ts`
- `apps/u7-bot/src/controllers/questionnaire/stories/fill.story.stale.test.ts`
- `conductor/bot-ui-session-architecture.md`

## Изменённые файлы (ключевые)
- `packages/questionnaire`: `types.ts`, `a-root.ts`, `questionnaire-engine.ts` (+ тесты)
- `packages/core`: `ui/bot/bot-ui-story.ts` (+ тест)
- `apps/u7-bot`: `controllers/questionnaire/stories/` — `fill.story.ts`,
  `invite.story.ts`, `render.ts` (+ тесты); `ui-spec.md`
- Документация: `TODO.md`, `conductor/index.md`, `data/debrief/registry.md` (запись №28)

## Архитектурные решения
1. **stale_answer вместо ошибок**: устаревшая клавиатура — нормальный сценарий,
   а не сбой; агрегат возвращает типизированный ответ с причиной и актуальным
   вопросом, UI перерисовывает без потери ввода.
2. **Экранирование на границе рендера**: отправители шлют plain-текст,
   `escapeMarkdown` — в сторях/рендерах; тесты держат `assertMarkdownV2Safe`
   на всех динамических текстах.
3. **Инварианты движка в `validate()`**: битые условия ловятся на входе,
   а не в рантайме флоу.
4. **Честный прогресс по маршруту**: total зависит от ответов (условия),
   а не от размера пула.
5. **Отложенная гонка сессии**: guard `editMessage` (flowPath в
   `lastBotMessage`) сознательно вынесен из точечного фикса в концептуальную
   проработку bot-ui.

## Отклонения от плана
- Фаза 4: тесты/реализация guard пропущены по решению пользователя
  (2026-09-03) — перенесены в будущий трек по концепции bot-ui; в треке
  выполнено только исследование.
- Follow-up-правки после дебрифа №28 (ветки next/text, экранирование
  `renderActionResponse`) не были задачами плана — добавлены как follow-up
  записи в Фазы 1–2.
- Ручная верификация Фазы 5 закрыта по явному указанию пользователя
  (doc-only фаза, автотесты зелёные).

## Что дальше
- Новый трек по guard'у сессии — из проработки
  [`bot-ui-session-architecture.md`](../../roadmap/bot-ui-session-architecture.md).
- Техдолг optional-вопросов — запись в `TODO.md`.
