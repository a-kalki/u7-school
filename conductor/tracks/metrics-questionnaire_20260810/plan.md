# План реализации — Трек 2.4a: Модуль questionnaire

## Фаза 1: Создание пакета и доменная модель

- [x] Task: Создать структуру пакета `packages/questionnaire/` (package.json, tsconfig, barrel exports) [58fb3d4]
- [x] Task: Перенести типы: `Questionnaire` (с новой моделью Answer), `Question`, `ChoiceQuestion`, `Condition`, `QuestionnaireActionResponse` [8c66e1f]
- [x] Task: Перенести `QuestionPoolService` с адаптацией под новую модель [8c66e1f]
- [x] Task: Написать unit-тесты на `QuestionPoolService` [8c66e1f]
- [x] Task: Conductor - Ручная верификация 'Доменная модель' [8c66e1f]

## Фаза 2: Агрегат и политика

- [x] Task: Перенести `QuestionnairePolicy` (canStart, canRead, canEdit) [8c66e1f]
- [x] Task: Реализовать `QuestionnaireAr` с методами: start, handleAction, abandon, findAndSetNextQuestion [8c66e1f]
- [x] Task: Интегрировать `Answer` модель (полный контекст при фиксации ответа) [8c66e1f]
- [x] Task: Написать unit-тесты на `QuestionnaireAr` [8c66e1f]
- [x] Task: Conductor - Ручная верификация 'Агрегат' [8c66e1f]

## Фаза 3: API слой

- [x] Task: Создать `QuestionnaireRepo` интерфейс [8c66e1f]
- [x] Task: Создать UseCase: start, handleAction, abandon, getQuestionnaire, getQuestionnairesByUser [8c66e1f]
- [x] Task: Создать `QuestionnaireApiModule` [8c66e1f]
- [x] Task: Создать `QuestionnaireFacade` [8c66e1f]
- [x] Task: Написать unit-тесты на UseCase (с мок-репо) [8c66e1f]
- [x] Task: Conductor - Ручная верификация 'API' [8c66e1f]

## Фаза 4: Infra и интеграция

- [x] Task: Реализовать `QuestionnaireJsonRepo` [8c66e1f]
- [x] Task: Реализовать `QuestionPoolJsonLoader` (загрузка пула из JSON-конфигурации) [8c66e1f]
- [x] Task: Написать интеграционные тесты на repo [8c66e1f]
- [x] Task: Проверить `bun run check:p questionnaire` [8c66e1f]
- [x] Task: Conductor - Ручная верификация 'Infra' [8c66e1f]
