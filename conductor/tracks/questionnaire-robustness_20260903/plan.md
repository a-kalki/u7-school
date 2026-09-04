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

### Исследование: механика перезаписи `session.lastBotMessage`

**Архитектура приёма апдейтов** (`apps/u7-bot/src/bot.ts`, `main.ts`):

- Grammy-session хранит сессии в общем `sessionMap` (`Map<number, SessionData>`) — все обработчики мутируют один и тот же объект сессии пользователя (ссылка из Map).
- `botMode` — `polling` (по умолчанию) или `webhook`. При polling Grammy обрабатывает апдейты строго последовательно. При webhook HTTP-запросы обрабатываются параллельно (`sequentialize` не подключён) — двойной `/start` и callback интерливятся уже на уровне апдейтов.
- Проактивные `send()`/`notify()` сериализуются per-chat-очередью `#enqueue`, но обработчики апдейтов (`handleStart`/`handleCallback`/`handleMessage`) вызывают `execute()` **напрямую, минуя очередь** → интерливинг «проактивный send × апдейт пользователя» возможен в обоих режимах.

**Перезапись `lastBotMessage`** — всё в `BotTransport.execute()` (`bot-transport.ts`):

1. шаг 1 `editMessage`: редактирует сообщение по `edit.messageId`, обновляет текст `lastBotMessage` (если тот указывает на него);
2. шаг 1.5: снимает клавиатуру у предыдущего `lastBotMessage` (только если в команде нет `editMessage`);
3. шаг 2 `sendMessage`: `lastBotMessage` = новое сообщение.

**Воспроизведение интерливинга (пачка `[/start, /start, callback(Q3-кнопка)]`):**

1. `/start` №1 и №2: `activeHandler = null`, welcome отправлен; при параллельных `execute` оба читают один `lastBotMessage` → один из welcome-ов остаётся с живой клавиатурой (lost update) — «старые кнопки».
2. Callback по кнопке старого вопроса: `uiApp.handleCallback` при `activeHandler == null` пропускает проверку «чужой контроллер» → `fill.story` → UC → `renderActionResponse(session, editPrev: true)` → `editMessage.messageId = lastBotMessage.messageId` — это **welcome-сообщение**, а не экран анкеты.
3. `execute()` затирает welcome вопросом анкеты: главное меню потеряно, а реальный экран флоу остаётся в истории. Дальнейшие ответы продолжают редактировать «чужое» сообщение.

**Корень проблемы:** `lastBotMessage` «ничейный» — не помечен флоу-владельцем, а `editPrev`-рендер безусловно берёт его `messageId`.

### Дизайн guard (предлагается на согласование)

Минимальное изменение, без смены архитектуры:

- `SessionData.lastBotMessage` получает опциональное поле `flowPath?: string` — путь флоу-владельца в формате `activeHandler.path` (`controller/story`). Сессии в памяти — миграций нет; старые записи без поля трактуются как «ничейные».
- `BotTransport.execute(session, tgId, command, flowPath?)`: обработчики апдейтов передают `session.activeHandler?.path` ПОСЛЕ обработки uiApp (`#applyCapturedInput` уже обновил activeHandler — captureInput нового флоу учтён); `handleStart`/`handleHelp` — `undefined` (welcome/помощь — ничьи); проактивный `send()` — `undefined`.
- Запись `flowPath` в `lastBotMessage` при `sendMessage` (шаг 2) и сохранение при `editMessage` (шаг 1).
- Guard перед шагом 1: `editMessage` применяется только если `lastBotMessage.messageId === edit.messageId` && `lastBotMessage.flowPath !== undefined` && `lastBotMessage.flowPath === session.activeHandler?.path`. Иначе — коллизия:
  - если в команде уже есть `sendMessage`/`sendMessages` — `editMessage` просто дропается (новый экран уйдёт отправкой, шаг 1.5 корректно снимет клавиатуру у прошлого сообщения);
  - если `editMessage` — единственный контент — заменяется на `sendMessage` того же текста/клавиатуры (fallback-отправка).
- **Известный trade-off:** сообщение, созданное проактивным `send()` (приглашение анкеты), не помечено владельцем (transport не знает имя контроллера для `captureInput.path`) → первый ответ после проактивного старта уйдёт `sendMessage` вместо edit; все последующие — edit'ом. Деградация косметическая, только UX-шум одного дубля вопроса.

- [~] Task: Исследование: воспроизвести интерливинг (двойной `/start` + answer-callback в одной пачке апдейтов), задокументировать механику перезаписи `session.lastBotMessage` прямо в этом плане
- [ ] Task: Написать падающие тесты guard: `editMessage` не применяется к сообщению, не относящемуся к активному флоу; fallback на sendMessage сохраняется
- [ ] Task: Реализовать guard (transport/сессии — детальный дизайн по итогам исследования, зафиксировать в плане перед кодом)
- [ ] Task: Conductor - User Manual Verification 'Гонка сессии' (Protocol in workflow.md)

## Фаза 5: Документация, техдолг, финал

- [ ] Task: `TODO.md` — запись в техдолг: optional-вопросы (флаг в схеме `question.ts`, skip-семантика `answerCode='skipped'`, кнопка «⏭️ Пропустить» сразу для single/text, «Далее» с пустым драфтом = skip для multiple, условия могут ссылаться на `skipped`)
- [ ] Task: Обновить `apps/u7-bot/src/controllers/questionnaire/ui-spec.md`: новый тип ответа `stale_answer`, поведение при устаревшей клавиатуре, прогресс «Вопрос N из M» по маршруту
- [ ] Task: Финальная проверка `bun run check` по всему монорепо
- [ ] Task: Conductor - User Manual Verification 'Документация, техдолг, финал' (Protocol in workflow.md)
