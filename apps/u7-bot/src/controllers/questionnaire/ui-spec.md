# Спецификация экранов Questionnaire (UI Spec)

Документ описывает экраны Telegram-бота модуля Questionnaire: их содержимое, кнопки, условия видимости и доменную логику.
Служит **отправной точкой для разработки**.

Условные обозначения:
- ✅ реализовано
- ❌ не реализовано
- 📋 в бэклоге / запланировано в треке

---

## Путь пользователя

Два варианта входа в анкету:
- **Через приглашение (sendLikertInvite):** модуль-владелец вызывает `facade.sendLikertInvite(actorId, pool, ownerInfo)` → S01 → пользователь принимает → S02.
- **Сразу (startStandard):** модуль-владелец вызывает `facade.startStandard(actorId, pool, ownerInfo)` → пользователь получает сразу первый вопрос (S02), без приглашения.

---

## S01 — Приглашение (📋 invite)

**Как попасть:** инициативно от системы через `sendInvite()`.
**Кому:** пользователю, которому предназначена анкета.
**Рендеринг:** InviteStory → подписка `questionnaire:invite` → `#handleInviteEvent`
**Данные:** `InviteResponse` содержит `inviteText?`, `whyText?`, `questionnaireId`.

**Содержание:**
```
📋 *Анкета*

{inviteText или дефолт «Заполните, пожалуйста, анкету.»}

Для отмены в любой момент нажмите /cancel.
```

**Кнопки:**

| Текст | Код | Действие | Статус |
|-------|-----|----------|--------|
| `▶️ Начать заполнение` | `questionnaire:invite:start:{qId}` | → S02 (captureInput → fill) | 📋 |
| `❔ Зачем это нужно?` | `questionnaire:invite:why:{qId}` | sendMessage с whyText | 📋 |
| `⏭️ Пропустить` | `questionnaire:invite:decline:{qId}` | → S06a (confirm) | 📋 |

> **«Зачем это нужно?»** — только если `whyText` есть в pool.
>
> Логика:
> 1. sendMessage: `whyText` + кнопка `✅ Хорошо`
> 2. «Хорошо» → sendMessage: новый S01 с полным набором кнопок
> **«Пропустить»** — переходит к подтверждению (S06a).

---

## S02a — Одиночный выбор (🔘 single choice) ✅

**Как попасть:** S01 (Начать) → S02a, или предыдущий вопрос → S02a, или сразу от `start()` (без S01).
**Кому:** пользователь в процессе заполнения.
**Рендеринг:** FillStory → UC `start-by-invite` / `handle-action` → `renderActionResponse` (stories/render.ts)

**Содержание:**
```
*Вопрос N из M*

*{текст вопроса}*

1. ( ) {вариант 1}
2. ( ) {вариант 2}
3. ( ) {вариант 3}
```

> Шапка «Вопрос N из M» — прогресс по **активному маршруту**: M — число вопросов активной ветки с учётом условий ветвления по уже данным ответам, а не весь пул (`getProgress(questionCode, answers)`; в реальном пуле из 11 вопросов base-ветка — 10, intensive-ветка — 9). Для первого вопроса анкеты внизу — подсказка «В любой момент можно нажать /cancel — вернёшься в главное меню.»

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `1` | `questionnaire:fill:answer:{qId}:{aCode1}` | ✅ |
| `2` | `questionnaire:fill:answer:{qId}:{aCode2}` | ✅ |
| `3` | `questionnaire:fill:answer:{qId}:{aCode3}` | ✅ |

**Логика (UX, spec FR-1) ✅:** клик → UC `handle-action({type:'callback'})` → комбинированная команда:
текущее сообщение **редактируется** (маркер `(x)` у выбранного варианта, **клавиатура удалена**),
следующий вопрос отправляется **новым сообщением** (история «вопрос → выбранный ответ»). 
Автопереход: кнопка «Далее» не появляется. Fallback: без `session.lastBotMessage`
(проактивный старт/resume) — только sendMessage.
Клик по чужому коду ответа (устаревшая клавиатура) → **S10** (`stale_button`), состояние анкеты не меняется.

---

## S02b — Множественный выбор (☑️ multiple choice) ✅

**Как попасть:** аналогично S02a.

