# Спецификация: Пул вопросов и движок анкеты

## Обзор
Реализовать доменный слой для управления onboarding-анкетой в `@u7/onboarding`.
Агрегат `QuestionnaireAr` — единственный источник истины о состоянии прохождения анкеты: принимает ответы, валидирует их, определяет следующий вопрос с учётом ветвления.

Все вопросы и варианты ответов живут в `question-pool.json`. `QuestionPoolService` загружает пул при старте, проверяет корректность, и отдаёт вопросы по запросу. Генерация схемы валидации — тоже здесь.

> ⚠️ Вопросы больше не хардкодятся в TypeScript. Источник единой правды — `question-pool.json`.

## Архитектура

### `question-pool.json`
Массив объектов:

```ts
interface Question {
  question: string;           // текст для отображения
  questionCode: string;       // уникальный код
  type: "choice" | "text";    // тип вопроса
  multiple?: boolean;         // для choice: одиночный / множественный выбор
  condition?: {               // условие показа
    questionCode: string;     // на какой ответ смотрим
    answerCodes: string[];    // хотя бы один из этих кодов → вопрос показывается
  };
  answers?: {                 // для type = "choice"
    answer: string;
    answerCode: string;
  }[];
}
```

- `type = "choice"` — вопрос с вариантами ответа. `answers` обязателен, `multiple` обязателен.
- `type = "text"` — открытый вопрос. `answers` отсутствует, `multiple` игнорируется.
- Пул содержит **все** вопросы когда-либо существовавшие.
- Устаревшие вопросы остаются в JSON, но исключаются из текущего анкетника (массива в коде).
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
- Агрегат использует `QuestionPoolService` только для разрешения `questionCode` → `Question`.

### `QuestionPoolService`
Не репозиторий — сервис, загружающий JSON при старте приложения:

- **Загрузка и валидация**: при инициализации читает `question-pool.json`, проверяет:
  - Все `questionCode` уникальны.
  - У `type = "choice"` присутствует `answers` (непустой) и `multiple` определён.
  - У `type = "text"` отсутствует `answers`.
  - Все `answerCode` внутри одного вопроса уникальны.
  - `condition.questionCode` ссылается на существующий вопрос в пуле.
  - При любой ошибке — **падает сразу** (fail-fast на старте).
- `getAll()` → `Question[]` (весь пул).
- `getByCode(code)` → `Question | undefined`.
- `buildValidationSchema(questionCode)` → `Valibot schema` (см. ниже).

### Автогенерация схемы валидации
`QuestionPoolService.buildValidationSchema(questionCode)`:

1. Находит `Question` по `questionCode`.
2. Генерирует Valibot-схему:
   - `type = "text"` → `v.pipe(v.string(), v.nonEmpty())`.
   - `type = "choice"`, `multiple = false` → `v.picklist(answerCodes)`.
   - `type = "choice"`, `multiple = true` → `v.pipe(v.array(v.string()), v.minLength(1), v.everyItem(v.picklist(answerCodes)))`.
3. Возвращает схему; вызывающий (`QuestionnaireAr`) сам выполняет `v.parse()`.

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
  textValue?: string;         // для text-вопросов
  answeredAt: string;
}
```

API агрегата:

| Метод | Описание |
|-------|----------|
| `start(userId)` | Создаёт новое состояние, возвращает первый вопрос через `getNextQuestion()`. |
| `submitAnswer(questionCode, answerCodes / textValue)` | Принимает ответ, запрашивает схему у `QuestionPoolService`, валидирует, сохраняет в `answers`. |
| `getNextQuestion()` | Определяет следующий вопрос: перебирает `questionnaire` начиная с `currentQuestionCode`, пропускает вопросы с невыполненным `condition`. Если вопросы кончились — возвращает `null` и помечает `status = "completed"`. |
| `getCurrentState()` → `QuestionnaireState` | Текущее состояние для сохранения в репозиторий (UC). |
| `getAnswers()` → `AnswerEntry[]` | Все ответы для формирования заявки. |
| `abandon()` | Прерывает анкету, `status = "abandoned"`. |

### Ветвление (condition)
- `getNextQuestion` итеративно перебирает `questionnaire` массив начиная с позиции после `currentQuestionCode`.
- Для каждого кандидата проверяет `condition`:
  - `condition = undefined` → показываем.
  - `condition` задано → смотрим в `answers`, есть ли ответ на `questionCode` с одним из `answerCodes`.
- Первый прошедший проверку вопрос возвращается как следующий.
- Если нет ни одного — возвращаем `null` (анкета завершена).

### Application агрегат
> Существующий `ApplicationAr` (`domain/application/`) **будет удалён** в будущем треке. Вся информация о прохождении (статус, ответы) теперь в `QuestionnaireAr`. Пока не трогаем — убираем в отдельный трек.

## Функциональные требования
### QuestionPoolService
- [ ] Загружает `question-pool.json` при инициализации.
- [ ] Валидирует структуру пула на старте; при ошибке — падает с детальным сообщением.
- [ ] `getAll()` возвращает все вопросы.
- [ ] `getByCode(code)` возвращает вопрос по коду или `undefined`.
- [ ] `buildValidationSchema(questionCode)` возвращает Valibot-схему для вопроса.

### QuestionnaireAr
- [ ] `start(userId)` создаёт состояние `in_progress`, устанавливает `currentQuestionCode` через `getNextQuestion()`.
- [ ] `submitAnswer` запрашивает схему у `QuestionPoolService`, валидирует ответ.
- [ ] `submitAnswer` при ошибке валидации выбрасывает `QuestionnaireValidationError`.
- [ ] `submitAnswer` сохраняет ответ в `answers`.
- [ ] `getNextQuestion` возвращает следующий вопрос с учётом condition и уже данных ответов.
- [ ] `getNextQuestion` возвращает `null` и `status = "completed"`, если вопросы кончились.
- [ ] `abandon` меняет статус на `"abandoned"`.
- [ ] `getCurrentState` возвращает полное состояние для сериализации.
- [ ] `getAnswers` возвращает массив ответов.

## Нефункциональные требования
- Покрытие тестами >80%.
- Все типы покрыты Valibot-схемами.
- TDD: тесты пишутся до реализации.
- Следует DDD-гайдлайнам проекта.

## Критерии приёмки
- [ ] `question-pool.json` создан, содержит поле `type`.
- [ ] `QuestionPoolService` валидирует пул на старте и падает при ошибках.
- [ ] `QuestionPoolService.buildValidationSchema` генерирует корректные схемы для choice (single/multiple) и text.
- [ ] `QuestionnaireAr` создаёт состояние, принимает ответы, переходит к следующему вопросу.
- [ ] Ветвление base/intensive работает корректно.
- [ ] При завершении всех вопросов агрегат явно сообщает об этом (`null`).
- [ ] Lint и tsc чистые.

## За рамками
- UI (Telegram-бот).
- Сохранение состояния в БД (делается в другом треке через UC + repo).
- Удаление Application агрегата (отдельный трек).
- Условия с логикой AND (пока только OR по `answerCodes`).
