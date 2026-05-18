# Итоговый отчёт трека: onb_prev_fix_20260513

## Цель
Исправить архитектурную логическую ошибку в onboarding-модуле: при переходе к следующему вопросу (`new_question`) контроллер рендерил edit предыдущего сообщения, используя данные **нового** вопроса вместо **предыдущего**. Оба сообщения становились одинаковыми.

## Выполненные задачи

### Фаза 1: Домен — типы и агрегат
- [x] Написаны тесты для новых полей `previousQuestion`/`previousSelectedAnswers` в `QuestionnaireActionResponse`
- [x] Реализованы изменения в `types.ts`: переименован `question` → `currentQuestion` в `wait_next`; добавлены `previousQuestion?`, `previousSelectedAnswers?` в `new_question` и `completed`
- [x] Реализованы изменения в `a-root.ts`: `findAndSetNextQuestion` захватывает предыдущий вопрос перед переходом; `toggleDraftAnswer`/`getQuestionnaireActionResponse` используют `currentQuestion`

### Фаза 2: Контроллер
- [x] Написаны тесты для `#renderActionResponse`: edit с `previousQuestion` без клавиатуры, send с `question`
- [x] Реализованы изменения в `onboarding-controller.ts`: edit использует `previousQuestion` + `previousSelectedAnswers`, **без клавиатуры**; `wait_next` использует `currentQuestion`

### Дополнительно
- [x] Добавлены номера перед ответами в сообщении, совпадающие с номерами кнопок

## Изменённые файлы

| Файл | Изменения |
|------|-----------|
| `packages/onboarding/src/domain/questionnaire/types.ts` | Переименование `question` → `currentQuestion`; новые поля `previousQuestion?`, `previousSelectedAnswers?` |
| `packages/onboarding/src/domain/questionnaire/a-root.ts` | Захват `previousQuestion` в `findAndSetNextQuestion` |
| `packages/onboarding/src/domain/questionnaire/a-root.test.ts` | +5 тестов на новые поля |
| `packages/onboarding/src/ui/bot/controller/onboarding-controller.ts` | Edit через `previousQuestion` без клавиатуры; номера ответов |
| `packages/onboarding/src/ui/bot/controller/onboarding-controller.test.ts` | +4 теста на edit/send логику |
| `packages/onboarding/src/api/questionnaire/get-current-question-uc.test.ts` | Исправление type narrowing |
| `packages/onboarding/src/api/questionnaire/start-uc.test.ts` | Исправление type narrowing |

## Архитектурные решения
- **Агрегат — источник истины**: предыдущий вопрос захватывается внутри `findAndSetNextQuestion` до обновления `currentQuestionCode`. Никакая бизнес-логика не дублируется в контроллере.
- **Контроллер stateless**: не хранит состояние между вызовами, все данные приходят в ответе из usecase.
- **При edit — без клавиатуры**: отправка `keyboard: undefined` убирает inline-кнопки у сообщения, делая его read-only.
- **Номера ответов в тексте**: синхронизированы с индексами кнопок (`i + 1`), упрощают ориентацию пользователя.

## Отклонений от плана нет

## Известные ограничения
- Нет отдельного usecase `publish-module`/`publish-project` — логика встроена в агрегат CourseAr
- `add-step-to-lesson` и `add-lesson-to-project` не выделены в отдельные команды
