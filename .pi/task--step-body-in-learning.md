# Задача: тело шага в «Моя учёба»

## Статус

- ✅ Шаг 1: `CourseFacade.getStep()` — готов, 4 теста, tslint чист
- ⏳ Шаг 2: Рефакторинг LearningStory
- ⏳ Шаг 3: Форматирование тела шага

## План (через appApi.execute)

### Файлы

| # | Файл | Что |
|---|------|-----|
| 2 | `learning.story.ts` | Рефакторинг + `appApi.execute('get-step', { uuid })` + форматирование тела |
| 3 | `learning.story.test.ts` | Мок `get-step` в appApi, тесты на новое сообщение |

### Методы после рефакторинга

| Метод | Ответственность |
|-------|----------------|
| `handleCallback` | Диспетчер: `my-study` → `showCurrentStep`, `complete:*` → `handleComplete` |
| `showCurrentStep(actor)` | get-student + get-stream → `buildStepView` (используется из двух мест) |
| `handleComplete(action, actor)` | complete-step → step: `showCurrentStep`, lesson/project: `announceTransition` |
| `buildStepView(stream, stepId, streamId)` | `appApi.execute('get-step')` + `findStepPosition` → `formatStepMessage` + `buildStepKeyboard` |
| `findStepPosition(snapshot, stepId)` | → `{ lessonTitle, stepIndex, totalSteps }` |
| `formatStepMessage(title, pos, step)` | Форматирование: заголовок + тело (описание, код) |
| `buildStepKeyboard(streamId, stepId)` | Клавиатура: [✅] [📊] |
| `announceTransition(result, streamId)` | Поздравление при переходе урок/проект (бывш. handleLevelTransition) |

### Сообщение

```
📖 Поток: Название потока
📚 Урок: «Переменные»
📝 Шаг 2 из 5

Описание задания...
```код```
[✅ Выполнено] [📊 Мой прогресс]
```

### Не забыть

- Кнопка «↩️ Главное меню» в showCurrentStep (уже есть)
- MarkdownV2 экранирование (escapeMarkdown из core)
- Код-блоки: ``` для code-шагов
