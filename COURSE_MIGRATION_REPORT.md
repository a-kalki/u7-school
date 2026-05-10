# Отчёт: Миграция модуля course на архитектуру core

> Трек: [course_migration_20260508](conductor/tracks/course_migration_20260508/spec.md)
> Дата: 2026-05-08
> SHA финального коммита: `027b296`

---

## 1. Общее резюме

Модуль `@u7/course` полностью мигрирован с устаревшей архитектуры на архитектуру фреймворка `@u7/core` по образцу модуля `@u7/user`. Монолит разделён на 4 независимых агрегата: **Course**, **Lesson**, **Step**, **FileMetadata**. Все старые файлы удалены (43 файла). Модуль подключен к `u7-cli`.

**Итоговые метрики:**
- 104 теста, 0 падений
- `bun run check:p course` — чисто (ошибки только предсуществующие в `@u7/user` и `@u7/core`)
- 49 новых файлов, 1 изменённый (`package.json`), 1 изменённый (`apps/u7-cli/src/main.ts`), 43 удалённых

---

## 2. Структура модуля

```
packages/course/src/
├── index.ts                         # реэкспорт всех слоёв
├── domain/
│   ├── index.ts                     # реэкспорт всех агрегатов
│   ├── module.ts                    # CourseModuleMeta, CourseApiModuleResolver
│   ├── facade.ts                    # UserFacade (интерфейс)
│   ├── status.ts / .test.ts         # Status enum + StatusSchema
│   ├── types.ts                     # CourseId, LessonId, StepId, ...
│   ├── course/
│   │   ├── entity.ts / .test.ts     # CourseSchema, ModuleSchema, ProjectSchema
│   │   ├── a-root.ts / .test.ts     # CourseAr
│   │   ├── policy.ts / .test.ts     # CoursePolicy
│   │   ├── repo.ts                  # CourseRepo + CourseListFilter
│   │   ├── types.ts / errors.ts
│   │   └── commands/
│   │       ├── create-course-cmd.ts
│   │       ├── get-course-cmd.ts
│   │       ├── list-courses-cmd.ts
│   │       └── errors.ts
│   ├── lesson/                      # (аналогичная структура)
│   ├── step/                        # (аналогичная структура)
│   └── file-metadata/               # (аналогичная структура)
├── api/
│   ├── index.ts
│   ├── course-uc.ts                 # Базовый CourseUseCase
│   ├── module.ts / .test.ts         # CourseApiModule
│   ├── course/
│   │   ├── create-course-uc.ts
│   │   ├── get-course-uc.ts
│   │   └── list-courses-uc.ts
│   ├── lesson/
│   │   ├── create-lesson-uc.ts
│   │   └── get-lesson-uc.ts
│   ├── step/
│   │   ├── create-step-uc.ts
│   │   └── get-step-uc.ts
│   └── file-metadata/
│       ├── create-file-metadata-uc.ts
│       └── get-file-metadata-uc.ts
├── infra/
│   ├── index.ts
│   ├── db/
│   │   ├── course-json-repo.ts / .test.ts
│   │   ├── lesson-json-repo.ts / .test.ts
│   │   ├── step-json-repo.ts / .test.ts
│   │   └── file-metadata-json-repo.ts / .test.ts
│   └── user-in-proc-facade.ts
└── ui/
    ├── index.ts
    └── auto-ui/
        ├── module.ts
        └── controller/
            ├── cli.ts
            └── cli.test.ts
```

---

## 3. Архитектурные решения

### 3.1. Discriminated unions через `v.variant()`

**Агрегат Course** — вариант `kind: "modules" | "projects"`. Вариант `"modules"` содержит `modules: Module[]`, вариант `"projects"` — `projects: Project[]`. Module и Project — value-object'ы внутри Course, не отдельные агрегаты.

**Агрегат Step** — вариант `kind: "text" | "code" | "file"`. Вариант `"code"` добавляет поля `code` и `language?`, вариант `"file"` — `fileId: string` (UUID-ссылка на агрегат FileMetadata).

Схемы построены по шаблону:
```
CommonSchema = v.object({ общие поля })
TextSchema = v.object({ ...CommonSchema.entries, kind: v.literal("text") })
CodeSchema = v.object({ ...CommonSchema.entries, kind: v.literal("code"), code: ..., language: ... })
FileSchema = v.object({ ...CommonSchema.entries, kind: v.literal("file"), fileId: ... })
StepSchema = v.variant("kind", [TextSchema, CodeSchema, FileSchema])
```

