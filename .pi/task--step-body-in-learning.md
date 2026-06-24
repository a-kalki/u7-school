# Задача: тело шага в «Моя учёба» — ВЫПОЛНЕНО ✅

## Коммиты

- `479b37b` — исправления UserPolicy / фасада / временной регистрации
- `a04888c` — тело шага + рефакторинг LearningStory

## Что сделано

| # | Файл | Что |
|---|------|-----|
| 1 | `course/domain/facade.ts` | `getStep(stepId): Promise<Step>` — новый метод |
| 2 | `course/infra/course-in-proc-facade.ts` | Реализация через `get-step` use-case |
| 3 | `course/infra/course-in-proc-facade.test.ts` | 2 теста |
| 4 | `stream/ui/bot/stories/learning.story.ts` | Рефакторинг + тело шага |
| 5 | `stream/ui/bot/stories/learning.story.test.ts` | 17 тестов |

## Итог

Сообщение «Моя учёба» теперь показывает:

```
📖 Поток: Название потока
📚 Урок: «Переменные»
📝 Шаг 2 из 5

Описание задания...
```код```
[✅ Выполнено] [📊 Мой прогресс] [↩️ Главное меню]
```

## Достижения рефакторинга

- `showCurrentStep` — унифицирован для «Моя учёба» и «Выполнено» (level=step)
- `buildStepView` / `findStepPosition` / `formatStepMessage` / `buildStepKeyboard` — каждая делает одно
- Тело шага через `appApi.execute('get-step', ...)` — межмодульный вызов, 0 изменений в StreamController/api-app
