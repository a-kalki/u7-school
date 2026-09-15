# Архитектурная концепция: Domain Manifest Graph (DMG)
### Единая система деклараций, сквозной типизации, политик доступа, обработки ошибок через Result и каузального анализа доменной модели

---

## 1. Проблематика и контекст (Боль / As-Is)

Проект `u7-school` построен на принципах DDD и чистой архитектуры:
- **Стратегический уровень:** деление на изолированные Bounded Contexts (`user`, `course`, `stream`, `wish`, `questionnaire`, `app`, `core`).
- **Тактический уровень:** богатые агрегаты (`Aggregate<ArMeta>`), доменные сервисы, события (`DomainEvent`), хранилища (`Repo`).
- **Слой API:** UseCases (команды и запросы), EventReactions (реакции на события), Jobs (периодические задания), фасады межмодульного взаимодействия.
- **Слой UI:** пользовательские сценарии (Stories), сгруппированные по контроллерам и целям пользователя.

Несмотря на наличие базовых мета-типов (`ArMeta`, `UcMeta`, `ErMeta`, `JobMeta`, `ApiModuleMeta`), в текущей кодовой базе существуют критические архитектурные разрывы:

### 1.1. Разрывы графа зависимостей
1. **Агрегат изолирован от своих операций:** `ArMeta` знает своё состояние и опциональный union событий, но не знает, какие UseCases им управляют (какие команды создают агрегат, какие переводят его статусы, какие читают). Выразить это в типах TypeScript напрямую мешает инверсия слоев: `domain` не имеет права импортировать `api`.
2. **UseCase скрывает побочные эффекты:** `UcMeta` типизирует вход (`input`), выход (`output`) и ошибки (`errors`), но **не декларирует порождаемые события**. События генерируются неявно внутри методов агрегата через `addEvent()` и затем сбрасываются через `publishEvents(ar)`. Ни типы, ни документация не показывают, к каким событиям приведет выполнение команды.
3. **«Слепые» реакции и задания:** `ErMeta` знает только имя входящего события. Какие агрегаты реакция мутирует, какие внешние фасады вызывает и какие вторичные события испускает — скрыто в процедурном коде метода `handle()`. `JobMeta` содержит лишь `name` и `label`, не связывая джобу с агрегатами и порождаемыми событиями.
4. **Слепой паспорт модуля:** `ApiModuleMeta` объединяет только список команд `ucMetas`. Реакции модуля, фоновые задания, импортируемые фасады и экспортируемые наружу события в контракте модуля отсутствуют.

### 1.2. Проблема Type Erasure и невидимость для PO / Бизнес-аналитика
TypeScript-типы стираются при компиляции (type erasure). Бизнес-аналитик или Product Owner не могут заглянуть в файлы типов с conditional generics. В результате:
- Невозможно ответить на вопрос: *«Что произойдет в системе, если студент нажмет кнопку X?»* без чтения исходного кода нескольких модулей.
- Ручная документация в Markdown устаревает после первых же рефакторингов.
- Нет инструмента, способного показать каскад эффектов («потянуть за верёвочку») и карту контекстов (Context Map).

### 1.3. Ограниченность ролевой модели (RBAC vs ABAC/Ownership)
Флаг `requiresAuth: true` и перечисление ролей не отражают доменную реальность:
- Завершение шага (`complete-step`) доступно студенту, но **только своему** (`actor.uuid === student.userId`).
- Управление студентом (`complete-student`, `drop-student`) доступно ментору, но **только того потока, где он назначен куратором** (`actor.uuid === stream.mentorId`).
Сейчас эти проверки закодированы вручную через `if (!Policy.canX(actor, target))` внутри `execute()`. В спецификации команды условия доступа не видны, а пользователю при отказе возвращается неинформативная ошибка.