**Содержание:**
```
*Вопрос N из M*

*{текст вопроса}*

1. [ ] {вариант 1}
2. [x] {вариант 2}
3. [ ] {вариант 3}
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `1` | `questionnaire:fill:answer:{qId}:{aCode1}` | ✅ |
| `2` | `questionnaire:fill:answer:{qId}:{aCode2}` | ✅ |
| `3` | `questionnaire:fill:answer:{qId}:{aCode3}` | ✅ |
| `Далее -->` | `questionnaire:fill:next:{qId}:{qCode}` | ✅ |

**Логика (UX, spec FR-2) ✅:**
- клик (тоггл) → **editMessage того же сообщения** (маркеры обновляются, клавиатура жива); fallback — sendMessage без `lastBotMessage`; чужой код → **S10** (`stale_button`), в `draftAnswers` не попадает;
- «Далее» рендерится **только при ≥1 выбранном варианте** (UC не присылает `nextButton` при пустом выборе);
- «Далее» → **editMessage текущего вопроса** (финальные маркеры `[x]`, **клавиатура удалена**) + **sendMessage следующего вопроса** / completed;
- «Далее» с пустым драфтом (если всё же нажата) → **S10** (`empty_selection`), не CRITICAL.

---

## S03 — Текстовый вопрос (✏️ text)

**Как попасть:** аналогично S02a.

**Содержание:**
```
*Вопрос N из M*

*{текст вопроса}*

Введите ваш ответ текстом...
```

**Кнопки:** отсутствуют

**Логика ✅:** текст → `handle-action({type:'text'})` → `answerText` → дальше (комбинированная
команда: предыдущий вопрос editMessage без клавиатуры + следующий вопрос новым сообщением, spec FR-2).

---

## S04 — Завершение (✅ completed) ✅

**Как попасть:** после последнего ответа.
**Данные:** `completionText` из pool (или дефолт «Спасибо! Твоя анкета принята.»).

**Содержание:**
```
✅ *Анкета завершена*

{completionText}
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `↩️ Главное меню` | `app:main-menu` | ✅ |

**Логика ✅:** `releaseInput`. При ответе из активного флоу (есть `lastBotMessage` и `previousQuestion`)
предыдущий вопрос сначала **редактируется** (финальные маркеры, без клавиатуры),
completed-экран отправляется **новым сообщением** (spec FR-1/FR-2).

---

## S05 — Отмена (🚫 cancelled)

### S05a — Подтверждение отмены

**Как попасть:** `/cancel` на любом экране анкеты (S02/S03).
**Рендеринг:** FillStory.handleCancel → `confirm()` из BotUserStory

**Содержание:**
```
Вы уверены, что хотите прервать анкету?

{cancelWarning}
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `✅ Да, прервать` | `questionnaire:fill:cancel-confirm:{qId}` | 📋 |
| `❌ Нет, продолжить` | `questionnaire:fill:current` → возврат к вопросу | 📋 |

### S05b — Отменено

**Как попасть:** «Да, прервать» на S05a.
**Рендеринг:** FillStory → UC `abandon({questionnaireId})`

**Содержание:**
```
«Анкета прервана.»
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `↩️ Главное меню` | `app:main-menu` | 📋 |

**Логика:** статус → `abandoned`, `releaseInput`.

---

## S06 — Отказ от приглашения (⏭️ declined)

### S06a — Подтверждение отказа

**Как попасть:** кнопка «⏭️ Пропустить» на S01.
**Рендеринг:** InviteStory → `confirm()` из BotUserStory

**Содержание:**
```
Вы уверены, что хотите пропустить анкету?

{cancelWarning}
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `✅ Да, пропустить` | `questionnaire:invite:decline-confirm:{qId}` | 📋 |
| `❌ Нет, вернуться` | `questionnaire:invite:invite:{qId}` → S01 | 📋 |

### S06b — Отказ подтверждён

**Как попасть:** «Да, пропустить» на S06a.
**Рендеринг:** InviteStory → UC `decline-invite({questionnaireId})`

**Содержание:**
```
«Анкета пропущена.»
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `↩️ Главное меню` | `app:main-menu` | 📋 |

**Логика:** статус → `abandoned`.

---

## S07 — Предупреждение о закрытии (⏳ warning) ✅

