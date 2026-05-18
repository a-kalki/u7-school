# План реализации: onb_prev_fix_20260513

## Фаза 1: Домен — типы и агрегат

- [x] Task: Написать тесты для новых полей в `QuestionnaireActionResponse`
    - [x] Тест: `new_question` содержит `previousQuestion` и `previousSelectedAnswers` при переходе
    - [x] Тест: `completed` содержит `previousQuestion` и `previousSelectedAnswers`
    - [x] Тест: `wait_next` использует `currentQuestion` вместо `question`
    - [x] Тест: `getQuestionnaireActionResponse` возвращает `currentQuestion` для `wait_next`
- [x] Task: Реализовать изменения в типах (`types.ts`) и агрегате (`a-root.ts`)
    - [x] `types.ts`: переименовать `question` → `currentQuestion` в `wait_next`
    - [x] `types.ts`: добавить `previousQuestion?`, `previousSelectedAnswers?` в `new_question` и `completed`
    - [x] `a-root.ts`: `toggleDraftAnswer` — `currentQuestion`
    - [x] `a-root.ts`: `getQuestionnaireActionResponse` — `currentQuestion`
    - [x] `a-root.ts`: `findAndSetNextQuestion` — захват предыдущего вопроса, заполнение новых полей
- [x] Task: Conductor - User Manual Verification 'Фаза 1: Домен' (Protocol in workflow.md)

## Фаза 2: Контроллер

[checkpoint: 09c824b]

- [x] Task: Написать тесты для контроллера `#renderActionResponse`
    - [x] Тест: `new_question` — edit использует `previousQuestion`, без клавиатуры
    - [x] Тест: `new_question` — send использует `question`
    - [x] Тест: `completed` — edit последнего вопроса, без клавиатуры
    - [x] Тест: `wait_next` — без изменений (использует `currentQuestion`)
- [x] Task: Реализовать изменения в контроллере (`onboarding-controller.ts`)
    - [x] `#renderActionResponse`, `new_question`: edit — `previousQuestion` + `previousSelectedAnswers`, без клавиатуры
    - [x] `#renderActionResponse`, `new_question`: send — `question` + `selectedAnswers`
    - [x] `#renderActionResponse`, `completed`: edit — `previousQuestion` + `previousSelectedAnswers`, без клавиатуры
    - [x] `#renderActionResponse`, `wait_next`: переименовать `response.question` → `response.currentQuestion`
- [x] Task: Conductor - User Manual Verification 'Фаза 2: Контроллер' (Protocol in workflow.md)