### 1.4. Проблема обработки ошибок через исключения (`throw Error`)
Решение выбрасывать исключения (`throwError`, `throwAccessDenied`, `throwInternal`) для доменных и API-ошибок привело к ряду серьёзных проблем:
1. **Тяжёлый оверхед в рантайме:** Создание стек-трейса (`new Error()`) в движке V8/Bun является крайне дорогой операцией. Доменные ошибки (например, «студент уже завершил модуль», «поток заполнен», «неверный пин-код») — это штатные, ожидаемые бизнес-исходы, а не программные сбои/паники. Бросать исключение на штатный исход — антипаттерн производительности.
2. **Потеря типизации компилятора:** TypeScript не поддерживает типизированные исключения (`throws`). Сигнатура метода `execute(cmd): Promise<TOutput>` скрывает все возможные ошибки. Разработчик в UI или вызывающем коде не видит, какие ошибки могут вылететь, и не защищён компилятором от забытой обработки.
3. **Невозможность проследить контракт ошибок:** В манифесте `UcMeta` есть поле `errors`, но компилятор никак не гарантирует, что из `execute()` вылетают именно они.
4. **Слепая зона для бизнеса:** Бизнес-аналитик не может получить полный каталог отказов системы по конкретной операции («Почему операция может не пройти?»).

### 1.5. Избыточный Boilerplate разработчика
Для добавления одной команды разработчик вынужден описывать сущность в 5–6 местах: Valibot-схема входа, Valibot-схема выхода, интерфейс `*CmdMeta extends UcMeta`, union типов ошибок `*CmdError`, и повторное дублирование 7 свойств в классе UseCase.

---

## 2. Цели архитектурного решения (To-Be)

1. **Единый источник истины (Single Source of Truth):**
   Разработчик объявляет доменную спецификацию **один раз** в виде декларативного манифеста. Из него автоматически выводятся строгие TypeScript-типы (`typeof manifest.meta`), схемы Valibot, свойства классов ядра и граф системы.
2. **Типизированный функциональный результат (`Result<SUCCESS, FAIL>`):**
   Полный отказ от использования `throw` для ожидаемых бизнес-исходов как на уровне Агрегата (`DomainError`), так и на уровне UseCase (`UcError`). Исключения остаются исключительно для непредвиденных системных сбоев (unhandled crashes, потеря соединения с БД).
3. **Сквозная каузальная трассировка («Дёрнуть за верёвочку»):**
   Возможность мгновенно проследить полный каскад изменений:
   $$\text{Действие в UI} \longrightarrow \text{UseCase} \longrightarrow \text{Мутация агрегата} \longrightarrow \text{Событие} \longrightarrow \text{Реакция в другом модуле} \longrightarrow \text{Вторичные эффекты}$$
4. **Декларативные политики прав (Policy Manifest):**
   Объединение ролей (RBAC), владения (Ownership) и контекста (ABAC) в компонуемые правила с человекочитаемыми описаниями и точными текстами отказов.
5. **Living Documentation & Инспектор для PO/Аналитика:**
   CLI-утилита и автогенерация актуальных диаграмм (Mermaid: State Machine, Sequence, Context Map, Error Catalog) прямо из работающего кода.
6. **Радикальное улучшение DX:**
   Сокращение шаблонного кода на 40–50% за счёт готовых фабрик базовых классов (`UseCaseFromManifest`, `ReactionFromManifest`).
7. **Сохранение чистой архитектуры и плавный переход:**
   Domain-слой не знает об API; переход выполняется модуль за модулем без остановки разработки.

---

## 3. Архитектурное ядро: Паттерн `Result<T, E>` в `@u7-scl/core`

Для обеспечения максимальной производительности (без генерации стек-трейсов) и первоклассного DX в `@u7-scl/core` внедряется функциональный монадический объект `Result<T, E>`.