**Как попасть:** проактивно от системы: планировщик `SweepAbandonedJob` (анкета `in_progress` без активности 6 часов — `WARN_AFTER_HOURS`) публикует `questionnaire:abandon-warning`.
**Кому:** респонденту анкеты (telegramId обогащается в job через user-фасад).
**Рендеринг:** FillStory → подписка `questionnaire:abandon-warning` → `#handleWarningEvent`

**Содержание:**
```
⏳ *Анкета приостановлена*

Мы заметили, что ты давно не заполнял анкету. Скоро она будет закрыта.

Продолжить?
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `▶️ Продолжить` | `questionnaire:fill:resume:{courseId}` (только если ownerInfo.courseId задан), **takeover: true** | ✅ |
| `⏭️ Прервать` | `questionnaire:fill:cancel-confirm:{qId}` → S05a | ✅ |

**Логика:** при активности респондента (ответ на вопрос) флаги `warnedAt` и `continueInvitedAt`
сбрасываются — таймер простоя не сдвигается метками ступеней (`markWarned`/`markContinueInvited`
обходят `safeUpdate`). Takeover-кнопка перехватывает ввод при активном чужом действии (spec FR-5).

---

## S09 — Приглашение продолжить (📋 continue-invite) ✅

**Как попасть:** проактивно от системы: `SweepAbandonedJob` (анкета `in_progress` без активности 3 часа — `INVITE_AFTER_HOURS`, интервал запуска 3ч) публикует `questionnaire:continue-invite`.
**Кому:** респонденту анкеты.
**Рендеринг:** FillStory → подписка `questionnaire:continue-invite` → `#handleContinueInviteEvent`

**Содержание:**
```
📋 *Анкета*

Вы начали заполнять анкету — продолжим?
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `▶️ Продолжить анкету` | `questionnaire:fill:resume:{courseId}` (только если ownerInfo.courseId задан), **takeover: true** | ✅ |
| `⏭️ Прервать` | `questionnaire:fill:cancel-confirm:{qId}` → S05a | ✅ |

**Логика:** первая ступень цепочки брошенных анкет (3ч → 6ч → 9ч). Отправляется **один раз**
(флаг `continueInvitedAt`); при возобновлении заполнения цепочка сбрасывается.

**Takeover-предупреждение (spec FR-5, транспорт) ✅:** если у пользователя есть активное действие
(`session.activeHandler != null`), вниз текста сообщения с takeover-кнопками транспорт добавляет
строку «⚠️ Нажатие на кнопку приведёт к окончанию вашего текущего действия.»; без активного
действия строка не добавляется. Нажатие takeover-кнопки НЕ блокируется alert'ом «Сначала
завершите текущее действие» — захват ввода перезаписывается fill-стори (маркер-префикс в
callback_data кодирует/снимает uiApp, транспорт и стори работают с нативным кодом).

---

## S08 — Закрыто по таймауту (⏱ timeout-abandon) ✅

**Как попасть:** проактивно от системы: `SweepAbandonedJob` закрывает анкету после **9 часов** неактивности (`ABANDON_AFTER_HOURS`, до трека было 8ч) и публикует `questionnaire:abandon` с `reason='timeout'`.
**Кому:** респонденту анкеты.
**Рендеринг:** FillStory → подписка `questionnaire:abandon` → `#handleAbandonEvent` → `proactiveSender.notify` (без кнопок).

**Содержание:**
```
⏱ Анкета была закрыта из-за длительной неактивности.
```

**Логика:** событие обрабатывается ТОЛЬКО с `reason='timeout'` — при ручном прерывании (/cancel) дубликат не отправляется (ответ UC «Анкета прервана» пользователь уже получил). Без `telegramId` уведомление не отправляется.

---

## S10 — Неактуальный ответ (⚠️ stale_answer) ✅

**Как попасть:** клик по кнопке устаревшей клавиатуры (после двойного `/start` гонка сессий оставила старые кнопки: чужой `aCode` не принадлежит текущему вопросу) **или** «Далее» без единого выбора на multiple-вопросе.
**Рендеринг:** FillStory → UC `handle-action` → `renderActionResponse` (ветка `stale_answer`)
**Данные:** `StaleAnswerResponse` — `questionnaireId`, `question` (актуальный), `selectedAnswers`, `progress`, `cancelWarning`, `reason`.

