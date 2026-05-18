# Глубокий рефакторинг domain и usecase слоя onboarding

## Обзор
Переработать слой domain (агрегат `QuestionnaireAr`) и usecase-ы модуля onboarding так,
чтобы агрегат стал единым источником истины, usecase только определяет поток выполнения,
а избыточные usecase-ы удалены. Контроллер (`onboarding-controller.ts`) в этом треке
**не меняется** — требования к его будущему рефакторингу зафиксированы в секции
«Контекст для будущего трека».

## Функциональные требования

### FR1: Агрегат — единый источник истины
- Вся логика валидации ответов, проверки текущего вопроса и ветвления находится в `QuestionnaireAr`.
- Метод `handleAction` принимает **только** `{ type: 'callback' | 'text'; value: string }` —
  без `questionCode`. Агрегат сам знает текущий вопрос и сам проверяет корректность ответа.
- На любой некорректный запрос агрегат выбрасывает `BadRequestError`.
- Любая неожиданная ошибка (включая ошибки валидации) → `InternalError` (агрегат обязан гарантировать корректность).

### FR2: Унифицированная обработка ошибок агрегатом
- Некорректные запросы извне → `this.throwBadRequest(...)` (замена `throw new Error(...)`).
- Внутренние ошибки → `this.throwInternal(...)`.
- Методы уже есть в базовом классе `Aggregate` из `@u7/core`.

### FR3: nextButton в ответе агрегата
- Для вопросов с `multiple: true`, если есть хотя бы один выбранный ответ (`draftAnswers.length > 0`),
  агрегат добавляет в ответ (`wait_next`) поле `nextButton: "next:<questionCode>"`.
- Контроллер (в будущем треке) будет рендерить эту кнопку как `-->`.

### FR4: Оставляем три usecase-а
Оставить только необходимые для работы бота:
- **`StartUc`** — начало анкеты (переименован из `StartQuestionnaireUc`).
  Логика: проверить нет ли активной, создать агрегат, сохранить.
- **`HandleActionUc`** — обработка действий (callback/text).
  Логика: найти активную анкету по `telegramId`, вызвать `ar.handleAction()`, сохранить.
  При `completed` — выдать роль `CANDIDATE` через `userFacade`.
- **`AbandonUc`** — прерывание анкеты.
  **Контракт изменён:** принимает `telegramId` (не `uuid`). Usecase сам находит активную анкету
  и вызывает `ar.abandon()`.

### FR5: actorId во всех usecase-ах
- Все три usecase получают `actorId: string` (UUID бота) в `execute()`.
- `HandleActionUc` использует `actorId` для выдачи роли (`addRoleToUser`).
- `StartUc` и `AbandonUc` принимают `actorId`, но пока не используют (задел на будущее).

### FR6: Удалить избыточные usecase-ы и команды
Удалить:
- `GetOnboardingStateUc` + `get-onboarding-state-cmd.ts`
- `GetQuestionnaireUc` + `get-questionnaire-cmd.ts` + `get-questionnaire-uc.test.ts`
- `ListQuestionnairesByTelegramIdUc` + `list-questionnaires-by-telegram-id-cmd.ts` + тест
- Тип `OnboardingState` (из get-onboarding-state-cmd)
- Импорты из `module.ts`, `api/index.ts`, `domain/index.ts`.

### FR7: Изменения в QuestionnaireActionResponse
```ts
type QuestionnaireActionResponse =
  | { type: 'wait_next'; question: Question; selectedAnswers: string[]; nextButton?: string }
  | { type: 'new_question'; question: Question; selectedAnswers?: string[] }
  | { type: 'completed'; selectedAnswers?: string[] }
```
- `selectedAnswers` — опционально. Если `undefined`/отсутствует — контроллер не трогает предыдущее сообщение.
  Если есть (даже пустой массив) — перерендерит (пустой массив = все не отмечены).
- `nextButton` имеет формат `"next:<questionCode>"`.

### FR8: Обновление ошибок модуля
- Удалить `QuestionnaireValidationUcError`, `QuestionCompletedUcError`, `QuestionNotFoundUcError` (больше не нужны).
- Добавить `BadRequestError<'BAD_REQUEST', ...>` и `InternalError<'INTERNAL_ERROR', ...>`.
- Обновить `QuestionnaireModuleError`.

### FR9: Policy
- `QuestionnairePolicy` остаётся без изменений (в этом треке usecase-ы не используют авторизацию).

## Нефункциональные требования
- **NFR1:** Все существующие тесты должны проходить после рефакторинга (с адаптацией под новые сигнатуры).
- **NFR2:** TDD: тесты пишутся перед реализацией.
- **NFR3:** Покрытие >80% для изменённого кода.
- **NFR4:** Код проходит `bun run check:p onboarding`.

## Критерии приёмки
- [ ] `bun test` — все тесты проходят
- [ ] `bun run check:p onboarding` — без ошибок
- [ ] Агрегат выбрасывает `BadRequestError` на некорректные запросы (нет `throw new Error`)
- [ ] `handleAction` принимает `{ type, value }` без `questionCode`
- [ ] `wait_next` ответ содержит `nextButton` при наличии выбранных ответов
- [ ] `AbandonUc` принимает `telegramId`
- [ ] Удалены 3 usecase-а и связанные команды
- [ ] `actorId` передаётся во все usecase-ы

## За рамками (out of scope)
- Рефакторинг контроллера (`onboarding-controller.ts`)
- Изменения в `ui/bot/`
- Добавление авторизации в usecase-ы

## Контекст для будущего трека (контроллер)
Контроллер должен стать «очень глупым»:
- **`start` command** → вызывает `StartUc` и рендерит первый вопрос.
- **`cancel` command** → вызывает `AbandonUc` и отправляет сообщение «Опросник прерван».
- **callback / message** → вызывает `HandleActionUc` и:
  - Если есть `selectedAnswers` (не undefined) → `editMessage` с `[x]` у выбранных.
  - Если есть `nextButton` → добавить кнопку `-->` со значением `nextButton`.
  - `wait_next` → нового сообщения нет.
  - `new_question` → рендерит новое сообщение.
  - `completed` → сообщение «Спасибо! Заявка принята».
  - Перехватывает ошибки → сообщение пользователю.
