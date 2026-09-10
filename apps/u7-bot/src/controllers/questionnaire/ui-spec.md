# Спецификация экранов Questionnaire (UI Spec)

Документ описывает экраны Telegram-бота модуля Questionnaire: их содержимое, кнопки, условия видимости и доменную логику.
Служит **отправной точкой для разработки**.

Условные обозначения:
- ✅ реализовано
- ❌ не реализовано
- 📋 в бэклоге / запланировано в треке

> **Контракт рендера** (трек bot-ui-dialog-questionnaire): экраны описаны в терминах
> «Диалог и Экран» — `DialogResponse { screen, finalize, notify, awaitInput, release,
> delegate }`; ввод анкеты — `awaitInput` с контекстом `{ questionnaireId }` (без path);
> edit/send решает транспорт по владению экраном. Кнопочные проактивы — только канал
> `invite` (ФР-6, вариант A), чистые уведомления — `notify`.

---

## Путь пользователя

Два варианта входа в анкету:
- **Через приглашение (sendLikertInvite):** модуль-владелец вызывает `facade.sendLikertInvite(actorId, pool, ownerInfo)` → S01 → пользователь принимает → S02.
- **Сразу (startStandard):** модуль-владелец вызывает `facade.startStandard(actorId, pool, ownerInfo)` → пользователь получает приглашение с кнопкой «▶️ Заполнить анкету» (вариант A, ФР-6): анкета открывается только действием пользователя (кнопка-мост `fill:resume:{courseId}`); без courseId — notify с подсказкой /start.

---

## S01 — Приглашение (📋 invite) ✅

**Как попасть:** инициативно от системы (событие `questionnaire:invite` → канал `invite`, ФР-6).
**Кому:** пользователю, которому предназначена анкета.
**Рендеринг:** InviteStory → подписка `questionnaire:invite` → `#handleInviteEvent`
**Данные:** `InviteResponse` содержит `inviteText?`, `whyText?`, `questionnaireId`.

**Содержание:**
```
📋 *Анкета*

{inviteText или дефолт «Заполните, пожалуйста, анкету.»}

Для отмены в любой момент нажмите /cancel.

Если кнопки не открываются — наберите /start.
```

**Кнопки:**

| Текст | Код | Действие | Статус |
|-------|-----|----------|--------|
| `▶️ Начать заполнение` | `questionnaire:invite:start:{qId}` | → delegate `fill:current:{qId}` → S02 (диалог fill + awaitInput) | ✅ |
| `❔ Зачем это нужно?` | `questionnaire:invite:why:{qId}` | экран whyText | ✅ |
| `⏭️ Пропустить` | `questionnaire:invite:decline:{qId}` | → S06a (confirm) | ✅ |

> **«Зачем это нужно?»** — только если `whyText` есть в pool.
>
> Логика:
> 1. экран: `whyText` + кнопка `✅ Хорошо`
> 2. «Хорошо» → экран: новый S01 с полным набором кнопок
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

**Логика (UX, spec FR-1) ✅:** клик → UC `handle-action({type:'callback'})` → finalize-паттерн:
предыдущий вопрос **фиксируется** (`finalize`: маркер `(x)` у выбранного варианта, клавиатура
снимается транспортом), следующий вопрос — `screen` **новым сообщением** (история «вопрос →
выбранный ответ»). edit/send решает транспорт по владению экраном.
Автопереход: кнопка «Далее» не появляется.
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
- клик (тоггл) → `screen` на месте (edit-in-place: маркеры обновляются, клавиатура жива — владение экраном); чужой код → **S10** (`stale_button`), в `draftAnswers` не попадает;
- «Далее» рендерится **только при ≥1 выбранном варианте** (UC не присылает `nextButton` при пустом выборе);
- «Далее» → **finalize текущего вопроса** (финальные маркеры `[x]`, клавиатура снимается) + **screen следующего вопроса** / completed;
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

**Логика ✅:** текст → `handle-action({type:'text'})` → `answerText` → finalize-паттерн
(finalize предыдущего вопроса без клавиатуры + screen следующего, spec FR-2).

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