**Содержание** (`reason='stale_button'`):
```
⚠️ Эта кнопка относится к предыдущему вопросу. Вот актуальный:

*Вопрос N из M*

*{текст актуального вопроса}*
… (варианты с маркерами актуального драфта)
```

**Содержание** (`reason='empty_selection'`):
```
⚠️ Сначала выбери хотя бы один вариант.

*Вопрос N из M*

*{текст вопроса}*
…
```

**Кнопки:** клавиатура актуального вопроса (S02a/S02b/S03) — жива.

**Логика ✅ (трек questionnaire-robustness_20260903, spec FR-1):**
- состояние анкеты **не меняется**: чужой код не попадает в `draftAnswers`/`answers`;
- перерисовка актуального вопроса с пояснением по reason: editMessage при активном флоу (`lastBotMessage`), иначе sendMessage;
- `captureInput` сохраняется — флоу продолжается, `releaseInput` **не** выполняется;
- наблюдаемость: `logger.warn('fill-story', 'Неактуальный ответ в анкете', {questionnaireId, pressed, questionCode, reason})` — warn, не error: не создаёт CRITICAL в Logger Bot.

---

## Стори контроллера — обработчики

Контроллер состоит из двух стори (общий рендер — `stories/render.ts`):

### InviteStory (`invite`) — приглашение и отказ

| Событие / код | UC | Действие |
|---|---|---|
| `invite:start:{qId}` | `start-by-invite` | Render → `captureInput: questionnaire/fill` (управление переходит fill-стори) |
| `invite:why:{qId}` | `get-current` | sendMessage whyText + «Хорошо» → `invite:invite:{qId}` |
| `invite:invite:{qId}` | `get-current` | sendMessage: новый S01 из InviteResponse |
| `invite:decline:{qId}` | — | `confirm('decline', qId, ...)` → S06a |
| `invite:decline-confirm:{qId}` | `decline-invite` | Render → S06b |
| `questionnaire:invite` (подписка) | — | sendMessage S01 |

### FillStory (`fill`) — заполнение и жизненный цикл

| Событие / код | UC | Действие |
|---|---|---|
| `fill:current` | `get-current` | Возврат к текущему вопросу (S02a/S02b/S03) |
| `fill:answer:{qId}:{aCode}` | `handle-action({type:'callback'})` | Render |
| `fill:next:{qId}:{qCode}` | `handle-action({type:'callback'})` | Render |
| text message | `handle-action({type:'text'})` | Render |
| `fill:cancel-confirm:{qId}` | `abandon` | Render → S05b |
| `fill:resume:{courseId}` | `get-questionnaires-by-user` + `get-current` | Render → `captureInput: questionnaire/fill` |
| `/cancel` | `get-current` (warning) | `confirm('cancel', qId, ...)` → S05a |
| `questionnaire:start` (подписка) | — | Render S02–S04 + `captureInput: questionnaire/fill` |
| `questionnaire:continue-invite` (подписка) | — (SweepAbandonedJob, 3ч) | sendMessage S09: Продолжить анкету (takeover, если courseId) / Прервать |
| `questionnaire:abandon-warning` (подписка) | — (SweepAbandonedJob, 6ч) | sendMessage S07: Продолжить (takeover, если courseId) / Прервать |
| `questionnaire:abandon` (подписка, `reason='timeout'`) | — (SweepAbandonedJob, 9ч) | notify S08; без reason — ничего (без дубля) |

---

## Форматирование MarkdownV2

- Шапка каждого вопроса: `*Вопрос N из M*` — прогресс по **активному маршруту** (`QuestionnaireEngine.getProgress(questionCode, answers)`; условия ветвления применяются к уже данным ответам)
- Вопросы: `*{текст}*` (жирный)
- Single choice: `( )` / `(x)`; Multiple choice: `[ ]` / `[x]`
- Подсказка «В любой момент можно нажать /cancel…» — только под первым вопросом анкеты (`previousQuestion === undefined`)
- Все тексты — `escapeMarkdown()` (включая `inviteText`, `whyText`, fallback-тексты ошибок и сообщения валидации); номера вариантов экранируются (`1\.`)
