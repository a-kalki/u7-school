# План реализации Onboarding Domain Evolution

- [x] Task: 1. Обновление домена Questionnaire (a523fdc)
    - [x] Обновить `entity.ts`: заменить `userId: string` на `telegramId: number`, добавить `draftAnswers?: string[]` в `QuestionnaireSchema`.
    - [x] Обновить `a-root.ts`:
        - [x] Заменить `userId` на `telegramId` в `QuestionnaireAr.start`.
        - [x] Добавить метод `toggleDraftAnswer(questionCode: string, answerCode: string)` с валидацией по `currentQuestionCode`.
        - [x] Изменить `submitAnswer`: для множественного выбора брать данные из `draftAnswers` (если `value` не передан явно) и очищать `draftAnswers`.
    - [x] Обновить `repo.ts` (поиск по `telegramId`).
    - [x] Обновить `policy.ts`: удалить логику проверки `actorId` (или сделать её пропускной).
    - [x] Обновить/добавить тесты для `a-root.test.ts`.

- [x] Task: 2. Обновление команд и UseCase-ов Onboarding (a523fdc)
    - [x] Создать `toggle-draft-answer-cmd.ts` и `toggle-draft-answer-uc.ts` (зарегистрировать в `module.ts` / `index.ts`).
    - [x] Создать `get-onboarding-state-cmd.ts` и `get-onboarding-state-uc.ts` (возвращает `none_active` или `in_progress` со стейтом).
    - [x] Обновить `start-questionnaire`, `submit-answer`, `abandon-questionnaire`, `list-questionnaires` (перейти с `userId` на `telegramId`, удалить `actorId`).
    - [x] Обновить `QuestionnaireJsonRepo` (адаптировать под изменённую схему и запросы по `telegramId`).
    - [x] Обновить все тесты в `src/api/` и `src/infra/db/`.

- [x] Task: 3. Интеграция с User (a523fdc)
    - [x] Добавить в `UserFacade` метод `ensureUserWithRole(telegramId: number, role: 'GUEST' | 'CANDIDATE'): Promise<void>`.
    - [x] В `UserModule`: реализовать `ensure-user-with-role-uc.ts` (создаёт юзера если нет, добавляет роль если её нет).
    - [x] В `onboarding`: вызывать `ensureUserWithRole(telegramId, 'CANDIDATE')` при успешном завершении анкеты (в `submit-answer-uc`).

- [x] Task: Conductor - User Manual Verification 'Onboarding Domain Evolution' (Protocol in workflow.md) (a523fdc)
