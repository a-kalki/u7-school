# План реализации: onb_prev_fix_20260513

## Фаза 1: Домен — типы и агрегат

- [ ] Task: Написать тесты для новых полей в `QuestionnaireActionResponse`
    - [ ] Тест: `new_question` содержит `previousQuestion` и `previousSelectedAnswers` при переходе
    - [ ] Тест: `completed` содержит `previousQuestion` и `previousSelectedAnswers`
    - [ ] Тест: `wait_next` использует `currentQuestion` вместо `question`
    - [ ] Тест: `getQuestionnaireActionResponse` возвращает `currentQuestion` для `wait_next`
- [ ] Task: Реализовать изменения в типах (`types.ts`) и агрегате (`a-root.ts`)
    - [ ] `types.ts`: переименовать `question` → `currentQuestion` в `wait_next`
    - [ ] `types.ts`: добавить `previousQuestion?`, `previousSelectedAnswers?` в `new_question` и `completed`
    - [ ] `a-root.ts`: `toggleDraftAnswer` — `currentQuestion`
    - [ ] `a-root.ts`: `getQuestionnaireActionResponse` — `currentQuestion`
    - [ ] `a-root.ts`: `findAndSetNextQuestion` — захват предыдущего вопроса, заполнение новых полей
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Домен' (Protocol in workflow.md)

## Фаза 2: Контроллер

- [ ] Task: Написать тесты для контроллера `#renderActionResponse`
    - [ ] Тест: `new_question` — edit использует `previousQuestion`, без клавиатуры
    - [ ] Тест: `new_question` — send использует `question`
    - [ ] Тест: `completed` — edit последнего вопроса, без клавиатуры
    - [ ] Тест: `wait_next` — без изменений (использует `currentQuestion`)
- [ ] Task: Реализовать изменения в контроллере (`onboarding-controller.ts`)
    - [ ] `#renderActionResponse`, `new_question`: edit — `previousQuestion` + `previousSelectedAnswers`, без клавиатуры
    - [ ] `#renderActionResponse`, `new_question`: send — `question` + `selectedAnswers`
    - [ ] `#renderActionResponse`, `completed`: edit — `previousQuestion` + `previousSelectedAnswers`, без клавиатуры
    - [ ] `#renderActionResponse`, `wait_next`: переименовать `response.question` → `response.currentQuestion`
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Контроллер' (Protocol in workflow.md)
