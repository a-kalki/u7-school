# План реализации: Глубокий рефакторинг domain и usecase слоя onboarding

## Фаза 1: Подготовка — ошибки, типы, команды

- [x] Task: Обновить типы QuestionnaireActionResponse `9af8b08`
    - [x] Сделать `selectedAnswers` опциональным во всех вариантах
    - [x] Добавить `nextButton?: string` в вариант `wait_next`

- [x] Task: Добавить BadRequestError и InternalError в ошибки модуля `6de2b91`
    - [x] Добавить `BadRequestError<'BAD_REQUEST', { message: string } | undefined>` в `errors.ts`
    - [x] Добавить `InternalError<'INTERNAL_ERROR', { message: string } | undefined>` в `errors.ts`
    - [x] Добавить оба в `QuestionnaireModuleError`
    - [x] Удалить `QuestionnaireValidationUcError`, `QuestionnaireCompletedUcError`, `QuestionNotFoundUcError` (больше не нужны)

- [ ] Task: Изменить AbandonQuestionnaireCmd с uuid на telegramId
    - [ ] Обновить схему и тип в `abandon-questionnaire-cmd.ts`
    - [ ] Обновить CmdMeta (ошибки)

- [ ] Task: Удалить избыточные команды
    - [ ] Удалить `get-onboarding-state-cmd.ts`
    - [ ] Удалить `get-questionnaire-cmd.ts`
    - [ ] Удалить `list-questionnaires-by-telegram-id-cmd.ts`

- [ ] Task: Обновить `domain/index.ts`
    - [ ] Убрать экспорты удалённых команд (если были прямые экспорты)
    - [ ] Обновить экспорт `errors.ts` (новые типы)

- [ ] Task: Написать тесты для новых типов ошибок
    - [ ] Тест: BadRequestError создаётся через errBadRequest из @u7/core
    - [ ] Тест: BadRequestError включён в QuestionnaireModuleError

- [ ] Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)

## Фаза 2: Агрегат

- [ ] Task: Изменить сигнатуру handleAction
    - [ ] Убрать параметр `questionCode`
    - [ ] Принимать `{ type: 'callback' | 'text'; value: string }`
    - [ ] Агрегат сам получает `currentQuestionCode` из своего состояния

- [ ] Task: Заменить throw new Error на throwBadRequest
    - [ ] `'Команда NEXT доступна только...'` → `this.throwBadRequest(...)`
    - [ ] `'Для текстового вопроса ожидается строка'` → `this.throwBadRequest(...)`
    - [ ] `'Код ответа не может быть пустым'` → `this.throwBadRequest(...)`
    - [ ] `'Неизвестный тип вопроса...'` → `this.throwInternal(...)`

- [ ] Task: Заменить ошибки валидации на throwInternal
    - [ ] В `submitCurrentQuestion` валидация → `this.throwInternal(...)`

- [ ] Task: Сделать selectedAnswers опциональным в ответах
    - [ ] `new_question` и `completed`: `selectedAnswers?` опционально
    - [ ] `wait_next`: `selectedAnswers` всегда есть (когда есть выбранные)

- [ ] Task: Добавить nextButton в wait_next
    - [ ] При `draftAnswers.length > 0` → `nextButton: "next:<questionCode>"`

- [ ] Task: Адаптировать тесты агрегата
    - [ ] Обновить все вызовы `handleAction(qCode, value)` → `handleAction({ type, value })`
    - [ ] Проверить, что ошибки кидаются через BadRequestError/InternalError

- [ ] Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)

## Фаза 3: Usecase-ы

- [ ] Task: Удалить избыточные usecase-ы и их тесты
    - [ ] Удалить `get-onboarding-state-uc.ts`
    - [ ] Удалить `get-questionnaire-uc.ts` + `get-questionnaire-uc.test.ts`
    - [ ] Удалить `list-questionnaires-by-telegram-id-uc.ts` + `list-questionnaires-by-telegram-id-uc.test.ts`

- [ ] Task: Переименовать и обновить StartUc
    - [ ] Файл: `start-questionnaire-uc.ts` → `start-uc.ts`
    - [ ] Класс: `StartQuestionnaireUc` → `StartUc`
    - [ ] Принимает `actorId` в `execute()`
    - [ ] Обновить тест

- [ ] Task: Переименовать и обновить HandleActionUc
    - [ ] Файл: `handle-onboarding-action-uc.ts` → `handle-action-uc.ts`
    - [ ] Класс: `HandleOnboardingActionUc` → `HandleActionUc`
    - [ ] Убрать `questionCode` из команды `HandleOnboardingActionCmd`
    - [ ] Принимает `actorId` в `execute()`
    - [ ] Обновить тест

- [ ] Task: Переименовать и обновить AbandonUc
    - [ ] Файл: `abandon-questionnaire-uc.ts` → `abandon-uc.ts`
    - [ ] Класс: `AbandonQuestionnaireUc` → `AbandonUc`
    - [ ] Контракт принимает `telegramId` (не `uuid`)
    - [ ] Сам находит активную анкету по telegramId
    - [ ] Принимает `actorId` в `execute()`
    - [ ] Обновить тест

- [ ] Task: Обновить api/module.ts
    - [ ] Обновить импорты (новые имена usecase-ов)
    - [ ] Убрать удалённые usecase-ы из массива `useCases`
    - [ ] Обновить `ucName` в usecase-ах на новые значения

- [ ] Task: Обновить api/index.ts
    - [ ] Убрать экспорты удалённых usecase-ов (если были)

- [ ] Task: Обновить api/module.test.ts
    - [ ] `abandon-questionnaire` → `abandon` с `telegramId`
    - [ ] Убрать тест `get-questionnaire`
    - [ ] Обновить тест `handle-onboarding-action` (убрать questionCode)

- [ ] Task: Адаптировать тест контроллера (временно)
    - [ ] Закомментировать/пропустить сломанные тесты (будут починены в следующем треке)
    - [ ] Добавить TODO-комментарий с ссылкой на будущий трек

- [ ] Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)

## Фаза 4: Финальная проверка и чистка

- [ ] Task: Полная проверка
    - [ ] `bun run check:p onboarding` (lint + tsc + test)
    - [ ] `bun test --coverage` для пакета onboarding

- [ ] Task: Обновить `packages/onboarding/src/index.ts` при необходимости

- [ ] Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)
