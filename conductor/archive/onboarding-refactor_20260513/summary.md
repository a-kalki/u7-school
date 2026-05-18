# Итоговый отчёт трека `onboarding-refactor_20260513`

**Тип:** Refactor  
**Дата:** 2026-05-16

## Цель

Глубокий рефакторинг domain и usecase слоя onboarding. Агрегат стал единым источником истины,
usecase только определяет поток выполнения. Избыточные usecase-ы удалены. Контроллер не
затронут — требования к его будущему рефакторингу зафиксированы в `spec.md`.

---

## Выполненные задачи

### Фаза 1: Подготовка — ошибки, типы, команды

- Обновлён `QuestionnaireActionResponse`: `selectedAnswers` опционально в `new_question` и `completed`,
  добавлен `nextButton?: string` в `wait_next`.
- Удалены устаревшие ошибки: `QuestionnaireValidationUcError`, `QuestionnaireCompletedUcError`,
  `QuestionNotFoundUcError`. Добавлены: `BadRequestUcError`, `InternalUcError`.
- Агрегат переведён на `this.throwBadRequest()` и `this.throwInternal()` вместо фабрик `errConflict`/`errValidation`.
- `AbandonQuestionnaireCmd` изменён с `uuid` на `telegramId`.
- Удалены избыточные команды: `get-onboarding-state-cmd`, `get-questionnaire-cmd`,
  `list-questionnaires-by-telegram-id-cmd` и соответствующие usecase-ы и тесты.

### Фаза 2: Агрегат

- `handleAction(questionCode, value)` → `handleAction({ type: 'callback' | 'text', value: string })`.
  Агрегат сам определяет текущий вопрос из своего состояния.
- Удалён метод `checkIsCurrentQuestionCode` за ненадобностью.
- `'NEXT'` → `'next'` — унифицированный формат сабмита.
- `wait_next` ответ всегда содержит `nextButton: "next:<questionCode>"` при `draftAnswers.length > 0`.
- Все `throw new Error(...)` заменены на `this.throwBadRequest()` / `this.throwInternal()`.

### Фаза 3: Usecase-ы

- Переименованы: `StartQuestionnaireUc` → `StartUc`, `HandleOnboardingActionUc` → `HandleActionUc`,
  `AbandonQuestionnaireUc` → `AbandonUc`.
- `ucName`: `start-questionnaire` → `start`, `handle-onboarding-action` → `handle-action`,
  `abandon-questionnaire` → `abandon`.
- Все три usecase принимают `actorId: string` в `execute()`. `HandleActionUc` использует его
  для выдачи роли `CANDIDATE` при завершении анкеты.
- `HandleActionUc` принимает команду `{ telegramId, type, value }` без `questionCode`.
- `AbandonUc` принимает `telegramId`, сам ищет активную анкету и завершает её.
- Контроллер — минимальные правки для компиляции, тесты пропущены (4 skip).

### Фаза 4: Финальная проверка

- `bun run check:p onboarding` — чисто (lint, tsc, test).
- Тесты: 43 pass, 4 skip, 0 fail.

---

## Изменённые файлы

### Domain
- `domain/questionnaire/types.ts`
- `domain/questionnaire/errors.ts`
- `domain/questionnaire/a-root.ts`
- `domain/questionnaire/a-root.test.ts`
- `domain/questionnaire/commands/abandon-questionnaire-cmd.ts`
- `domain/questionnaire/commands/handle-onboarding-action-cmd.ts`
- `domain/questionnaire/commands/start-questionnaire-cmd.ts`
- `domain/module.ts`

### API
- `api/module.ts`
- `api/module.test.ts`
- `api/onboarding-uc.ts` (не изменён, но контекстно затронут)
- `api/questionnaire/start-uc.ts` (новое имя, был `start-questionnaire-uc.ts`)
- `api/questionnaire/start-uc.test.ts`
- `api/questionnaire/handle-action-uc.ts` (новое имя)
- `api/questionnaire/handle-action-uc.test.ts`
- `api/questionnaire/abandon-uc.ts` (новое имя)
- `api/questionnaire/abandon-uc.test.ts`

### UI
- `ui/bot/controller/onboarding-controller.ts` (минимальные правки для компиляции)
- `ui/bot/controller/onboarding-controller.test.ts` (тесты пропущены)

### Удалены
- `domain/questionnaire/commands/get-onboarding-state-cmd.ts`
- `domain/questionnaire/commands/get-questionnaire-cmd.ts`
- `domain/questionnaire/commands/list-questionnaires-by-telegram-id-cmd.ts`
- `api/questionnaire/get-onboarding-state-uc.ts`
- `api/questionnaire/get-questionnaire-uc.ts`
- `api/questionnaire/get-questionnaire-uc.test.ts`
- `api/questionnaire/list-questionnaires-by-telegram-id-uc.ts`
- `api/questionnaire/list-questionnaires-by-telegram-id-uc.test.ts`

---

## Архитектурные решения

1. **Агрегат — единый источник истины.** `handleAction` принимает только `{ type, value }`,
   без `questionCode`. Агрегат сам знает текущий вопрос и проверяет корректность ответа.

2. **Унифицированная обработка ошибок.** Все ошибки агрегата — через `throwBadRequest` (некорректный
   ввод извне) и `throwInternal` (баг/повреждение данных). Никаких `throw new Error`.

3. **`nextButton` генерируется агрегатом.** Контроллер (в будущем треке) будет просто рендерить
   то, что выдал агрегат, включая кнопку «Далее».

4. **Упрощённый API.** Три usecase-а: `start`, `handle-action`, `abandon`. Имена команд
   короткие и понятные.

5. **`actorId` во всех usecase-ах.** Задел на будущее. Пока реально используется только
   в `HandleActionUc` для выдачи роли `CANDIDATE`.

6. **`telegramId` вместо `uuid` в `AbandonUc`.** Usecase сам находит активную анкету —
   клиенту не нужно знать UUID.

---

## Известные ограничения

- Контроллер (`onboarding-controller.ts`) не рефакторился — требует отдельного трека.
  Требования к нему зафиксированы в `spec.md` (секция «Контекст для будущего трека»).
- Тесты контроллера пропущены (4 skip).
