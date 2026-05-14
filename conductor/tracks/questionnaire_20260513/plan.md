# План реализации: Пул вопросов и движок анкеты

## Фаза 1: QuestionPoolService
- [~] Task: Определить типы `Question`, `AnswerOption`, `Condition` в `domain/questionnaire/question.ts`.
  - `type: "choice" | "text"`.
  - `multiple` — опционально, только для `choice`.
  - `answers` — опционально, только для `choice`.
- [ ] Task: Обновить `question-pool.json` — добавить поле `type: "choice"` ко всем вопросам.
- [ ] Task: Реализовать `QuestionPoolService`:
  - загрузка JSON из файловой системы при инициализации;
  - валидация пула на старте (уникальность questionCode, наличие answers у choice, отсутствие answers у text, уникальность answerCode, валидность condition.questionCode);
  - при ошибке валидации — throw с детальным сообщением;
  - `getAll(): Question[]`;
  - `getByCode(code): Question | undefined`;
  - `buildValidationSchema(questionCode): Valibot schema` — автогенерация схемы для choice (single/multiple) и text.
- [ ] Task: Написать тесты на `QuestionPoolService`:
  - загрузка корректного пула;
  - падение при дублирующемся questionCode;
  - падение при отсутствии answers у choice-вопроса;
  - падение при наличии answers у text-вопроса;
  - поиск по коду;
  - генерация схемы для single choice;
  - генерация схемы для multiple choice;
  - генерация схемы для text.
- [ ] Task: Conductor — User Manual Verification 'QuestionPoolService' (Protocol in workflow.md)

## Фаза 2: QuestionnaireAr
- [ ] Task: Определить `QuestionnaireState` и `AnswerEntry` в `domain/questionnaire/questionnaire-state.ts`.
- [ ] Task: Определить ошибки: `QuestionnaireValidationError`, `QuestionnaireCompletedError`, `QuestionNotFoundError`.
- [ ] Task: Реализовать `QuestionnaireAr`:
  - `start(userId): QuestionnaireAr` — фабричный метод, вызывает `getNextQuestion()` для установки первого вопроса;
  - `submitAnswer(questionCode, answerCodes / textValue)` — запрашивает схему у `QuestionPoolService`, валидирует, сохраняет;
  - `getNextQuestion(): Question | null` — перебирает `questionnaire` массив, учитывает `condition`, возвращает следующий вопрос или `null` (тогда `status = "completed"`);
  - `abandon(): void`;
  - `getCurrentState(): QuestionnaireState`;
  - `getAnswers(): AnswerEntry[]`.
- [ ] Task: Написать тесты на `QuestionnaireAr`:
  - создание и первый вопрос;
  - валидация single choice через схему сервиса;
  - валидация multiple choice;
  - валидация text-ответа;
  - валидация ошибки (неверный код, пустой массив);
  - прохождение полной анкеты с ветвлением base/intensive;
  - завершение → null + completed;
  - abandon;
  - получение answers.
- [ ] Task: Conductor — User Manual Verification 'QuestionnaireAr' (Protocol in workflow.md)

## Фаза 3: Финал
- [ ] Task: Проверить покрытие (>80%).
- [ ] Task: Проверить lint (`bun run lint:p onboarding`).
- [ ] Task: Проверить tsc (`bun run tslint:p onboarding`).
- [ ] Task: Обновить экспорты в `domain/questionnaire/index.ts`.
- [ ] Task: Обновить `domain/index.ts` если нужно.
- [ ] Task: Conductor — User Manual Verification 'Финал' (Protocol in workflow.md)