**Логика ✅:** `release` (ввод отпущен). При наличии `previousQuestion` — `finalize`
предыдущего (финальные маркеры, клавиатура снимается), completed-экран — `screen`
новым сообщением (spec FR-1/FR-2).

---

## S05 — Отмена (🚫 cancelled) ✅

### S05a — Подтверждение отмены

**Как попасть:** `/cancel` на любом экране анкеты (S02/S03) или кнопка «⏭️ Прервать» из S07/S09 (`fill:cancel:{qId}`) — прерывание только после подтверждения (решение владельца 2026-09-10).
**Рендеринг:** FillStory.handleCommand (`/cancel`) / `#cancelConfirmScreen` (кнопка) → `confirm()`

**Содержание:**
```
Вы уверены, что хотите прервать анкету?

{cancelWarning}
```

**Кнопки:**

| Текст | Код | Статус |
|-------|-----|--------|
| `✅ Да, прервать` | `questionnaire:fill:cancel-confirm:{qId}` | ✅ |
| `❌ Нет, продолжить` | `questionnaire:fill:current:{qId}` → возврат к вопросу (awaitInput восстанавливается по qId — контекст ввода умирает при reopen меню) | ✅ |

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
| `↩️ Главное меню` | `app:main-menu` | ✅ |

**Логика:** статус → `abandoned`, `release`.

---

## S06 — Отказ от приглашения (⏭️ declined) ✅

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
| `✅ Да, пропустить` | `questionnaire:invite:decline-confirm:{qId}` | ✅ |
| `❌ Нет, вернуться` | `questionnaire:invite:invite:{qId}` → S01 | ✅ |

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
| `↩️ Главное меню` | `app:main-menu` | ✅ |

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
| `▶️ Продолжить` | `questionnaire:fill:resume:{courseId}` (только если ownerInfo.courseId задан) | ✅ |
| `⏭️ Прервать` | `questionnaire:fill:cancel:{qId}` → S05a (подтверждение) | ✅ |

**Доставка:** канал `invite` (ФР-6): кнопки штампуются seq текущей эпохи диалога получателя;
получателю без диалога транспорт открывает якорь `app/invite` (seq=1). В тексте — подсказка
«Если кнопки не открываются — наберите /start.»

**Логика:** при активности респондента (ответ на вопрос) флаги `warnedAt` и `continueInvitedAt`
сбрасываются — таймер простоя не сдвигается метками ступеней (`markWarned`/`markContinueInvited`
обходят `safeUpdate`). Кнопка-мост `fill:resume` switch-ит диалог в fill (seq++) — перехват ввода
без блокировки (функциональный эквивалент прежнего takeover, spec FR-5).

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
| `▶️ Продолжить анкету` | `questionnaire:fill:resume:{courseId}` (только если ownerInfo.courseId задан) | ✅ |
| `⏭️ Прервать` | `questionnaire:fill:cancel:{qId}` → S05a (подтверждение) | ✅ |

**Доставка:** канал `invite` (ФР-6), подсказка /start — как в S07.

**Логика:** первая ступень цепочки брошенных анкет (3ч → 6ч → 9ч). Отправляется **один раз**
(флаг `continueInvitedAt`); при возобновлении заполнения цепочка сбрасывается.

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

**Содержание** (`reason='stale_button'`) — warn-реплика поверх экрана:
```
⚠️ Эта кнопка относится к предыдущему вопросу.
```

**Содержание** (`reason='empty_selection'`):
```
⚠️ Сначала выбери хотя бы один вариант.
```

**Кнопки:** клавиатура актуального вопроса (S02a/S02b/S03) — жива: экран и ввод
не трогаются, вопрос уже показан на экране (реплика без перерисовки — решение
трека bot-ui-dialog-questionnaire).

