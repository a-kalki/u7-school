# Спецификация — Трек 2.4a: Модуль `questionnaire` (выделение из `onboarding`)

## Обзор

Выделить движок анкет из `packages/onboarding/` в новый независимый пакет `packages/questionnaire/`. Модуль предоставляет чистый API для создания и проведения анкет, с полным сохранением контекста вопросов и ответов. Другие модули (onboarding, peer-review, ...) становятся потребителями.

## FR1 — Модель ответа с полным контекстом

Каждый зафиксированный ответ хранит всё, что нужно для последующего анализа без обращения к пулу вопросов:

```typescript
interface Answer {
  questionCode: string;       // код вопроса
  questionText: string;       // текст вопроса на момент ответа
  answerCode: string;         // код выбранного ответа
  answerText: string;         // текст выбранного ответа
  choices: { code: string; text: string }[];  // все варианты ответа
  answeredAt: string;         // ISO
}
```

## FR2 — Модель анкеты

```typescript
interface Questionnaire {
  uuid: string;
  respondentId: number;        // кто заполняет
  subjectId: number | null;    // о ком анкета (null для онбординга)
  questionnaireType: string;   // "onboarding" | "peer_review" | "mentor_review" | "pair_programming" | "code_review"
  triggerEvent: {              // что породило анкету
    type: string;              // "module_completed", "onboarding_start", ...
    aggregateId: string;
  } | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  currentQuestionCode: string | null;   // для навигации / продолжения «потом»
  draftAnswers: Record<string, string>; // незакоммиченные черновики
  answers: Answer[];           // зафиксированные ответы
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}
```

## FR3 — Пул вопросов

`QuestionPoolService` — реестр вопросов, загружаемый из конфигурации. Отвечает за:
- Валидацию структуры вопросов
- Получение следующего вопроса с учётом условий (ветвление)
- Хранение `metricMapping` в вопросах (опциональные метаданные, не обязательные для движка)

Вопрос:

```typescript
interface Question {
  code: string;
  text: string;
  type: 'choice';
  choices: { code: string; text: string }[];
  condition?: Condition;         // ветвление (как сейчас в onboarding)
  metricMapping?: MetricMapping; // опционально, для метрик
}
```

## FR4 — Агрегат

`BaseQuestionnaireAr` — абстрактный агрегат (в будущем от него унаследуется `MetricQuestionnaireAr`):

- `start(questionPool)` — начинает анкету, выдаёт первый вопрос
- `handleAction(action)` — обрабатывает ответ пользователя, фиксирует `Answer`, определяет следующий вопрос
- `abandon()` — бросает анкету
- `findAndSetNextQuestion()` — внутренний метод навигации
- События: `QuestionnaireStarted`, `QuestionnaireCompleted`, `QuestionnaireAbandoned`

## FR5 — Фасад

`QuestionnaireFacade` — единственная точка входа для потребителей:

- `start(type, subjectId, respondentId, triggerEvent?)` → возвращает первый `QuestionnaireActionResponse`
- `handleAction(questionnaireId, action)` → обрабатывает ответ, возвращает следующий шаг
- `getQuestionnaire(questionnaireId)` → полная анкета с answers
- `getQuestionnairesByUser(telegramId)` → все анкеты пользователя

## FR6 — Структура пакета

```
packages/questionnaire/src/
  domain/
    questionnaire/
      entity.ts            — Questionnaire, Answer типы
      a-root.ts            — BaseQuestionnaireAr
      question.ts          — Question, ChoiceQuestion, Condition
      question-pool-service.ts
      types.ts             — QuestionnaireActionResponse
      policy.ts            — QuestionnairePolicy
      repo.ts              — QuestionnaireRepo (интерфейс)
      errors.ts
    index.ts
  api/
    questionnaire/
      start-uc.ts
      handle-action-uc.ts
      abandon-uc.ts
      get-questionnaire-uc.ts
      get-questionnaires-by-user-uc.ts
    module.ts              — QuestionnaireApiModule
  infra/
    db/
      questionnaire-json-repo.ts
      question-pool-json-loader.ts
  index.ts
```

## FR7 — Тесты

- Unit-тесты на `BaseQuestionnaireAr`: жизненный цикл, навигация, ветвление
- Unit-тесты на `QuestionPoolService`: валидация, getNextQuestion, условия
- Unit-тесты на `QuestionnaireFacade` (с моками)
- Интеграционные тесты на `QuestionnaireJsonRepo`

## Критерии приёмки

- [ ] Пакет `questionnaire` создан и компилируется
- [ ] Анкеты создаются и заполняются через новый движок
- [ ] Ответы сохраняются с полным контекстом (Answer со всеми choices)
- [ ] Ветвление вопросов работает
- [ ] Продолжение «потом» работает (currentQuestionCode + draftAnswers)
- [ ] `bun run check:p questionnaire`

## За рамками

- `MetricQuestionnaireAr` и metricMapping (→ Трек 2.4b)
- `IntentionRepo` и intention-паттерн (→ Трек 3.1)
- Перевод onboarding на новый questionnaire (→ Трек 2.5)
- UI-контроллер для questionnaire
