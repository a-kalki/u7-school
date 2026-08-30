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
**Рендеринг:** FillStory → подписка `questionnaire:invite` → `#handleInviteEvent`
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
| `▶️ Начать заполнение` | `questionnaire:fill:start:{qId}` | → S02 | 📋 |
| `❔ Зачем это нужно?` | `questionnaire:fill:why:{qId}` | sendMessage с whyText | 📋 |
| `⏭️ Пропустить` | `questionnaire:fill:decline:{qId}` | → S06a (confirm) | 📋 |

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
**Рендеринг:** FillStory → UC `start-by-invite` / `handle-action` → render

**Содержание:**
```
*{текст вопроса}*

1. ( ) {вариант 1}
2. ( ) {вариант 2}
3. ( ) {вариант 3}
```

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

---

## S02b — Множественный выбор (☑️ multiple choice) ✅

**Как попасть:** аналогично S02a.

**Содержание:**
```
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
- клик (тоггл) → **editMessage того же сообщения** (маркеры обновляются, клавиатура жива); fallback — sendMessage без `lastBotMessage`;
- «Далее» рендерится **только при ≥1 выбранном варианте** (UC не присылает `nextButton` при пустом выборе);
- «Далее» → **editMessage текущего вопроса** (финальные маркеры `[x]`, **клавиатура удалена**) + **sendMessage следующего вопроса** / completed.

---

## S03 — Текстовый вопрос (✏️ text)

**Как попасть:** аналогично S02a.

**Содержание:**
```
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
**Рендеринг:** FillStory → `confirm()` из BotUserStory

**Содержание:**
```
Вы уверены, что хотите пропустить анкету?

{cancelWarning}
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `✅ Да, пропустить` | `questionnaire:fill:decline-confirm:{qId}` | 📋 |
| `❌ Нет, вернуться` | `questionnaire:fill:invite:{qId}` → S01 | 📋 |

### S06b — Отказ подтверждён

**Как попасть:** «Да, пропустить» на S06a.
**Рендеринг:** FillStory → UC `decline-invite({questionnaireId})`

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

## Стори fill — обработчики

| Событие | UC | Действие |
|---|---|---|
| `fill:start:{qId}` | `start-by-invite` | Render → `captureInput: questionnaire/fill` |
| `fill:why:{qId}` | `get-current` | editMessage S01 (убрать кнопки) + sendMessage whyText + «Хорошо» |
| `fill:invite:{qId}` | `get-current` | sendMessage: новый S01 из InviteResponse |
| `fill:decline:{qId}` | — | `confirm('decline', qId, ...)` → S06a |
| `fill:decline-confirm:{qId}` | `decline-invite` | Render → S06b |
| `fill:cancel-confirm:{qId}` | `abandon` | Render → S05b |
| `fill:current` | `get-current` | Возврат к текущему вопросу (S02a/S02b/S03) |
| `fill:answer:{qId}:{aCode}` | `handle-action({type:'select'})` | Render |
| `fill:next:{qId}` | `handle-action({type:'next-btn'})` | Render |
| text message | `handle-action({type:'text'})` | Render |
| `/cancel` | — | `confirm('cancel', qId, ...)` → S05a |
| `questionnaire:continue-invite` (подписка) | — (SweepAbandonedJob, 3ч) | sendMessage S09: Продолжить анкету (takeover, если courseId) / Прервать |
| `questionnaire:abandon-warning` (подписка) | — (SweepAbandonedJob, 6ч) | sendMessage S07: Продолжить (takeover, если courseId) / Прервать |
| `questionnaire:abandon` (подписка, `reason='timeout'`) | — (SweepAbandonedJob, 9ч) | notify S08; без reason — ничего (без дубля) |

---

## Форматирование MarkdownV2

- Вопросы: `*{текст}*` (жирный)
- Single choice: `( )` / `(x)`
- Multiple choice: `[ ]` / `[x]`
- Все тексты — `escapeMarkdown()`
