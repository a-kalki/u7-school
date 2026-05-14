# Итоговый отчёт: API-слой анкеты onboarding и контроллер бота

## Цель
Реализовать API-слой (usecase, command, module) для доменного агрегата `Questionnaire` в `@u7/onboarding`. Удалить устаревший агрегат `Application`. Создать `OnboardingController` для Telegram-бота.

## Выполненные задачи

### Фаза 1: Репозиторий, политика и доменные команды
- Создан `QuestionnaireRepo` интерфейс (`domain/questionnaire/repo.ts`)
- Создан `QuestionnaireJsonRepo` (`infra/db/questionnaire-json-repo.ts`)
- Создан `QuestionnairePolicy` с полным набором правил доступа + тесты
- Созданы доменные команды: `start-questionnaire`, `submit-answer`, `get-questionnaire`, `abandon-questionnaire`, `list-questionnaires-by-user`

### Фаза 2: UseCase слой
- Пересоздан `OnboardingUseCase` — убрана зависимость от Application, добавлены `getQuestionnaire()`, `getActor()`, `throwAccessDenied()`
- Созданы UC: `StartQuestionnaireUc`, `SubmitAnswerUc`, `GetQuestionnaireUc`, `AbandonQuestionnaireUc`, `ListQuestionnairesByUserUc`
- Обновлён `OnboardingApiModule` — зарегистрированы все UC
- Написан интеграционный тест модуля

### Фаза 3: Удаление Application
- Удалён весь `domain/application/`
- Удалены все `api/application/*`
- Удалён `infra/db/application-json-repo.ts` и тесты
- Удалён `domain/onboarding-ds.ts`
- Обновлены `domain/index.ts`, `api/index.ts`, `infra/index.ts`

### Фаза 4: Контроллер бота
- Создан `OnboardingController` (`ui/bot/controller/onboarding-controller.ts`)
- Реализованы методы: `start`, `submitAnswer`, `abandon`, `getCurrentQuestion`, `getAnswersPreview`, `canRestart`, `getKeyboard`
- Controller не зависит от Telegram/grammy
- Написаны тесты для контроллера

### Интеграция с User модулем
- Добавлен метод `addRoleToUser` в `UserFacade` интерфейс
- Реализован в `UserInProcFacade`

## Результаты
- **87 тестов**, 0 падений
- `bun run check:p onboarding` — чисто (только warnings)
- Покрытие кода новых файлов ~75-100%

## Архитектурные решения
- Aggregates (`QuestionnaireAr`) владеют логикой анкеты; UC только оркестрируют
- `UserFacade.addRoleToUser` вызывается при завершении анкеты — без транзакции
- Controller получает `QuestionPoolService` напрямую для построения клавиатур и получения вопросов
- `getOutQuestionnaire` в UC скрывает приватные анкеты от неавторизованных пользователей

## Изменённые/созданные файлы
### Новые
- `packages/onboarding/src/domain/questionnaire/repo.ts`
- `packages/onboarding/src/domain/questionnaire/policy.ts`
- `packages/onboarding/src/domain/questionnaire/policy.test.ts`
- `packages/onboarding/src/domain/questionnaire/commands/*.ts`
- `packages/onboarding/src/infra/db/questionnaire-json-repo.ts`
- `packages/onboarding/src/infra/db/questionnaire-json-repo.test.ts`
- `packages/onboarding/src/api/questionnaire/*.ts`
- `packages/onboarding/src/api/questionnaire/*.test.ts`
- `packages/onboarding/src/ui/bot/controller/onboarding-controller.ts`
- `packages/onboarding/src/ui/bot/controller/onboarding-controller.test.ts`

### Изменённые
- `packages/onboarding/src/api/module.ts`
- `packages/onboarding/src/api/module.test.ts`
- `packages/onboarding/src/api/onboarding-uc.ts`
- `packages/onboarding/src/api/index.ts`
- `packages/onboarding/src/domain/module.ts`
- `packages/onboarding/src/domain/index.ts`
- `packages/onboarding/src/domain/questionnaire/errors.ts`
- `packages/onboarding/src/domain/questionnaire/index.ts`
- `packages/onboarding/src/infra/index.ts`
- `packages/onboarding/src/index.ts`
- `packages/user/src/domain/facade.ts`
- `packages/user/src/infra/user-in-proc-facade.ts`

### Удалённые
- Весь `packages/onboarding/src/domain/application/`
- Весь `packages/onboarding/src/api/application/`
- `packages/onboarding/src/infra/db/application-json-repo.ts`
- `packages/onboarding/src/infra/db/application-json-repo.test.ts`
- `packages/onboarding/src/domain/onboarding-ds.ts`
