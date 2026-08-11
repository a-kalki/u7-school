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

> **Примечание:** на этапе реализации типы будут выведены из схем валидации (zod/typebox). Здесь — концептуальная модель.

```typescript
// Базовая анкета — чистый движок «вопрос-ответ».
interface Questionnaire {
  uuid: string;
  respondentId: number;        // кто заполняет
  status: 'intention' | 'in_progress' | 'completed' | 'abandoned';
  currentQuestionCode: string | null;   // для навигации / продолжения «потом»
  draftAnswers: Record<string, string>; // незакоммиченные черновики
  answers: Answer[];           // зафиксированные ответы
  questionPool: Question[] | null;  // null в intention, снимок при in_progress
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// Метрик-анкета. Добавляет «о ком», контекст, роль, триггер и предвычисленные баллы.
interface MetricQuestionnaire extends Questionnaire {
  subjectId: number;   // о ком анкета
  context: string;     // "module_completed" | "pair_programming" | "code_review" | "initiative"
  role: string;        // "student_student" | "mentor_student" | "student_mentor"
  triggerEvent: {      // что породило анкету
    type: string;
    aggregateId: string;
  } | null;
  metricScores: MetricScore[] | null; // вычисляется при complete()
}
```
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

`QuestionnaireAr` — абстрактный агрегат (от него унаследуется `MetricQuestionnaireAr` в треке 2.4b):

- `start(questionPool)` — получает пул вопросов, сохраняет снимок в state, выдаёт первый вопрос
- `handleAction(action)` — обрабатывает ответ пользователя, фиксирует `Answer`, определяет следующий вопрос
- `abandon()` — бросает анкету
- `findAndSetNextQuestion()` — внутренний метод навигации
- События: `QuestionnaireStarted`, `QuestionnaireCompleted`, `QuestionnaireAbandoned`

## FR5 — Фасад

`QuestionnaireFacade` — единственная точка входа для потребителей:

- `start(respondentId, questionPool)` → создаёт агрегат сразу в `in_progress` (для онбординга), возвращает первый `QuestionnaireActionResponse`
- `createIntention(context, role, subjectId, respondentId)` → создаёт агрегат в статусе `intention` (пул = null), возвращает `{ questionnaireId, message }`
- `startMetric(questionnaireId, questionPool, triggerEvent?)` → переводит `intention` → `in_progress`, сохраняет снимок пула
- `handleAction(questionnaireId, action)` → обрабатывает ответ, возвращает следующий шаг
- `getQuestionnaire(questionnaireId)` → полная анкета с answers
- `getQuestionnairesByUser(telegramId)` → все анкеты пользователя

## FR6 — Структура пакета

```
packages/questionnaire/src/
  domain/
    questionnaire/
      entity.ts            — Questionnaire, Answer типы
      a-root.ts            — QuestionnaireAr
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

- Unit-тесты на `QuestionnaireAr`: жизненный цикл, навигация, ветвление
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
- Intention-паттерн через статусы агрегата (→ Трек 3.1)
- Перевод onboarding на новый questionnaire (→ Трек 2.5)
- UI-контроллер для questionnaire

## Контекст и связанные документы

- [Система сбора метрик (родитель)](../metrics-system.md) — видение, архитектурные решения
- [2. Questionnaire + EventBus](../metrics-questionnaire-and-events.md) — техническая спецификация
- [Дорожная карта](../development-roadmap.md) — Релиз 3
- [Трек 2.3 — publishEvents](../tracks/metrics-publish-events_20260810/spec.md) — базовая механика
- [Текущий onboarding](../code_styleguides/domain-boundaries.md) — точка старта для вырезания