### 3.2. Политики прав доступа

Три уровня политик:
- **CoursePolicy** — canCreate (ADMIN/MENTOR), canRead (все), canEdit (ADMIN или authorId). **Любой автор может редактировать свой курс**, включая STUDENT.
- **LessonPolicy / StepPolicy / FileMetadataPolicy** — canCreate (ADMIN/MENTOR), canRead (все), canEdit (только ADMIN на уровне политики). Проверка авторства курса делегируется CoursePolicy на уровне UC.

### 3.3. Межагрегатные связи — только через UUID

- `Project.lessonIds: string[]` → агрегаты Lesson
- `Lesson.stepIds: string[]`, `Lesson.mentorStepIds: string[]` → агрегаты Step
- `Step.fileId?: string` → агрегат FileMetadata
- `Lesson.courseId`, `Step.courseId`, `FileMetadata.courseId` — readonly, задаётся при создании

Никаких прямых ссылок на объекты — только UUID.

### 3.4. Инфра-репозитории

Все 4 репозитория реализованы на основе `JsonFileRepo<T>` из `@u7/core/infra`:
- Без seed (без `ensureInit()`)
- `save()`: readAll → update/append → writeAll
- `getByUuid()`: readAll → find
- `getByIds()`: readAll → filter
- `getAll()` у Course поддерживает фильтр `CourseListFilter` (status, authorId, title, kind, tags, sort, limit)

### 3.5. Фасад UserInProcFacade

- Принимает `UserApiModule` в конструкторе
- Реализует интерфейс `UserFacade`
- `getUserByUuid()`: вызывает `UserApiModule.handle({ name: "get-user", attrs: { uuid } })`
- `userExists()`: проверяет результат `getUserByUuid()`
- Ошибки перехватываются → возвращается `undefined`

### 3.6. Интеграция с u7-cli

В `apps/u7-cli/src/main.ts` модуль course подключен вторым модулем после user:
```typescript
const userFacade = new UserInProcFacade(userApiModule);
const courseApiModule = new CourseApiModule();
courseApiModule.init({
  courseRepo: new CourseJsonRepo(),
  lessonRepo: new LessonJsonRepo(),
  stepRepo: new StepJsonRepo(),
  fileMetadataRepo: new FileMetadataJsonRepo(),
  userFacade,
});
const courseUiModule = new CourseAutoUiModule({ aboutPath, apiModule: courseApiModule });
const app = new AutoUiApp([userUiModule, courseUiModule], { aboutPath: rootDir });
```

---

## 4. Проблемы и принятые решения

### Проблема #1: `v.variant()` не имеет `.entries`

**Симптом:** `CourseSchema.entries.title` → `TypeError: undefined is not an object`
**Причина:** `v.variant()` возвращает схему-обёртку над discriminated union, у которой нет свойства `.entries` (в отличие от `v.object()`). Команды `create-course-cmd.ts` и `list-courses-cmd.ts` пытались наследовать валидацию через `CourseSchema.entries.*`.
**Решение:** Экспортировать базовую `CourseCommonSchema` отдельно (без вариантов) и использовать `CourseCommonSchema.entries.*` в командах. Поле `kind` не входит в `CourseCommonSchema` (оно только в вариантных схемах), поэтому в командах оно задано отдельно через `v.picklist(["modules", "projects"])`.

**Затронутые файлы:**
- `domain/course/entity.ts` — `CourseCommonSchema` сделан `export`
- `domain/course/commands/create-course-cmd.ts` — замена `CourseSchema.entries` → `CourseCommonSchema.entries`, `kind` → `v.picklist`
- `domain/course/commands/get-course-cmd.ts` — `CourseSchema.entries.uuid` → `CourseCommonSchema.entries.uuid`
- `domain/course/commands/list-courses-cmd.ts` — `CourseSchema.entries.kind` → `v.picklist`, удалён неиспользуемый импорт
- `domain/step/entity.ts` — `StepCommonSchema` сделан `export`
- `domain/step/commands/create-step-cmd.ts` — `StepSchema.entries.*` → `StepCommonSchema.entries.*`, `kind` → `v.picklist(["text", "code", "file"])`
- `domain/step/commands/get-step-cmd.ts` — `StepSchema.entries.uuid` → `StepCommonSchema.entries.uuid`
- `domain/index.ts` — добавлены экспорты `CourseCommonSchema`, `StepCommonSchema`

