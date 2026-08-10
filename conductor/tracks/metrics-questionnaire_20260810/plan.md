# План реализации — Трек 2.4a: Модуль questionnaire

## Фаза 1: Создание пакета и доменная модель

- [ ] Task: Создать структуру пакета `packages/questionnaire/` (package.json, tsconfig, barrel exports)
- [ ] Task: Перенести типы: `Questionnaire` (с новой моделью Answer), `Question`, `ChoiceQuestion`, `Condition`, `QuestionnaireActionResponse`
- [ ] Task: Перенести `QuestionPoolService` с адаптацией под новую модель
- [ ] Task: Написать unit-тесты на `QuestionPoolService`
- [ ] Task: Conductor - Ручная верификация 'Доменная модель'

## Фаза 2: Агрегат и политика

- [ ] Task: Перенести `QuestionnairePolicy` (canStart, canRead, canEdit)
- [ ] Task: Реализовать `BaseQuestionnaireAr` с методами: start, handleAction, abandon, findAndSetNextQuestion
- [ ] Task: Интегрировать `Answer` модель (полный контекст при фиксации ответа)
- [ ] Task: Написать unit-тесты на `BaseQuestionnaireAr`
- [ ] Task: Conductor - Ручная верификация 'Агрегат'

## Фаза 3: API слой

- [ ] Task: Создать `QuestionnaireRepo` интерфейс
- [ ] Task: Создать UseCase: start, handleAction, abandon, getQuestionnaire, getQuestionnairesByUser
- [ ] Task: Создать `QuestionnaireApiModule`
- [ ] Task: Создать `QuestionnaireFacade`
- [ ] Task: Написать unit-тесты на UseCase (с мок-репо)
- [ ] Task: Conductor - Ручная верификация 'API'

## Фаза 4: Infra и интеграция

- [ ] Task: Реализовать `QuestionnaireJsonRepo`
- [ ] Task: Реализовать `QuestionPoolJsonLoader` (загрузка пула из JSON-конфигурации)
- [ ] Task: Написать интеграционные тесты на repo
- [ ] Task: Проверить `bun run check:p questionnaire`
- [ ] Task: Conductor - Ручная верификация 'Infra'