```typescript
// packages/core/src/shared/result.ts

export type Result<T, E> = Ok<T, E> | Err<T, E>;

export class Ok<T, E = never> {
  readonly ok = true as const;
  constructor(readonly value: T) {}

  isOk(): this is Ok<T, E> { return true; }
  isErr(): this is Err<T, E> { return false; }

  map<U>(fn: (val: T) => U): Result<U, E> {
    return new Ok(fn(this.value));
  }
  mapErr<F>(_fn: (err: E) => F): Result<T, F> {
    return this as unknown as Result<T, F>;
  }
  unwrap(): T {
    return this.value;
  }
  unwrapOr(_defaultValue: T): T {
    return this.value;
  }
  match<R>(branches: { ok: (val: T) => R; err: (err: E) => R }): R {
    return branches.ok(this.value);
  }
}

export class Err<T, E> {
  readonly ok = false as const;
  constructor(readonly error: E) {}

  isOk(): this is Ok<T, E> { return false; }
  isErr(): this is Err<T, E> { return true; }

  map<U>(_fn: (val: T) => U): Result<U, E> {
    return this as unknown as Result<U, E>;
  }
  mapErr<F>(fn: (err: E) => F): Result<T, F> {
    return new Err(fn(this.error));
  }
  unwrap(): never {
    throw new Error(`Called unwrap on Err: ${JSON.stringify(this.error)}`);
  }
  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }
  match<R>(branches: { ok: (val: T) => R; err: (err: E) => R }): R {
    return branches.err(this.error);
  }
}

/** Фабрики для лаконичного синтаксиса */
export const ok = <T>(value: T): Result<T, never> => new Ok(value);
export const err = <E>(error: E): Result<never, E> => new Err(error);
```

### Преимущества DX:
- **Сужение типов в TypeScript (Type Narrowing):** стандартный `if (res.ok)` автоматически сужает ветки до `res.value` и `res.error`.
- **Функциональный `match`:** исчерпывающая обработка веток без boilerplate.
- **Zero-cost в V8:** создание простого объекта `{ ok: true, value }` в 100+ раз быстрее генерации `new Error()`.

---

## 4. Сквозная модель системы ошибок: Агрегат и UseCase

Ошибки разделяются на два изолированных доменных уровня:

```
┌────────────────────────────────────────────────────────────────────────┐
│                               UseCase                                  │
│  Возвращает: Result<TOutput, TUcError>                                 │
│                                                                        │
│  Источники ошибок:                                                     │
│  ├─ Валидация входа (INPUT_VALIDATION_ERROR)                           │
│  ├─ Проверка прав (ACCESS_DENIED_ERROR из Policy Manifest)             │
│  ├─ Инфраструктура / Репозиторий (NOT_FOUND_ERROR)                      │
│  └─ Доменные ошибки Агрегата (маппинг DomainError ➔ UcError)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ вызывает метод агрегата
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              Aggregate                                 │
│  Методы возвращают: Result<void | TEvent, TDomainError>                │
│                                                                        │
│  Проверяет: инварианты, бизнес-правила и допустимость переходов         │
│  НЕ БРОСАЕТ исключений при штатных отказах бизнеса                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 4.1. Доменные ошибки Агрегата (`DomainError`)

Методы агрегата больше не вызывают `throwInternal`. Если бизнес-правило нарушено, метод возвращает `err(domainError)`.

```typescript
// packages/stream/src/domain/student/errors.ts
export type StudentDomainError =
  | { code: 'STUDENT_NOT_ACTIVE'; label: 'Студент не находится на обучении'; currentStatus: string }
  | { code: 'STUDENT_ALREADY_COMPLETED'; label: 'Студент уже завершил данный модуль' };
```

```typescript
// packages/stream/src/domain/student/aggregate.ts
import { Aggregate, ok, err, type Result } from '@u7-scl/core/domain';
import type { StudentDomainError } from './errors';

