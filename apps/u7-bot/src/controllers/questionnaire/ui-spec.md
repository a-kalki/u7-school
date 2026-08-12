# Спецификация экранов Questionnaire (UI Spec)

Документ описывает экраны Telegram-бота модуля Questionnaire: их содержимое, кнопки, условия видимости и доменную логику.
Служит **отправной точкой для разработки**.

Условные обозначения:
- ✅ реализовано
- ❌ не реализовано
- 📋 в бэклоге / запланировано в треке

---

## Путь пользователя

Два варианта входа:
- **Инициативный (Путь A):** модуль-владелец вызывает `questionnaireFacade.sendInvite(user, pool)` или `start(user, pool)`. Система отправляет пользователю сообщение.
- **Ответный (Путь B):** пользователь нажимает кнопку и попадает в диалог с анкетой.

---

## S01 — Приглашение (📋 invite)

**Как попасть:** инициативно от системы (Путь A). Модуль-владелец вызывает `questionnaireFacade.sendInvite()`.
**Кому:** пользователю, которому предназначена анкета.
**Рендеринг:** `TelegramQuestionnaireBotFacade.sendQuestionnaireInvite()`
**Данные:** `InviteResponse` содержит `inviteText?`, `howToFill?`, `questionnaireId`.

**Содержание:**
```
📋 *Анкета*

{inviteText}

Для отмены в любой момент нажмите /cancel.
```

**Кнопки:**

| Текст | Код | Действие | Статус |
|-------|-----|----------|--------|
| `▶️ Начать заполнение` | `questionnaire:fill:start:{qId}` | → S02 | 📋 |
| `❔ Как заполнять?` | `questionnaire:fill:howto:{qId}` | popup с howToFill | 📋 |
| `⏭️ Пропустить` | `questionnaire:fill:decline:{qId}` | → S06 | 📋 |

> **«Как заполнять?»** — показывается только если `howToFill` есть в pool. Показывает текст через `answerCallbackQuery` (всплывающее окно), не меняя экран.
> **«Пропустить»** — вызывает UC `decline-invite`, анкета → abandoned.
> Сообщение отправляется одноразово, без captureInput.

---

## S02a — Вопрос с одиночным выбором (🔘 single choice)

**Как попасть:** через S01 (после «Начать») или после ответа на предыдущий вопрос.
**Кому:** пользователь в процессе заполнения.
**Рендеринг:** FillStory → UC `start-by-invite` / UC `handle-action` → render

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
| `1` | `questionnaire:fill:answer:{qId}:{aCode1}` | 📋 |
| `2` | `questionnaire:fill:answer:{qId}:{aCode2}` | 📋 |
| `3` | `questionnaire:fill:answer:{qId}:{aCode3}` | 📋 |

**Логика:**
- Клик → UC `handle-action({type:'select', value:answerCode})`
- Ответ сразу фиксируется, переход к следующему вопросу или завершению
- Предыдущий вопрос — editMessage (с отмеченным ответом), новый — sendMessage

---

## S02b — Вопрос с множественным выбором (☑️ multiple choice)

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
| `1` | `questionnaire:fill:answer:{qId}:{aCode1}` | 📋 |
| `2` | `questionnaire:fill:answer:{qId}:{aCode2}` | 📋 |
| `3` | `questionnaire:fill:answer:{qId}:{aCode3}` | 📋 |
| `▶️ Далее` | `questionnaire:fill:next:{qId}` | 📋 |

**Логика:**
- Клик по номеру → UC `handle-action` переключает вариант (toggle)
- Сообщение обновляется через editMessage — флажки [ ]/[x] меняются
- «Далее» → UC `handle-action({type:'next-btn'})` фиксирует выбор и переходит дальше

---

## S03 — Текстовый вопрос (✏️ text)

**Как попасть:** аналогично S02a.

**Содержание:**
```
*{текст вопроса}*

Введите ваш ответ текстом...
```

**Кнопки:** отсутствуют

**Логика:**
- Пользователь вводит текст как обычное сообщение
- FillStory.handleMessage → UC `handle-action({type:'text', value:text})`
- Ответ → `answerText`, переход к следующему вопросу или завершению

---

## S04 — Завершение (✅ completed)

**Как попасть:** после последнего ответа.
**Кому:** пользователь завершил анкету.
**Данные:** `completionText` из pool (или дефолт).

**Содержание:**
```
✅ *Анкета завершена*

{completionText}
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `↩️ Главное меню` | `app:main-menu` | 📋 |

**Логика:**
- `releaseInput` — освобождение ввода
- `questionnaireCompleted: true` — сигнал для модуля-владельца

---

## S05 — Отмена (🚫 cancelled)

**Как попасть:** `/cancel` на любом экране анкеты.
**Данные:** `cancelWarning` из pool (или дефолт).

**Содержание:**
```
{cancelWarning}
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `↩️ Главное меню` | `app:main-menu` | 📋 |

**Логика:**
- FillStory.handleCancel → UC `abandon({questionnaireId})`
- Статус → `abandoned`, `releaseInput`

---

## S06 — Отказ от приглашения (⏭️ declined)

**Как попасть:** кнопка «⏭️ Пропустить» на S01.
**Данные:** `cancelWarning` из pool (или дефолт).

**Содержание:**
```
{cancelWarning}
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `↩️ Главное меню` | `app:main-menu` | 📋 |

**Логика:**
- FillStory → UC `decline-invite({questionnaireId})`
- Статус → `abandoned`

---

## Стори fill — обработчики

| Событие | Данные | UC | Ответ |
|---|---|---|---|
| Начало | `fill:start:{qId}` | `start-by-invite` | Render + `captureInput: questionnaire/fill` |
| Как заполнять? | `fill:howto:{qId}` | — | `answerCallbackQuery` с текстом howToFill |
| Отказ | `fill:decline:{qId}` | `decline-invite` | CancelWarning текст |
| Выбор ответа | `fill:answer:{qId}:{aCode}` | `handle-action({type:'select', value:aCode})` | Render |
| Далее (multiple) | `fill:next:{qId}` | `handle-action({type:'next-btn'})` | Render |
| Текстовый ввод | text message | `handle-action({type:'text', value:text})` | Render |
| Отмена | `/cancel` | `abandon({questionnaireId})` | CancelWarning + releaseInput |

---

## Форматирование MarkdownV2

- Вопросы: `*{текст}*` (жирный)
- Single choice: номера + `( )` / `(x)`
- Multiple choice: номера + `[ ]` / `[x]`
- Все тексты — `escapeMarkdown()`
