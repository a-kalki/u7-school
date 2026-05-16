# План реализации: Stateless Bot & Onboarding Refactoring

- [x] Task: 1. Безопасность и Регистрация (User Module)
    - [x] Изменить `EnsureUserWithRoleUc`: `requiresAuth: true`, роль `ADMIN`, убрать авторегистрацию.
    - [x] Создать `RegisterGuestUc`: регистрация пользователя с ролью `GUEST` (принимает `telegramId`, `name`).
    - [x] Обновить `UserInProcFacade`: передача `actorId`, добавление новых методов.

- [x] Task: 2. Рефакторинг Домена (Onboarding Module)
    - [x] `QuestionnaireAr`:
        - [x] Добавить `handleAction(questionCode, value | 'NEXT')`.
        - [x] Реализовать внутреннюю логику переходов и черновиков.
        - [x] Определить типы возвращаемого значения `QuestionnaireActionResponse`.
    - [x] Написать тесты на `handleAction` (все типы вопросов).

- [x] Task: 3. API и Универсальный UseCase (Onboarding Module)
    - [x] Создать `HandleOnboardingActionUc`:
        - [x] Вызывает `ar.handleAction`.
        - [x] Если `status: completed` -> вызывает `UserFacade.addRoleToUser(..., 'STUDENT')`.
        - [x] Возвращает `QuestionnaireActionResponse`.
    - [x] Удалить старые UC (`SubmitAnswer`, `ToggleDraft`).

- [x] Task: 4. Stateless Bot & Controller
    - [x] Рефакторинг `OnboardingController`:
        - [x] Использовать `HandleOnboardingActionUc`.
        - [x] Формировать `BotResponse` (один объект с `editMessage` и `sendMessage`).
    - [x] Обновить `u7-bot`:
        - [x] Команда `/start` -> `RegisterGuestUc`.
        - [x] Интеграция с контроллером через новый типизированный контракт.
        - [x] Удалить `conversations`, `session`, зависимость `@grammyjs/conversations`.

- [x] Task: Conductor - User Manual Verification 'Stateless Bot & Onboarding Refactoring' (Protocol in workflow.md)