**Логика ✅ (трек questionnaire-robustness_20260903, spec FR-1):**
- состояние анкеты **не меняется**: чужой код не попадает в `draftAnswers`/`answers`;
- warn-реплика (`notify`, kind: warn) с пояснением по reason — без перерисовки экрана;
- `awaitInput`-контекст сохраняется — флоу продолжается, `release` **не** выполняется;
- наблюдаемость: `logger.warn('fill-story', 'Неактуальный ответ в анкете', {questionnaireId, pressed, questionCode, reason})` — warn, не error: не создаёт CRITICAL в Logger Bot.

---

## Стори контроллера — обработчики

Контроллер состоит из двух стори (общий рендер — `stories/render.ts`):

### InviteStory (`invite`) — приглашение и отказ

| Событие / код | UC | Действие |
|---|---|---|
| `invite:start:{qId}` | `start-by-invite` | delegate `fill:current:{qId}` → get-current → экран вопроса + awaitInput (диалог fill) |
| `invite:why:{qId}` | `get-current` | экран whyText + «Хорошо» → `invite:invite:{qId}` |
| `invite:invite:{qId}` | `get-current` | экран: новый S01 из InviteResponse |
| `invite:decline:{qId}` | `get-current` (warning) | `confirm('decline', qId, ...)` → S06a |
| `invite:decline-confirm:{qId}` | `decline-invite` | экран S06b + `release` |
| `questionnaire:invite` (подписка) | — | канал `invite`: S01 с полными кодами кнопок + подсказка /start (ФР-6) |

### FillStory (`fill`) — заполнение и жизненный цикл

| Событие / код | UC | Действие |
|---|---|---|
| `fill:current:{qId}` | `get-current` | Возврат к текущему вопросу (S02a/S02b/S03) + awaitInput |
| `fill:cancel:{qId}` | `get-current` (warning) | `confirm('cancel', qId, ...)` → S05a |
| `fill:answer:{qId}:{aCode}` | `handle-action({type:'callback'})` | Render (finalize-паттерн) |
| `fill:next:{qId}:{qCode}` | `handle-action({type:'callback'})` | Render (finalize-паттерн) |
| text message | `handle-action({type:'text'})` | Render (finalize-паттерн); ошибки валидации — errorNotify |
| `fill:cancel-confirm:{qId}` | `abandon` | экран S05b + `release` |
| `fill:resume:{courseId}` | `get-questionnaires-by-user` + `get-current` | Render + awaitInput (контекст `{ questionnaireId }`) |
| `/cancel` | `get-current` (warning) | `confirm('cancel', qId, ...)` → S05a (handleCommand активной стори) |
| `questionnaire:start` (подписка) | — | вариант A: invite «▶️ Заполнить анкету» с кнопкой-мостом `fill:resume:{courseId}`; без courseId — notify с подсказкой /start |
| `questionnaire:continue-invite` (подписка) | — (SweepAbandonedJob, 3ч) | канал invite: S09 «Продолжить анкету» (resume, если courseId) / «Прервать» (cancel → S05a) |
| `questionnaire:abandon-warning` (подписка) | — (SweepAbandonedJob, 6ч) | канал invite: S07 «Продолжить» (resume, если courseId) / «Прервать» (cancel → S05a) |
| `questionnaire:abandon` (подписка, `reason='timeout'`) | — (SweepAbandonedJob, 9ч) | notify S08; иначе (`by_user`) — ничего (без дубля) |

---

## Форматирование MarkdownV2

- Шапка каждого вопроса: `*Вопрос N из M*` — прогресс по **активному маршруту** (`QuestionnaireEngine.getProgress(questionCode, answers)`; условия ветвления применяются к уже данным ответам)
- Вопросы: `*{текст}*` (жирный)
- Single choice: `( )` / `(x)`; Multiple choice: `[ ]` / `[x]`
- Подсказка «В любой момент можно нажать /cancel…» — только под первым вопросом анкеты (`previousQuestion === undefined`)
- Все тексты — MdText: доменные данные через `md`-интерполяцию (авто-экранирование, включая `inviteText`, `whyText`, `completionText`, `cancelWarning`, fallback-тексты); литеральные части — экранированы вручную/`escapeMarkdown()`; номера вариантов экранируются (`1\.`)
