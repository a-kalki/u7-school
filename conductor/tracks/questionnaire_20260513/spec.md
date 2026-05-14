# Спецификация: Пул вопросов и движок анкеты

## Обзор
Реализовать доменный слой для управления onboarding-анкетой в `@u7/onboarding`.  
Ключевая идея: **UI — проводник**, агрегат `QuestionnaireAr` — источник истины о состоянии прохождения.  
Все вопросы и варианты ответов вынесены в единый JSON-пул; текущий анкетник — массив `questionCode` (живёт в коде).

> ⚠️ Вопросы больше не хардкодятся в TypeScript. Источник единой правды — `question-pool.json`.

## Архитектура

```
domain/questionnaire/
├── question-pool.json          # единый пул всех вопросов и ответов
├── question-pool-service.ts    # загружает JSON, отвечает за поиск/фильтрацию
├── questionnaire-ar.ts         # агрегат: проводит пользователя через анкету
├── questionnaire-state.ts      # схема состояния прохождения
├── question.ts                 # типы Question / AnswerOption / Condition
└── answer-types/               # перенесённые сюда типы ответов
    ├── source.ts
    ├── experience.ts
    ├── goals.ts
    ├── intensity.ts
    ├── base-days.ts
    ├── base-time.ts
    ├── intensive-time.ts
    └── format.ts
```

### `question-pool.json`
Массив объектов:

```ts
interface Question {
  question: string;           // текст для отображения
  questionCode: string;       // уникальный код
  multiple: boolean;          // одиночный / множественный выбор
  condition?: {               // условие показа
    questionCode: string;     // на какой ответ смотрим
    answerCodes: string[];    // хотя бы один из этих кодов → вопрос показывается
  };
  answers: {
    answer: string;           // текст для отображения
    answerCode: string;       // код, сохраняемый в БД
  }[];
}
```

- Пул содержит **все** вопросы когда-либо существовавшие.
- Устаревшие вопросы остаются в JSON, но исключаются из текущего анкетника.
- Ветвление реализовано через `condition` (пока OR по `answerCodes`).

### Текущий анкетник
Массив в коде:

```ts
const questionnaire = [
  "how_found",
  "interest_reason",
  "experience",
  "format",
  "goals",
  "intensity",
  "base_days",
  "base_time",
  "intensive_time",
];
```

- Порядок вопросов определяется порядком в этом массиве.
- Агрегат использует `question-pool-service` для разрешения `questionCode` → `Question`.

### `QuestionPoolService`
Не репозиторий — сервис, загружающий JSON при старте:

- `getAll()` → `Question[]` (весь пул).
- `getByCode(code)` → `Question | undefined`.
- `getActive(questionnaireCodes)` → `Question[]` (фильтрация по текущему анкетнику).
- `findNext(currentCode, answers, questionnaireCodes)` → `Question | null` (с учётом condition).

### `QuestionnaireAr` — агрегат прохождения
Состояние:

```ts
interface QuestionnaireState {
  uuid: string;
  userId: string;
  status: "in_progress" | "completed" | "abandoned";
  answers: AnswerEntry[];     // все данные ответов
  currentQuestionCode: string | null;
  startedAt: string;
  completedAt?: string;
}

interface AnswerEntry {
  questionCode: string;
  answerCodes: string[];      // для choice-вопросов
  textValue?: string;         // для open-text вопросов
  answeredAt: string;
}
```

API агрегата:

| Метод | Описание |
|-------|----------|
| `start(userId)` | Создаёт новое состояние, возвращает первый вопрос. |
| `submitAnswer(questionCode, answerCodes / textValue)` | Принимает ответ, валидирует его **автоматически сгенерированной схемой** (см. ниже), сохраняет в `answers`. |
| `getNextQuestion()` | Возвращает следующий вопрос с учётом `condition` и уже данных ответов. Если вопросы кончились — возвращает `null` и помечает `status = "completed"`. |
| `getCurrentState()` → `QuestionnaireState` | Текущее состояние для сохранения в репозиторий (UC). |
| `getAnswers()` → `AnswerEntry[]` | Все ответы для формирования заявки. |
| `abandon()` | Прерывает анкету, `status = "abandoned"`. |

### Автогенерация схемы валидации
При `submitAnswer` агрегат:

