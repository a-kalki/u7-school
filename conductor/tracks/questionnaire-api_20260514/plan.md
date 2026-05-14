# План реализации: API-слой анкеты onboarding и контроллер бота

## Фаза 1: Репозиторий, политика и доменные команды questionnaire
- [x] Task: Создать `QuestionnaireRepo` интерфейс (`domain/questionnaire/repo.ts`)
    - [ ] Методы: `save`, `getByUuid`, `getByUserId` (возвращает `Questionnaire[]`)
- [x] Task: Создать `QuestionnaireJsonRepo` (`infra/db/questionnaire-json-repo.ts`)
    - [ ] Реализация на `JsonFileRepo<Questionnaire>`
- [x] Task: Создать `QuestionnairePolicy` (`domain/questionnaire/policy.ts`)
    - [ ] `canRead(actor, questionnaire)` — владелец, ADMIN, MENTOR
    - [ ] `canList(actor)` — ADMIN, MENTOR
    - [ ] `canSubmitAnswer(actor, questionnaire)` — только владелец и только если `in_progress`
    - [ ] `canAbandon(actor, questionnaire)` — владелец или ADMIN
    - [ ] `isOwner(actor, questionnaire)` — проверка по `userId`
    - [ ] Написать тесты `policy.test.ts`
- [x] Task: Создать доменные команды questionnaire (`domain/questionnaire/commands/`)
    - [ ] `start-questionnaire-cmd.ts` — схема, тип, мета, ошибки
    - [ ] `submit-answer-cmd.ts` — схема, тип, мета, ошибки
    - [ ] `get-questionnaire-cmd.ts` — схема, тип, мета, ошибки
    - [ ] `abandon-questionnaire-cmd.ts` — схема, тип, мета, ошибки
    - [ ] `list-questionnaires-by-user-cmd.ts` — схема, тип, мета, ошибки
- [x] Task: Написать тесты для `QuestionnaireJsonRepo`
- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: UseCase слой questionnaire
- [~] Task: Пересоздать `OnboardingUseCase` (`api/onboarding-uc.ts`)
    - [ ] Убрать зависимость от Application
    - [ ] Добавить `getQuestionnaire()`, `getActor()`, `throwAccessDenied()`
- [x] Task: Создать `StartQuestionnaireUc` + тесты (`api/questionnaire/start-questionnaire-uc.ts`)
    - [ ] Использовать `QuestionPoolService` из `resolve`
    - [ ] Сохранять в `QuestionnaireRepo`
- [x] Task: Создать `SubmitAnswerUc` + тесты (`api/questionnaire/submit-answer-uc.ts`)
    - [ ] При `completed` вызывать `UserFacade.addRoleToUser(userId, CANDIDATE)`
    - [ ] Явный комментарий: операции не в транзакции
    - [ ] Сохранять анкету после обновления роли
- [x] Task: Создать `GetQuestionnaireUc` + тесты (`api/questionnaire/get-questionnaire-uc.ts`)
- [x] Task: Создать `AbandonQuestionnaireUc` + тесты (`api/questionnaire/abandon-questionnaire-uc.ts`)
- [x] Task: Создать `ListQuestionnairesByUserUc` + тесты (`api/questionnaire/list-questionnaires-by-user-uc.ts`)
- [x] Task: Обновить `OnboardingApiModule` (`api/module.ts`)
    - [ ] Зарегистрировать все questionnaire UC
    - [ ] Добавить `questionnaireRepo` и `questionPoolService` в `Resolver`
- [x] Task: Написать интеграционный тест модуля (`api/module.test.ts`) для questionnaire UC
- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Удаление Application
- [x] Task: Удалить `domain/application/` (весь каталог)
- [x] Task: Удалить `api/application/` (все UC)
- [x] Task: Удалить `infra/db/application-json-repo.ts` и тесты
- [x] Task: Удалить `domain/onboarding-ds.ts`
- [x] Task: Обновить `domain/index.ts` — убрать application-экспорты, добавить questionnaire-экспорты
- [x] Task: Обновить `api/index.ts` — убрать application-экспорты
- [x] Task: Обновить `infra/index.ts` — убрать application-экспорты, добавить questionnaire
- [ ] Task: Проверить `bun run check:p onboarding` — чисто
- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)

## Фаза 4: Контроллер бота
- [x] Task: Создать `OnboardingController` (`ui/bot/controller/onboarding-controller.ts`)
    - [ ] `start(userId)` — создаёт анкету, возвращает `{ questionnaireUuid, firstQuestion }`
    - [ ] `submitAnswer(uuid, code, value)` — обрабатывает ответ, возвращает `{ nextQuestion, status, isCompleted }`
    - [ ] `abandon(uuid)` — прерывает анкету
    - [ ] `getCurrentQuestion(uuid)` — текущий вопрос с ответами
    - [ ] `getAnswersPreview(uuid)` — текстовый предпросмотр всех ответов
    - [ ] `canRestart(userId)` — проверка: можно ли начать новую анкету
    - [ ] `getKeyboard(question, selectedValues?)` — строит описание inline-клавиатуры (структура данных, не Telegram-объект)
    - [ ] Controller НЕ зависит от grammy/Telegram — только от UC через `app:api`
- [x] Task: Написать тесты для `OnboardingController`
- [x] Task: Обновить `packages/onboarding/src/index.ts` — экспортировать controller
- [ ] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)

## Фаза 5: Интеграция и финал
- [x] Task: Проверить полное покрытие: `bun test --coverage`
- [x] Task: Проверить lint и tsc: `bun run check:p onboarding`
- [x] Task: Обновить README onboarding-пакета (описать новые UC и controller)
- [ ] Task: Conductor - User Manual Verification 'Фаза 5' (Protocol in workflow.md)
