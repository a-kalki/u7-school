# Спецификация: Исправление рендеринга предыдущего вопроса в onboarding

## Обзор

Исправить архитектурную ошибку в onboarding-модуле: при переходе к следующему вопросу (`new_question`) контроллер рендерит edit предыдущего сообщения, используя данные **нового** вопроса вместо **предыдущего**. Оба сообщения становятся одинаковыми.

## Функциональные требования

### FR-1: Тип `QuestionnaireActionResponse`

| Аспект | Было | Стало |
|--------|------|-------|
| `wait_next.question` | `question: Question` | `currentQuestion: Question` |
| `new_question` | `question`, `selectedAnswers?` | `question`, `selectedAnswers?`, **+ `previousQuestion?: Question`**, **+ `previousSelectedAnswers?: string[]`** |
| `completed` | `selectedAnswers?` | **`previousQuestion?: Question`**, **`previousSelectedAnswers?: string[]`** |

- `selectedAnswers` в `new_question` — черновики **текущего** вопроса (при возобновлении анкеты).
- `previousQuestion` + `previousSelectedAnswers` — заполняются **только** при переходе между вопросами (`findAndSetNextQuestion`).
- `previousQuestion` опционален в типе, но **обязан** быть заполнен в рантайме, если предыдущий вопрос был типа `choice` (для `new_question` и `completed`).

### FR-2: Агрегат `QuestionnaireAr`

- `findAndSetNextQuestion`: перед переходом захватывает текущий вопрос (`previousQuestion`).
- Возвращает в ответе:
  - `new_question`: `question` = новый, `selectedAnswers` = `[]`, `previousQuestion` = захваченный, `previousSelectedAnswers` = последние ответы.
  - `completed`: `previousQuestion` = последний вопрос, `previousSelectedAnswers` = последние ответы.
- `toggleDraftAnswer`: переименовать `question` → `currentQuestion`.
- `getQuestionnaireActionResponse`: переименовать `question` → `currentQuestion`.

### FR-3: Контроллер `#renderActionResponse`

**`new_question`**:
- **Edit** (если есть `previousQuestion` и `messageId`): рендерит `previousQuestion` с `previousSelectedAnswers`, **без клавиатуры**.
- **Send**: рендерит `question` с `selectedAnswers`. Клавиатура — обычная.

**`completed`**:
- **Edit** (если есть `previousQuestion` и `messageId`): рендерит последний вопрос с отметками, **без клавиатуры**.
- **Send**: «Спасибо! Твоя анкета принята.»

**`wait_next`**:
- Переименовать `response.question` → `response.currentQuestion`.

**Важно**: при редактировании (edit) клавиатура **никогда** не отправляется.

## Критерии приёмки

- [ ] При нажатии «Далее» на multiple-choice: предыдущее сообщение показывает текст **предыдущего** вопроса с `[x]`, без клавиатуры.
- [ ] Новое сообщение показывает текст **нового** вопроса без отметок.
- [ ] При одиночном выборе: предыдущее сообщение с `[x]` на выбранном ответе, без клавиатуры.
- [ ] При завершении через choice: последнее сообщение с отметками, затем «Спасибо!».
- [ ] Возобновление анкеты (`get-current-question`) работает без изменений.
- [ ] `wait_next` работает без изменений.

## За рамками

- Изменения в UI для других платформ.
- Изменение логики ветвления вопросов.