export class StudentAr extends Aggregate<StudentArMeta> {
  /**
   * Бизнес-метод перевода студента на следующий модуль.
   * Возвращает Result вместо throw!
   */
  advance(moduleId: string): Result<void, StudentDomainError> {
    if (this._state.status !== 'active') {
      return err({
        code: 'STUDENT_NOT_ACTIVE',
        label: 'Студент не находится на обучении',
        currentStatus: this._state.status,
      });
    }

    this.safeUpdate({ status: 'advanced' });
    this.addEvent(new StudentCompletedDomainEvent({
      studentId: this._state.uuid,
      moduleId,
      outcome: 'advanced',
    }));

    return ok(undefined);
  }
}
```

---

### 4.2. Ошибки UseCase (`UcError`) и интеграция в манифест

В манифесте UseCase строго фиксируется каталог всех возможных бизнес-ошибок. Из этого описания компилятор выводит точный union-тип:

```typescript
// packages/stream/src/domain/student/commands/complete-student-cmd.ts
import { defineUseCase } from '@u7-scl/core/api';
import * as v from 'valibot';
import { StudentArManifest } from '../manifest';
import { StudentPolicy } from '../policy';
import { StudentCompletedEventDef } from '../events';

export const CompleteStudentCmdManifest = defineUseCase({
  name: 'complete-student',
  label: 'Завершить прохождение модуля студентом',
  type: 'command',
  operation: 'mutate',
  aggregate: StudentArManifest,
  policy: StudentPolicy.canManage,
  input: v.object({
    studentId: v.pipe(v.string(), v.uuid()),
    streamId: v.pipe(v.string(), v.uuid()),
    outcome: v.picklist(['advanced', 'not_advanced']),
  }),
  output: v.object({
    status: v.picklist(['advanced', 'not_advanced']),
  }),
  emits: [StudentCompletedEventDef],
  // Каталог возможных ошибок операции:
  errors: [
    { code: 'STUDENT_NOT_FOUND', label: 'Студент с указанным ID не найден' },
    { code: 'STREAM_NOT_FOUND', label: 'Поток курса не найден' },
    { code: 'ACCESS_DENIED', label: 'Недостаточно прав для управления студентом' },
    { code: 'STUDENT_NOT_ACTIVE', label: 'Студент не находится в активном статусе' },
  ] as const,
});

export type CompleteStudentCmdMeta = typeof CompleteStudentCmdManifest.meta;
```

---

### 4.3. Реализация класса UseCase с поддержкой Result

Базовый класс `UseCaseFromManifest` предоставляет типизированные хелперы `this.ok()` и `this.err()`. Метод `handle()` защищает от непредвиденных падений, превращая их в безопасный `Result`:

```typescript
// packages/stream/src/api/student/complete-student-uc.ts
import { UseCaseFromManifest } from '@u7-scl/app/domain';
import { CompleteStudentCmdManifest } from '#domain/student/commands/complete-student-cmd';

