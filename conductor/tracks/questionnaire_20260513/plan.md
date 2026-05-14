# План реализации: Пул вопросов и движок анкеты

## Фаза 1: Подготовка и миграция типов
- [ ] Task: Удалить `questionnaire-requirements.md` из старого трека (больше не нужен).
- [ ] Task: Создать `domain/questionnaire/answer-types/`.
- [ ] Task: Перенести `source.ts`, `experience.ts`, `goals.ts`, `intensity.ts`, `base-days.ts`, `base-time.ts`, `intensive-time.ts`, `format.ts` из `domain/application/` в `domain/questionnaire/answer-types/`.
- [ ] Task: Обновить импорты в `domain/application/answers.ts` и других зависимых файлах.
- [ ] Task: Удалить старый `domain/questionnaire/config.ts` и `config.test.ts`.
- [ ] Task: Написать тесты на валидность `question-pool.json` (структура, уникальность кодов, наличие answers у choice-вопросов).
- [ ] Task: Conductor — User Manual Verification 'Подготовка и миграция типов' (Protocol in workflow.md)

## Фаза 2: QuestionPoolService
- [ ] Task: Определить типы `Question`, `AnswerOption`, `Condition` в `domain/questionnaire/question.ts`.
- [ ] Task: Реализовать `QuestionPoolService`:
  - загрузка JSON из файловой системы при инициализации;
  - `getAll(): Question[]`;
  - `getByCode(code): Question | undefined`;
  - `getActive(questionnaireCodes): Question[]`;
  - `findNext(currentCode, answers, questionnaireCodes): Question | null` (с учётом condition).
- [ ] Task: Написать тесты на `QuestionPoolService`:
  - загрузка пула;
  - поиск по коду;
  - фильтрация активных;
  - ветвление base/intensive;
  - вопрос без condition всегда показывается;
  - последний вопрос → null.
- [ ] Task: Conductor — User Manual Verification 'QuestionPoolService' (Protocol in workflow.md)

## Фаза 3: QuestionnaireAr
- [ ] Task: Определить `QuestionnaireState` и `AnswerEntry` в `domain/questionnaire/questionnaire-state.ts`.
- [ ] Task: Определить ошибки: `QuestionnaireValidationError`, `QuestionnaireCompletedError`, `QuestionNotFoundError`.
- [ ] Task: Реализовать `QuestionnaireAr`:
  - `start(userId): QuestionnaireAr` — фабричный метод;
  - `submitAnswer(questionCode, answerCodes / textValue)` — валидация + сохранение;
  - `getNextQuestion(): Question | null` — с учётом condition;
  - `abandon(): void`;
  - `getCurrentState(): QuestionnaireState`;
  - `getAnswers(): AnswerEntry[]`.
- [ ] Task: Реализовать автогенерацию Valibot-схемы в `submitAnswer`:
  - `multiple = false` → `v.picklist(answerCodes)`;
  - `multiple = true` → `v.pipe(v.array(v.string()), v.minLength(1), v.everyItem(v.picklist(answerCodes)))`.
- [ ] Task: Написать тесты на `QuestionnaireAr`:
  - создание и первый вопрос;
  - валидация одиночного выбора;
  - валидация множественного выбора;
  - валидация ошибки (неверный код, пустой массив);
  - прохождение полной анкеты с ветвлением;
  - завершение → null + completed;
  - abandon;
  - получение answers для заявки.
- [ ] Task: Conductor — User Manual Verification 'QuestionnaireAr' (Protocol in workflow.md)

## Фаза 4: Финал
- [ ] Task: Проверить покрытие (>80%).
- [ ] Task: Проверить lint (`bun run lint:p onboarding`).
- [ ] Task: Проверить tsc (`bun run tslint:p onboarding`).
- [ ] Task: Обновить экспорты в `domain/questionnaire/index.ts`.
- [ ] Task: Обновить `domain/index.ts` если нужно.
- [ ] Task: Conductor — User Manual Verification 'Финал' (Protocol in workflow.md)
