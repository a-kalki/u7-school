# Итоговый отчёт: Пул вопросов и движок анкеты

## Цель
Реализовать доменный слой для управления onboarding-анкетой в `@u7/onboarding`.

## Выполненные задачи

### Фаза 1: QuestionPoolService
- Типы `Question`, `AnswerOption`, `Condition` в `domain/questionnaire/question.ts`.
- Обновлён `question-pool.json` — валидный JSON с полем `type`.
- Реализован `QuestionPoolService`:
  - Загрузка JSON через `readFileSync`.
  - Валидация пула (уникальность questionCode, наличие answers, уникальность answerCode, condition).
  - `getAll()`, `getByCode()`, `buildValidationSchema()` — авто-схемы Valibot.
- Полное покрытие тестами.

### Фаза 2: QuestionnaireAr
- `QuestionnaireSchema`, `AnswerEntrySchema`, `QuestionnaireStatusSchema` в `entity.ts`.
- Ошибки: `QuestionnaireValidationUcError`, `QuestionnaireCompletedUcError`, `QuestionNotFoundUcError`.
- Реализован `QuestionnaireAr`:
  - `start()` — фабричный метод, определяет первый вопрос.
  - `submitAnswer()` — валидация через `QuestionPoolService`, сохранение ответа.
  - `getNextQuestion()` — ветвление по `condition`.
  - `abandon()`, `getCurrentState()`, `getAnswers()`.
- 11 тестов, покрывающих все сценарии.

### Фаза 3: Финал
- Покрытие кода новых файлов: 100%.
- Lint (`biome`) и TypeScript (`tsc --noEmit`) чистые.
- Обновлены экспорты в `domain/questionnaire/index.ts` и `domain/index.ts`.

## Файлы
- `packages/onboarding/src/domain/questionnaire/question.ts`
- `packages/onboarding/src/domain/questionnaire/question-pool.json`
- `packages/onboarding/src/domain/questionnaire/question-pool-service.ts`
- `packages/onboarding/src/domain/questionnaire/question-pool-service.test.ts`
- `packages/onboarding/src/domain/questionnaire/entity.ts`
- `packages/onboarding/src/domain/questionnaire/errors.ts`
- `packages/onboarding/src/domain/questionnaire/a-root.ts`
- `packages/onboarding/src/domain/questionnaire/a-root.test.ts`
- `packages/onboarding/src/domain/questionnaire/index.ts`
- `packages/onboarding/src/domain/index.ts`

## Архитектурные решения
- **QuestionPoolService** — не репозиторий, а read-only сервис, загружающий пул при старте. Fail-fast валидация.
- **QuestionnaireAr** принимает `QuestionPoolService` и `questionCodes` через конструктор. Это позволяет тестировать с разными пулами и порядками вопросов.
- **Ветвление** реализовано через `condition` (OR по `answerCodes`) в `getNextQuestion()`.
- **Valibot-схемы** генерируются динамически через `buildValidationSchema`.

## Отклонения от плана
- `startedAt` переименовано в `createdAt` для совместимости с `Aggregate` из `@u7/core`.
- `question-pool.json` полностью переписан в валидный JSON (был YAML-подобный).

## Ограничения
- Пока нет слоя API (UseCase) и репозитория для сохранения состояния анкеты.
- `QuestionPoolService` загружает JSON через `readFileSync` — для production может потребоваться кэширование.