export class CompleteStudentUc extends UseCaseFromManifest(CompleteStudentCmdManifest) {
  async execute(command, actor) {
    // 1. Поиск сущности (безопасный возврат типизированной ошибки)
    const student = await this.resolve.streamStudentRepo.getByUuid(command.studentId);
    if (!student) {
      return this.err('STUDENT_NOT_FOUND', { studentId: command.studentId });
    }

    // 2. Поиск потока
    const stream = await this.resolve.streamRepo.getByUuid(command.streamId);
    if (!stream) {
      return this.err('STREAM_NOT_FOUND', { streamId: command.streamId });
    }

    // 3. Проверка прав через Policy Manifest
    const access = this.manifest.policy.evaluate(actor, student, stream);
    if (!access.allowed) {
      return this.err('ACCESS_DENIED', { reason: access.denyMessage });
    }

    // 4. Мутация в агрегате через Result
    const studentAr = new StudentAr(student);
    const advanceResult = studentAr.advance(stream.moduleId);
    if (advanceResult.isErr()) {
      // Прямой проброс доменной ошибки агрегата
      return this.err('STUDENT_NOT_ACTIVE', {
        currentStatus: advanceResult.error.currentStatus,
      });
    }

    // 5. Сохранение и публикация событий
    await this.resolve.streamStudentRepo.save(studentAr.state);
    this.publishEvents(studentAr);

    return this.ok({ status: studentAr.state.status });
  }
}
```

#### Исполнение в ядре (`UseCase.handle`):
```typescript
// Внутри базового UseCase:
async handle(command: unknown, actor?: TActor): Promise<Result<TOutput, TUcError>> {
  // Проверка авторизации
  if (this.requiresAuth && actor === undefined) {
    return err({ code: 'UNAUTHORIZED_ERROR', label: 'Требуется авторизация' });
  }

  // Валидация входных данных
  const parsed = v.safeParse(this.inputSchema, command);
  if (!parsed.success) {
    return err({
      code: 'INPUT_VALIDATION_ERROR',
      label: 'Некорректные параметры команды',
      issues: v.flatten(parsed.issues),
    });
  }

  try {
    // Исполнение бизнес-логики (возвращает Result)
    const result = await this.execute(parsed.output, actor);
    if (result.isErr()) return result;

    // Валидация выходных данных
    const outParsed = v.safeParse(this.outputSchema, result.value);
    if (!outParsed.success) {
      return err({ code: 'OUTPUT_VALIDATION_ERROR', label: 'Ошибка выходных данных' });
    }

    return ok(outParsed.output);
  } catch (unexpectedException) {
    // Предотвращение паники процесса: логируем и возвращаем контролируемый Err
    this.logger?.error('Непредвиденное исключение в UseCase', unexpectedException);
    return err({ code: 'SERVER_INTERNAL_ERROR', label: 'Внутренняя ошибка сервера' });
  }
}
```

---

### 4.4. DX на уровне вызывающего кода (UI Story / Facade)

Вызывающий код избавляется от блоков `try/catch`. Компилятор TypeScript точно знает все возможные исходы:

```typescript
// apps/u7-bot/src/controllers/mentor/stories/monitor.ts

const res = await this.appApi.execute('complete-student', {
  studentId,
  streamId,
  outcome: 'advanced',
}, actor);

if (res.isErr()) {
  switch (res.error.code) {
    case 'ACCESS_DENIED':
      return session.reply(`⛔ Доступ запрещён: ${res.error.payload.reason}`);
    case 'STUDENT_NOT_ACTIVE':
      return session.reply('⚠️ Студент уже завершил этот модуль или был отчислен.');
    case 'STUDENT_NOT_FOUND':
      return session.reply('❌ Студент не найден.');
    default:
      return session.reply('Произошла ошибка при выполнении операции.');
  }
}

// Ветка успеха строго типизирована компилятором:
session.reply(`🏁 Обучение успешно завершено со статусом: ${res.value.status}`);
```

---

## 5. Декларативные манифесты Domain Manifest Graph (DMG)

### 5.1. Слой Domain: Агрегат и Машина состояний (`ArManifest`)

```typescript
// packages/stream/src/domain/student/manifest.ts
import { defineAggregate } from '@u7-scl/core/domain';
import { StudentSchema, StudentStatusSchema } from './schema';
import { 
  StudentAbandonedEventDef, 
  StudentCompletedEventDef, 
  StudentEnrolledEventDef 
} from './events';

export const StudentArManifest = defineAggregate({
  name: 'Student',
  label: 'Студент потока',
  schema: StudentSchema,
  statusField: 'status',
  statuses: StudentStatusSchema,
  transitions: [
    { from: 'enrolled', to: 'active', label: 'Старт учёбы' },
    { from: 'active', to: 'advanced', label: 'Модуль успешно завершён' },
    { from: 'active', to: 'not_advanced', label: 'Модуль завершён без зачёта' },
    { from: ['enrolled', 'active'], to: 'abandoned', label: 'Отчисление / уход' },
  ],
  emits: [
    StudentEnrolledEventDef,
    StudentCompletedEventDef,
    StudentAbandonedEventDef,
  ],
});

