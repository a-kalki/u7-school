# Summary: Stateless Bot & Onboarding Refactoring

## Название трека и его цель
**Stateless Bot & Onboarding Refactoring**: Рефакторинг Telegram-бота для полного отказа от состояния (stateless) путём удаления `grammy/conversations` и переноса всей логики управления анкетой в доменный слой. Усиление безопасности модуля `User` и автоматизация выдачи ролей.

## Список выполненных задач
- **Безопасность и Регистрация (User Module)**:
    - `EnsureUserWithRoleUc`: `requiresAuth: true`, роль `ADMIN`, убрана авторегистрация.
    - Создан `RegisterGuestUc`: регистрация пользователя с ролью `GUEST` ботом при `/start`.
    - Обновлён `UserInProcFacade`: передача `actorId`, добавлены новые методы.
- **Рефакторинг Домена (Onboarding Module)**:
    - `QuestionnaireAr.handleAction(questionCode, value | 'NEXT')` — единый метод управления анкетой.
    - Реализована внутренняя логика переходов и черновиков.
    - Определён тип возвращаемого значения `QuestionnaireActionResponse`.
    - Написаны тесты на `handleAction` для всех типов вопросов.
- **API и Универсальный UseCase**:
    - Создан `HandleOnboardingActionUc`: вызывает `ar.handleAction`, при `status: completed` выдаёт роль `STUDENT` через `UserFacade.addRoleToUser`.
    - Удалены старые UC (`SubmitAnswer`, `ToggleDraft`).
- **Stateless Bot & Controller**:
    - `OnboardingController` переписан на использование `HandleOnboardingActionUc`.
    - Формирует `BotResponse` (один объект с `editMessage` и `sendMessage`).
    - Бот `u7-bot`: команда `/start` → `RegisterGuestUc`, интеграция с контроллером через типизированный контракт.
    - Удалены `conversations`, `session`, зависимость `@grammyjs/conversations`.

## Список изменённых файлов
- `packages/onboarding/src/domain/questionnaire/a-root.ts`
- `packages/onboarding/src/domain/questionnaire/entity.ts`
- `packages/onboarding/src/domain/questionnaire/policy.ts`
- `packages/onboarding/src/domain/questionnaire/types.ts`
- `packages/onboarding/src/domain/questionnaire/repo.ts`
- `packages/onboarding/src/domain/questionnaire/question-pool-service.ts`
- `packages/onboarding/src/api/questionnaire/handle-onboarding-action-uc.ts`
- `packages/onboarding/src/api/questionnaire/get-onboarding-state-uc.ts`
- `packages/onboarding/src/api/questionnaire/abandon-questionnaire-uc.ts`
- `packages/onboarding/src/api/questionnaire/start-questionnaire-uc.ts`
- `packages/onboarding/src/api/questionnaire/get-questionnaire-uc.ts`
- `packages/onboarding/src/api/questionnaire/list-questionnaires-by-telegram-id-uc.ts`
- `packages/onboarding/src/api/questionnaire/list-questionnaires-by-user-uc.ts`
- `packages/onboarding/src/api/module.ts`
- `packages/onboarding/src/domain/module.ts`
- `packages/user/src/api/user/ensure-user-with-role-uc.ts`
- `packages/user/src/api/user/register-guest-uc.ts`
- `packages/user/src/api/user-uc.ts`
- `packages/user/src/domain/facade.ts`
- `packages/user/src/infra/user-in-proc-facade.ts`
- `apps/u7-bot/src/bot.ts`
- `apps/u7-bot/src/main.ts`
- `apps/u7-bot/src/api-app.ts`
- `apps/u7-bot/src/context.ts`
- `apps/u7-bot/src/handlers/start-handler.ts`
- `apps/u7-bot/src/handlers/cancel-handler.ts`
- `packages/core/src/api/uc/use-case.ts`
- (плюс соответствующие тестовые файлы)

## Принятые архитектурные решения
1. **Stateless Controller**: Контроллер не хранит данные между запросами, каждый раз запрашивает актуальное состояние из домена. Система устойчива к перезапускам.
2. **Агрегат как единственный источник истины**: Вся логика валидации ответов и переключения между вопросами сосредоточена в `QuestionnaireAr.handleAction`.
3. **Типизированный контракт UI-API**: `BotUpdate` (вход) и `BotResponse` (выход с `sendMessage`/`editMessage`) — чистый интерфейс между ботом и контроллером.
4. **Безопасность через явную регистрацию**: Бот регистрирует гостей через `RegisterGuestUc`, а повышение ролей (`ADMIN`) требует авторизации.
5. **Автоматизация ролей**: При завершении анкеты `HandleOnboardingActionUc` сам вызывает `UserFacade.addRoleToUser` для выдачи `STUDENT`.

## Отклонения от плана
- `OnboardingController` был обновлён сразу (а не во втором треке), так как старая версия была несовместима с новыми типами данных. Это позволило получить работающие тесты без промежуточного состояния.

## Известные ограничения
- Групповые чаты не поддерживаются (бот работает только в приватных).
- Логика распределения по курсам после онбординга будет реализована в следующих модулях.