1. Находит `Question` по `questionCode` через `QuestionPoolService`.
2. Генерирует Valibot-схему динамически:
   - `multiple = false` → `v.pipe(v.string(), v.nonEmpty())` или `v.picklist(answerCodes)`.
   - `multiple = true` → `v.pipe(v.array(v.string()), v.minLength(1))` + `v.everyItem(v.picklist(answerCodes))`.
   - В будущем: `minCount`, `maxCount` и т.д.
3. Валидирует входящие данные по сгенерированной схеме.
4. При ошибке — выбрасывает `QuestionnaireValidationError`.

### Ветвление (condition)
- `getNextQuestion` итеративно перебирает `questionnaire` массив начиная с `currentQuestionCode`.
- Для каждого кандидата проверяет `condition`:
  - `condition = undefined` → показываем.
  - `condition` задано → смотрим в `answers`, есть ли `questionCode` с одним из `answerCodes`.
- Первый прошедший проверку вопрос возвращается как следующий.
- Если нет ни одного — возвращаем `null` (анкета завершена).

### Bot-UI роль
- **Не хранит состояние**. Получает `currentQuestionCode` → запрашивает текст/опции из агрегата → показывает пользователю.
- Получает ответ от пользователя → передаёт в `submitAnswer` → получает следующий вопрос или завершение.
- При `/cancel` вызывает `abandon()`.

### Публичный API (будущее, не в этом треке)
При проектировании закладываем расширяемость:
- `GET /questionnaire/current` → текущий активный анкетник.
- `GET /question-pool` → полный пул (для админки и статистики).
- `GET /statistics/:questionCode` → агрегация ответов.

## Функциональные требования
### QuestionPoolService
- [ ] Загружает `question-pool.json` при инициализации.
- [ ] `getAll()` возвращает все вопросы.
- [ ] `getByCode(code)` возвращает вопрос по коду или `undefined`.
- [ ] `getActive(questionnaireCodes)` фильтрует по текущему анкетнику.
- [ ] `findNext(currentCode, answers, questionnaireCodes)` учитывает `condition`.

### QuestionnaireAr
- [ ] `start(userId)` создаёт состояние `in_progress` с `currentQuestionCode = первый вопрос`.
- [ ] `submitAnswer` валидирует ответ автосгенерированной Valibot-схемой.
- [ ] `submitAnswer` при ошибке валидации выбрасывает `QuestionnaireValidationError`.
- [ ] `submitAnswer` сохраняет ответ в `answers`.
- [ ] `getNextQuestion` возвращает следующий вопрос с учётом condition.
- [ ] `getNextQuestion` возвращает `null` и `status = "completed"`, если вопросы кончились.
- [ ] `abandon` меняет статус на `"abandoned"`.
- [ ] `getCurrentState` возвращает полное состояние для сериализации.
- [ ] `getAnswers` возвращает массив ответов для заявки.

### Схемы ответов
- [ ] Файлы `source.ts`, `experience.ts`, `goals.ts`, `intensity.ts`, `base-days.ts`, `base-time.ts`, `intensive-time.ts`, `format.ts` перенесены в `domain/questionnaire/answer-types/`.
- [ ] Старые файлы в `domain/application/` удалены/обновлены.

## Нефункциональные требования
- Покрытие тестами >80%.
- Все типы покрыты Valibot-схемами.
- TDD: тесты пишутся до реализации.
- Следует DDD-гайдлайнам проекта.

## Критерии приёмки
- [ ] `question-pool.json` создан и загружается сервисом.
- [ ] `QuestionPoolService` проходит unit-тесты.
- [ ] `QuestionnaireAr` создаёт состояние, принимает ответы, переходит к следующему вопросу.
- [ ] Ветвление base/intensive работает корректно.
- [ ] Валидация ответов работает для одиночного и множественного выбора.
- [ ] При завершении всех вопросов агрегат явно сообщает об этом.
- [ ] Схемы ответов перенесены, старые импорты обновлены.
- [ ] Lint и tsc чистые.

## За рамками
- Публичный HTTP API (админка, статистика).
- UI (Telegram-бот).
- Сохранение состояния в БД (делается в другом треке через UC + repo).
- Условия с логикой AND (пока только OR по `answerCodes`).