export type StudentArMeta = typeof StudentArManifest.meta;
```

---

### 5.2. Слой Domain: Политики доступа (`PolicyManifest`)

```typescript
// packages/stream/src/domain/student/policy.ts
import { definePolicy, rule } from '@u7-scl/core/domain';
import type { Stream } from '../stream/entity';
import type { Student } from './entity';

export const isStudentSelf = rule<Student>({
  name: 'is-student-self',
  label: 'Актор является владельцем записи студента',
  denyMessage: 'Вы можете управлять только своим обучением',
  test: (actor, student) => actor.uuid === student?.userId,
});

export const isStreamMentor = rule<Student, Stream>({
  name: 'is-stream-mentor',
  label: 'Актор назначен ментором данного потока',
  denyMessage: 'Вы не являетесь куратором этого потока',
  test: (actor, _student, stream) => actor.uuid === stream?.mentorId,
});

export const StudentPolicy = definePolicy('student', {
  canCompleteStep: isStudentSelf,

  canManage: rule.anyOf([
    rule.hasRole('admin', 'Администратор системы'),
    rule.allOf([
      rule.hasRole('mentor', 'Пользователь с ролью Ментор'),
      isStreamMentor,
    ]),
  ]),
});
```

---

### 5.3. Слой API: EventReaction и Job

#### EventReaction:
```typescript
// packages/wish/src/api/er/fulfill-wish-er.ts
import { defineEventReaction, ReactionFromManifest } from '@u7-scl/core/api';
import { StudentEnrolledEventDef } from '@u7-scl/stream/domain';
import { WishArManifest } from '#domain/wish/manifest';
import { WishFulfilledEventDef } from '#domain/wish/events';

export const FulfillWishErManifest = defineEventReaction({
  name: 'fulfill-wish',
  label: 'Закрыть желание при зачислении на поток',
  subscribesTo: StudentEnrolledEventDef,
  touches: [WishArManifest],
  emits: [WishFulfilledEventDef],
});

export class FulfillWishEr extends ReactionFromManifest(FulfillWishErManifest) {
  async handle(event) {
    // Реализация реакции
  }
}
```

#### Job:
```typescript
// packages/stream/src/api/student/inactivity-sweep-job.ts
import { defineJob, JobFromManifest } from '@u7-scl/core/api';
import { StudentArManifest } from '#domain/student/manifest';
import { 
  StudentInactivityRemoveCandidateEventDef, 
  StudentInactivityWarningEventDef 
} from '#domain/student/events';

export const InactivitySweepJobManifest = defineJob({
  name: 'inactivity-sweep',
  label: 'Мониторинг неактивных студентов',
  schedule: { kind: 'dailyAt', hour: 19, minute: 0, timezone: 'UTC' },
  scans: [StudentArManifest],
  emits: [
    StudentInactivityWarningEventDef,
    StudentInactivityRemoveCandidateEventDef,
  ],
});
```

---

### 5.4. Стратегический уровень: Паспорт Модуля (`ModuleManifest`)

```typescript
// packages/stream/src/manifest.ts
import { defineModule } from '@u7-scl/core/domain';
import { StudentArManifest } from './domain/student/manifest';
import { StreamArManifest } from './domain/stream/manifest';
import { CompleteStudentCmdManifest } from './domain/student/commands/complete-student-cmd';
import { InactivitySweepJobManifest } from './api/student/inactivity-sweep-job';

export const StreamModuleManifest = defineModule({
  name: 'stream',
  label: 'Учебные потоки и прогресс студентов',
  aggregates: [StreamArManifest, StudentArManifest],
  useCases: [CompleteStudentCmdManifest],
  reactions: [],
  jobs: [InactivitySweepJobManifest],
  dependencies: {
    consumes: {
      facades: ['courseFacade', 'userFacade'],
      events: [],
    },
    publishes: {
      events: [
        'student.enrolled',
        'student.completed',
        'student.abandoned',
        'student.inactivity-warning',
      ],
    },
  },
});
```

---

### 5.5. Слой UI: Сценарии пользователя (`StoryManifest`)

```typescript
// apps/u7-bot/src/controllers/mentor/stories/complete-student.story.ts
import { defineStory } from '@u7-scl/core/ui';