**Урок на будущее:** всегда экспортировать `*CommonSchema` при использовании `v.variant()`. Для полей, которые есть только в вариантных схемах (например, `kind`), использовать явную валидацию в командах.

---

### Проблема #2: `DomainError` не экспортируется из `@u7/core/domain`

**Симптом:** `error TS2305: Module '"@u7/core/domain"' has no exported member 'DomainError'.`
**Причина:** Файлы `domain/*/errors.ts` использовали `DomainError<"NAME", "domain", undefined>` для определения Ar-ошибок, но `@u7/core/domain` не экспортирует такой тип.
**Решение:** Заменено на plain `interface`:
```typescript
export interface StepArError {
  name: "STEP_INVARIANT";
  level: "domain";
}
```
Фактически Ar-ошибки не используются (ArMeta.errors: never), но файлы оставлены для полноты структуры.

**Затронутые файлы:** `domain/course/errors.ts`, `domain/lesson/errors.ts`, `domain/step/errors.ts`, `domain/file-metadata/errors.ts`

**Урок на будущее:** перед использованием типов из `@u7/core/domain` проверять их наличие в экспортах пакета. Для Ar-ошибок достаточно plain interface с `name` и `level`.

---

### Проблема #3: `listOutputSchema` не экспортируется из `@u7/core/api`

**Симптом:** `error: Export named 'listOutputSchema' not found in module '@u7/core/api'.`
**Причина:** `list-courses-uc.ts` пытался использовать `listOutputSchema("courses", CourseSchema)` из `@u7/core/api`, но такой экспорт отсутствует.
**Решение:** Использована явная схема по образцу `ListUsersUc`:
```typescript
const CoursesListOutputSchema = v.object({
  courses: v.array(CourseSchema),
});
```

**Затронутые файлы:** `api/course/list-courses-uc.ts`

**Урок на будущее:** не полагаться на несуществующие хелперы. Сверяться с реальными экспортами пакета и существующими образцами (в данном случае — `ListUsersUc`).

---

### Проблема #4: `UseCase` требует реализации `getUser()` и `checkPolicy()`

**Симптом:** `error TS2654: Non-abstract class is missing implementations for the following members: 'getUser', 'checkPolicy'.`
**Причина:** Абстрактный класс `UseCase` из `@u7/core` объявляет `protected abstract getUser(userId: string)` и `protected abstract checkPolicy(command, actor)` как обязательные методы. `UserUseCase` реализует их как конкретные методы. Мой `CourseUseCase` изначально имел только `getCourse()`, но не реализовывал `getUser`/`checkPolicy`.
**Решение:** Добавлены реализации-заглушки в `CourseUseCase`:
- `getUser(userId)` — вызывает `this.resolve.userFacade.getUserByUuid(userId)`, возвращает `undefined as unknown as Course` (курсы используют User только через фасад, не как состояние агрегата)
- `checkPolicy()` — no-op, доступно всем. Конкретные UC переопределяют политику через явные вызовы `CoursePolicy.canCreate()`, `CoursePolicy.canEdit()` и т.д.

**Затронутые файлы:** `api/course-uc.ts`

**Урок на будущее:** всегда проверять сигнатуру абстрактного базового класса. При использовании фасадов для доступа к другим модулям, `getUser()` может быть заглушкой.

---

### Проблема #5: Тесты инфра-репозиториев падали из-за невалидных UUID

**Симптом:** `[JsonFileRepo] Пропущена невалидная запись: uuid: "Некорректный формат UUID"` → тесты падали на `expect(found).toBeDefined()`.
**Причина:** Тестовые данные использовали короткие строки (`"course-1"`, `"step-1"`) как UUID, но схемы требуют строгий формат `v.uuid()`.
**Решение:** Заменены на `crypto.randomUUID()` во всех тестах.

**Затронутые файлы:** `infra/db/course-json-repo.test.ts`, `infra/db/lesson-json-repo.test.ts`, `infra/db/step-json-repo.test.ts`, `infra/db/file-metadata-json-repo.test.ts`

---

### Проблема #6: Инфра-тесты использовали общий JSON-файл

**Симптом:** Тест `getAll` возвращал 3 курса вместо ожидаемых 2, потому что предыдущий тест тоже сохранял курс в тот же файл.
**Причина:** Все тесты в `describe` блоке использовали `coursePath()` который возвращал один и тот же путь (`join(tmpDir, "courses.json")`). Данные накапливались между тестами.
**Решение:** Каждый тест использует уникальный путь к файлу: `join(tmpDir, "courses-all.json")`, `join(tmpDir, "courses-filter.json")` и т.д. Для простых репозиториев (Lesson, Step, FileMetadata) с 2 тестами — второй тест использует отдельный файл.

