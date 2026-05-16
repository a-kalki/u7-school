# План реализации Onboarding Domain Evolution

- [~] Task: 1. Обновление домена Questionnaire
    - [ ] Обновить `entity.ts`: заменить `userId: string` на `telegramId: number`, добавить `draftAnswers?: string[]` в `QuestionnaireSchema`.
    - [ ] Обновить `a-root.ts`:
        - [ ] Заменить `userId` на `telegramId` в `QuestionnaireAr.start`.
        - [ ] Добавить метод `toggleDraftAnswer(questionCode: string, answerCode: string)` с валидацией по `currentQuestionCode`.
        - [ ] Изменить `submitAnswer`: для множественного выбора брать данные из `draftAnswers` (если `value` не передан явно) и очищать `draftAnswers`.
    - [ ] Обновить `repo.ts` (поиск по `telegramId`).
    - [ ] Обновить `policy.ts`: удалить логику проверки `actorId` (или сделать её пропускной).
    - [ ] Обновить/добавить тесты для `a-root.test.ts`.

- [ ] Task: 2. Обновление команд и UseCase-ов Onboarding
    - [ ] Создать `toggle-draft-answer-cmd.ts` и `toggle-draft-answer-uc.ts` (зарегистрировать в `module.ts` / `index.ts`).
    - [ ] Создать `get-onboarding-state-cmd.ts` и `get-onboarding-state-uc.ts` (возвращает `none_active` или `in_progress` со стейтом).
    - [ ] Обновить `start-questionnaire`, `submit-answer`, `abandon-questionnaire`, `list-questionnaires` (перейти с `userId` на `telegramId`, удалить `actorId`).
    - [ ] Обновить `QuestionnaireJsonRepo` (адаптировать под изменённую схему и запросы по `telegramId`).
    - [ ] Обновить все тесты в `src/api/` и `src/infra/db/`.

- [ ] Task: 3. Интеграция с User
    - [ ] Добавить в `UserFacade` метод `ensureUserWithRole(telegramId: number, role: 'GUEST' | 'CANDIDATE'): Promise<void>`.
    - [ ] В `UserModule`: реализовать `ensure-user-with-role-uc.ts` (создаёт юзера если нет, добавляет роль если её нет).
    - [ ] В `onboarding`: вызывать `ensureUserWithRole(telegramId, 'CANDIDATE')` при успешном завершении анкеты (в `submit-answer-uc`).

- [ ] Task: Conductor - User Manual Verification 'Onboarding Domain Evolution' (Protocol in workflow.md)