export const CompleteStudentStoryManifest = defineStory({
  name: 'mentor-complete-student',
  userGoal: 'Ментор завершает обучение студента на модуле потока и фиксирует результат',
  actorRoles: ['mentor', 'admin'],
  executes: ['complete-student', 'get-student-progress'],
  listens: [],
});
```

---

## 6. Каузальный движок: Анализ «Потянуть за верёвочку»

Поскольку все манифесты — это сериализуемые в рантайме объекты, реестр приложения строит направленный граф связей (Directed Graph).

### 6.1. Срез для PO: Просмотр Агрегата (`Student`)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ АГРЕГАТ: Student (Студент потока)                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Жизненный цикл:                                                                 │
│   [enrolled] ──(старт)──> [active] ──┬──(успех)────> [advanced]                 │
│                                      ├──(неуспех)──> [not_advanced]             │
│                                      └──(уход)─────> [abandoned]                │
│                                                                                 │
│ Управляющие UseCases:                                                           │
│   • enroll-student    [create]  Политика: Гость / Студент                       │
│   • complete-step     [mutate]  Политика: Только сам студент                    │
│   • complete-student  [mutate]  Политика: Админ ИЛИ (Ментор И Куратор потока)   │
│   • drop-student      [mutate]  Политика: Сам студент ИЛИ Ментор потока         │
│                                                                                 │
│ Испускаемые события:                                                            │
│   • student.enrolled   ──> подписан: [wish] fulfill-wish-er                     │
│   • student.completed  ──> подписан: [bot] hub-story (уведомление ментору)      │
│   • student.abandoned  ──> подписан: [bot] kick-group-story (кик из чата)       │
│                                                                                 │
│ Периодические задания (Jobs):                                                   │
│   • inactivity-sweep (Ежедневно в 19:00 UTC)                                    │
│     Эмитит: student.inactivity-warning, student.inactivity-remove-candidate     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2. Срез для PO: Каскад последствий UseCase (`complete-student`)
```
[UI Trigger: Ментор нажимает "Завершить обучение студента"]
   │
   ▼
[UseCase: complete-student]
   ├─ Политика: student.canManage (ADMIN | (MENTOR & Владелец потока))
   ├─ Возможные ошибки (Каталог):
   │    ├─ ACCESS_DENIED (Не куратор потока)
   │    ├─ STUDENT_NOT_FOUND (ID не существует)
   │    └─ STUDENT_NOT_ACTIVE (Уже завершил или отчислен)
   │
   ├─ Мутация агрегата: Student (active ➔ advanced)
   │
   └─ Эмиссия события: student.completed
         │
         ├─► [ER: wish/fulfill-wish-er]
         │      └─ Мутация Wish (confirmed ➔ fulfilled)
         │         └─ Эмиссия: wish.fulfilled
         │               └─► [UI: Поздравление студента в боте]
         │
         └─► [UI Story: HubNotifyStory]
                └─ Проактивное сообщение в Telegram ментору