**Затронутые файлы:** все 4 теста инфра-репозиториев

**Урок на будущее:** при использовании файловых репозиториев в тестах всегда изолировать файлы между тестами. Либо использовать `beforeEach` для очистки, либо уникальные имена файлов.

---

### Проблема #7: `StepCommonSchema.entries.kind` не существует

**Симптом:** Ошибка при обращении к `StepCommonSchema.entries.kind` — поле `kind` не является частью `StepCommonSchema`.
**Причина:** `kind` определён только в вариантных схемах (`TextStepSchema`, `CodeStepSchema`, `FileStepSchema`), но не в базовой `StepCommonSchema`.
**Решение:** В команде `create-step-cmd.ts` поле `kind` задано явно: `v.picklist(["text", "code", "file"])`.

**Затронутые файлы:** `domain/step/commands/create-step-cmd.ts`

---

### Проблема #8: `CourseCliController` требует методы `handleRegister` и `handleLogin`

**Симптом:** `error TS2654: Non-abstract class 'CourseCliController' is missing implementations for: 'handleRegister', 'handleLogin'.`
**Причина:** `AutoUiCliController` из `@u7/core` объявляет эти методы как абстрактные.
**Решение:** Добавлены заглушки:
```typescript
async handleRegister(): Promise<string> {
  return "Регистрация выполняется через модуль пользователей (/user/user/create-user)";
}
async handleLogin(_args?: string): Promise<string> {
  return "Вход выполняется через модуль пользователей (/login)";
}
```

**Затронутые файлы:** `ui/auto-ui/controller/cli.ts`

---

### Проблема #9: Переменная `user` не используется в `CourseUseCase.getUser()`

**Симптом:** Линтер Biome: `This variable user is unused.`
**Причина:** `getUser()` вызывает фасад и сохраняет результат в переменную `user`, но метод возвращает `undefined as unknown as Course`. Переменная `user` создана для вызова фасада (проверка, что пользователь существует), но не используется далее.
**Решение:** Biome заменил на `_user` (unsafe fix), что подавляет предупреждение.

**Урок на будущее:** если вызов нужен только для побочного эффекта (проверка существования) — сохранять результат в переменную с префиксом `_`.

---

### Проблема #10: `create-lesson-cmd.ts` требует `stepIds` и `mentorStepIds`

**Симптом:** `AppException: Переданы некорректные данные` при создании урока без `stepIds`.
**Причина:** `LessonSchema.entries.stepIds` — обязательное поле (массив UUID'ов), но при создании урока шагов ещё нет. Команда должна позволять создавать урок без шагов.
**Решение:** Поля `stepIds` и `mentorStepIds` в `CreateLessonCmdSchema` обёрнуты в `v.optional()`.

**Затронутые файлы:** `domain/lesson/commands/create-lesson-cmd.ts`

---

## 5. Известные ограничения

1. **Тесты use-case'ов ограничены модульным тестом.** Полноценные тесты всех веток выполнения каждого UC (с моками репозиториев) не написаны — только один интеграционный тест на каждый UC через `CourseApiModule`. Согласно styleguide, этого достаточно для проверки подключения, но для продакшена рекомендуется расширить.

2. **Фасад UserInProcFacade не протестирован напрямую.** Тесты фасада не написаны. Фасад тестируется косвенно через модульный тест `CourseApiModule`.

3. **CourseAr.create() генерирует случайный authorId.** Реальный `authorId` устанавливается в `CreateCourseUc.execute()` через перезапись `ar.state.authorId`. Это расхождение между агрегатом и UC — агрегат не знает actorId при создании. Более чистым решением было бы передавать authorId в команду создания.

4. **CourseUseCase.getUser() — заглушка.** Метод `getUser()` в базовом UC возвращает `undefined as unknown as Course`. Это удовлетворяет TypeScript, но не отражает реальную семантику. Если в будущем потребуется получать пользователя в UC курсов — потребуется рефакторинг.

5. **Предсуществующие ошибки tsc в `@u7/user` и `@u7/core`.** Не исправлялись, так как не относятся к текущему треку.

---

## 6. Команды для проверки

```bash
# Тесты модуля course (104 теста)
bun run test:p course

# Полная проверка: линтер + tsc + тесты
bun run check:p course

# Только проверка типов
bun run tslint:p course

# Только линтер
bun run lint:p course
```
