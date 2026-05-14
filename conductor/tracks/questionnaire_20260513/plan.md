# План реализации: Пул вопросов и движок анкеты

## Фаза 1: QuestionPoolService [checkpoint: bf32c1e]
- [x] Task: Определить типы `Question`, `AnswerOption`, `Condition` в `domain/questionnaire/question.ts`.
  - `type: "choice" | "text"`. [a008a69]
  - `multiple` — опционально, только для `choice`. [a008a69]
  - `answers` — опционально, только для `choice`. [a008a69]
- [x] Task: Обновить `question-pool.json` — добавить поле `type: "choice"` ко всем вопросам.
- [x] Task: Реализовать `QuestionPoolService`: [a008a69]
  - загрузка JSON из файловой системы при инициализации;
  - валидация пула на старте (уникальность questionCode, наличие answers у choice, отсутствие answers у text, уникальность answerCode, валидность condition.questionCode);
  - при ошибке валидации — throw с детальным сообщением;
  - `getAll(): Question[]`;
  - `getByCode(code): Question | undefined`;
  - `buildValidationSchema(questionCode): Valibot schema` — автогенерация схемы для choice (single/multiple) и text.
- [x] Task: Написать тесты на `QuestionPoolService`: [a008a69]
  - загрузка корректного пула;
  - падение при дублирующемся questionCode;
  - падение при отсутствии answers у choice-вопроса;
  - падение при наличии answers у text-вопроса;
  - поиск по коду;
  - генерация схемы для single choice;
  - генерация схемы для multiple choice;
  - генерация схемы для text.
- [ ] Task: Conductor — User Manual Verification 'QuestionPoolService' (Protocol in workflow.md)

## Фаза 2: QuestionnaireAr [checkpoint: b6d623c]
- [x] Task: Определить `QuestionnaireState` и `AnswerEntry` в `domain/questionnaire/questionnaire-state.ts`.
- [x] Task: Определить ошибки: `QuestionnaireValidationError`, `QuestionnaireCompletedError`, `QuestionNotFoundError`.
- [x] Task: Реализовать `QuestionnaireAr`: [b6d623c]
  - `start(userId): QuestionnaireAr` — фабричный метод, вызывает `getNextQuestion()` для установки первого вопроса;
  - `submitAnswer(questionCode, answerCodes / textValue)` — запрашивает схему у `QuestionPoolService`, валидирует, сохраняет;
  - `getNextQuestion(): Question | null` — перебирает `questionnaire` массив, учитывает `condition`, возвращает следующий вопрос или `null` (тогда `status = "completed"`);
  - `abandon(): void`;
  - `getCurrentState(): QuestionnaireState`;
  - `getAnswers(): AnswerEntry[]`.
- [x] Task: Написать тесты на `QuestionnaireAr`: [b6d623c]
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

## Фаза 3: Финал [checkpoint: e88a2f1]
- [x] Task: Проверить покрытие (>80%). [e88a2f1]
- [x] Task: Проверить lint (`bun run lint:p onboarding`).
- [x] Task: Проверить tsc (`bun run tslint:p onboarding`).
- [x] Task: Обновить экспорты в `domain/questionnaire/index.ts`.
- [x] Task: Обновить `domain/index.ts` если нужно.
- [ ] Task: Conductor — User Manual Verification 'Финал' (Protocol in workflow.md)