```

---

## 7. Инструменты для Бизнес-аналитика и Product Owner

1. **Интерактивный CLI-эксплорер (`bun run domain`):**
   - `bun run domain ar Student` — полный паспорт агрегата, статусы, UseCases и Jobs;
   - `bun run domain uc complete-student` — входы, выходы, дерево прав доступа и **каталог ошибок**;
   - `bun run domain cascade complete-student` — текстовое дерево каскада последствий;
   - `bun run domain context-map` — матрица связности контекстов (кто кого слушает).
2. **Автогенерация Living Documentation (Markdown + Mermaid):**
   Скрипт в CI генерирует:
   - `stateDiagram-v2` для всех агрегатов;
   - `sequenceDiagram` для всех каскадных цепочек команд;
   - Таблицы каталогов ошибок по каждой команде;
   - `graph TD` для Strategic Context Map.
3. **Контрактные тесты связности в CI:**
   Тест компиляции графа проверяет целостность на уровне системы:
   - если метод UseCase возвращает код ошибки, не заявленный в `errors` — ошибка типов;
   - если UC заявляет событие `foo.bar`, но агрегат его не знает — тест падает;
   - если ER подписан на `student.enrolled`, но ни один модуль его не публикует — предупреждение о «висячем» слушателе.

---

## 8. Последствия архитектурного решения (Трейд-оффы)

### Плюсы (Advantages)
1. **Экстремальная скорость рантайма:** Полный отказ от `throw` и генерации стек-трейсов для штатных ошибок бизнес-логики.
2. **100% типобезопасность:** Компилятор TypeScript гарантирует, что вызывающий код знает обо всех возможных ошибках операции.
3. **Прозрачность для бизнеса:** Аналитик и PO видят правила авторизации, каскады эффектов, переходы состояний и полный каталог ошибок без чтения кода.
4. **Радикальное улучшение DX:** Разработчик пишет манифест один раз, избавляясь от 5 повторяющихся описаний на каждую команду.
5. **Устранение «мертвых» связей:** Система видит висячие подписки на события и неиспользуемые команды.
6. **Актуальная документация:** Документация не пишется руками — она является проекцией работающего кода.

### Минусы и риски (Trade-offs & Mitigations)
1. **Дисциплина явной проверки Result:**
   *Риск:* Разработчик может забыть проверить `res.isOk()` и попытаться получить данные.
   *Решение:* Метод `unwrap()` выбрасывает исключение только при намеренном вызове, а стандартная типизация TypeScript не дает обратиться к `res.value` без проверки `res.ok`.
2. **Необходимость дисциплины в манифестах:**
   *Риск:* Разработчик может забыть указать ошибку или вторичное событие в `emits`.
   *Решение:* Статическая типизация `this.err(...)` блокирует возврат незаявленных кодов ошибок.
3. **Порог входа для новых разработчиков:**
   *Риск:* Нужно освоить синтаксис `Result`, `defineAggregate`, `defineUseCase`, `rule.anyOf`.
   *Решение:* Единый стандарт и шаблоны делают код единообразным и предсказуемым.

---

## 9. План поэтапного внедрения (Zero-Downtime Migration)

Внедрение не требует переписывания системы с нуля и проходит в 4 этапа:

### Этап 1: Инфраструктура в `@u7-scl/core`
- Реализация монады `Result<T, E>`, классов `Ok`, `Err`, фабрик `ok()`, `err()`.
- Реализация функций `defineAggregate`, `definePolicy`, `rule`, `defineUseCase`, `defineEventReaction`, `defineJob`, `defineModule`.
- Реализация `UseCaseFromManifest` с поддержкой возврата `Result`.
- Обратная совместимость: текущие UseCase, выбрасывающие исключения, продолжают работать параллельно.

### Этап 2: Граф-движок и CLI (`DomainGraphRegistry`)
- Сборщик дерева метаданных в памяти (`buildDomainGraph`).
- Экспорт каталога ошибок операций в CLI и Markdown.
- CLI-команды инспекции (`bun run domain inspect/cascade/errors`).

### Этап 3: Пилотная миграция эталонных модулей (`wish` и `stream`)
- Перевод сущностей `Wish` и `Student` на манифесты и возврат `Result` в методах агрегатов.
- Перевод `CompleteStudentUc` на возврат `Result` и декларацию каталога ошибок.
- Обновление вызывающих сторей в боте (замена `try/catch` на `res.isErr()`).

### Этап 4: Постепенная миграция остальных модулей
- Модули `course`, `user`, `questionnaire` переводятся на манифесты и `Result` в плановом режиме.
- Подключение автогенерации диаграмм Mermaid в документацию Conductor.
