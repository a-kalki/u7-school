# Спецификация трека `course_migration_20260508`

## Обзор

Полная миграция доменного модуля `course` с устаревшей архитектуры на архитектуру фреймворка `@u7/core` по образцу модуля `user`. Доменная модель перепроектируется: монолит разделяется на 4 независимых агрегата. Все старые файлы удаляются. Модуль подключается к `u7-cli`.

## Функциональные требования

### FR1. Структура модуля — зеркальная `user`
> **doc:** `conductor/code_styleguides/naming.md` (структура папок), `conductor/code_styleguides/architecture.md` (слои); **skill:** `ddd-naming`

Структура `course/src/` повторяет `user/src/`:
- `domain/` — по папке на каждый агрегат (`course/`, `lesson/`, `step/`, `file-metadata/`) + `module.ts`, `facade.ts`, `index.ts`
- `api/` — use-case'ы (базовый `course-uc.ts`), `module.ts`, `index.ts`
- `infra/db/` — реализации репозиториев (по одной на агрегат), `index.ts`
- `ui/auto-ui/` — `module.ts`, `index.ts`
- `index.ts` — реэкспорт всех слоёв

### FR2. Настройки модуля — `package.json` и `tsconfig.json`
> **doc:** `conductor/code_styleguides/architecture.md` (layer-based imports); **образец:** `packages/user/package.json`, `packages/user/tsconfig.json`

- Добавить `exports`: `./domain`, `./api`, `./ui`, `./infra`
- Добавить `imports`: `#domain/*`, `#api/*`, `#ui/*`, `#infra/*`
- Добавить `"@u7/core": "workspace:*"` в зависимости
- `tsconfig.json` — уже корректен, оставить как есть

### FR3. Перепроектированная доменная модель
> **doc:** `conductor/code_styleguides/ddd.md` (агрегаты), `conductor/code_styleguides/skills/entity.md` (сущности); **skill:** `ddd-domain`

Четыре агрегата с независимыми репозиториями и политиками.

**Статусы (вариант A — независимые):** Каждый объект (Course, Module, Project, Lesson, Step) имеет поле `status: Status`. Приложение само фильтрует: показывает только `published` курсы, а внутри — `published` дочерние объекты. Draft-объекты видны только автору.

#### FR3a. Общие перечисления и типы
> **doc:** `conductor/code_styleguides/skills/enum.md`; **skill:** `ddd-domain`

- `Status` enum (draft / published / archived) + `StatusSchema` — используется всеми агрегатами и Module/Project

#### FR3b. Агрегат `Course`
> **doc:** `conductor/code_styleguides/skills/aggregate.md`; **skill:** `ddd-domain`

- `CourseSchema` — базовые поля (uuid, title, description, authorId, targetAudience?, goal?, result?, rules?, additional?, tags?, status, createdAt, updatedAt) + вариант `kind: "modules" | "projects"`
- `kind: "modules"` → содержит `modules: Module[]` (вложенный value-object)
- `kind: "projects"` → содержит `projects: Project[]` (вложенный value-object)
- `Module` — value-object: uuid, title, goal?, result?, additional?, status, order, createdAt, updatedAt
- `Project` — value-object: uuid, title, goal?, result?, additional?, status, order, createdAt, updatedAt, `lessonIds: string[]` (UUID-ссылки на агрегат `Lesson`)
- **JSDoc:** «Агрегат Course — корень образовательного курса. Module и Project являются вложенными объектами-значениями (value objects). Lesson, Step, FileMetadata — независимые агрегаты, связанные через UUID.»
- `CourseAr` наследуется от `Aggregate<CourseArMeta>`, методы: `create()`
- `CoursePolicy`: `canCreate` (ADMIN/MENTOR), `canRead` (все), `canEdit` (ADMIN или authorId)
- `CourseRepo`: `save`, `getByUuid`, `getAll(filter?: CourseListFilter)`
- Фильтр `CourseListFilter`: `status?`, `authorId?`, `title?`, `kind?`, `tags?`, `sort?`, `limit?`
- `isoNow()` — из `@u7/core/shared`

#### FR3c. Агрегат `Lesson`
> **doc:** `conductor/code_styleguides/skills/aggregate.md`; **skill:** `ddd-domain`

- `LessonSchema` — uuid, courseId (readonly), title, additional?, status, order, createdAt, updatedAt, estimatedMinutes?, `stepIds: string[]`, `mentorStepIds: string[]` (UUID-ссылки на агрегат `Step`)
- **JSDoc:** «Агрегат Lesson — урок курса. Архитектурно выделен в отдельный агрегат, но семантически является частью Course. `courseId` задаётся при создании и никогда не меняется. Права на редактирование делегируются CoursePolicy.»
- `LessonAr` наследуется от `Aggregate<LessonArMeta>`, методы: `create()`
- `LessonPolicy`: `canCreate` (ADMIN/MENTOR), `canRead` (все), `canEdit` (ADMIN или автор курса через CoursePolicy)
- `LessonRepo`: `save`, `getByUuid`, `getByIds`

#### FR3d. Агрегат `Step`
> **doc:** `conductor/code_styleguides/skills/aggregate.md`; **skill:** `ddd-domain`

- `StepSchema` — вариант `kind: "text" | "code" | "file"` с общими полями (uuid, courseId (readonly), description, content?, status, order, createdAt, updatedAt)
- `kind: "code"` → +`code`, `language?`
- `kind: "file"` → +`fileId: string` (UUID-ссылка на агрегат `FileMetadata`)
- **JSDoc:** «Агрегат Step — шаг урока. Архитектурно выделен в отдельный агрегат, но семантически является частью Course. `courseId` задаётся при создании и никогда не меняется. Права на редактирование делегируются CoursePolicy.»
- `StepAr` наследуется от `Aggregate<StepArMeta>`, методы: `create()`
- `StepPolicy`: `canCreate` (ADMIN/MENTOR), `canRead` (все), `canEdit` (ADMIN или автор курса через CoursePolicy)
- `StepRepo`: `save`, `getByUuid`, `getByIds`

#### FR3e. Агрегат `FileMetadata`
> **doc:** `conductor/code_styleguides/skills/aggregate.md`; **skill:** `ddd-domain`

- `FileMetadataSchema` — uuid, courseId (readonly), name, url, mimeType, size?, description?, createdAt, updatedAt
- **JSDoc:** «Агрегат FileMetadata — метаданные файла. Хранит информацию о файле, но не сам файл. Функционал загрузки/указания файлов будет реализован в будущих треках.»
- `FileMetadataAr` наследуется от `Aggregate<FileMetadataArMeta>`, методы: `create()`
- `FileMetadataPolicy`: `canCreate` (ADMIN/MENTOR), `canRead` (все), `canEdit` (ADMIN или автор курса через CoursePolicy)
- `FileMetadataRepo`: `save`, `getByUuid`, `getByIds`
- **Примечание:** в будущем может быть вынесен в отдельный модуль

### FR4. Ошибки и команды
> **doc:** `conductor/code_styleguides/errors.md`, `conductor/code_styleguides/skills/errors.md`, `conductor/code_styleguides/skills/commands.md`; **skill:** `ddd-domain`

Для каждого агрегата — команды по образцу `user`:
- `create-course-cmd.ts`, `get-course-cmd.ts`, `list-courses-cmd.ts`
- `create-lesson-cmd.ts`, `get-lesson-cmd.ts`
- `create-step-cmd.ts`, `get-step-cmd.ts`
- `create-file-metadata-cmd.ts`, `get-file-metadata-cmd.ts`
- `errors.ts` для каждого агрегата (атомарные + union)

### FR5. Use-case'ы и API-модуль
> **doc:** `conductor/code_styleguides/skills/usecase.md`, `conductor/code_styleguides/skills/module.md`, `conductor/code_styleguides/api.md`; **skill:** `ddd-api`

- `CourseUseCase` — базовый абстрактный класс (аналог `UserUseCase`)
- `CreateCourseUc` — миграция существующего `CourseCreatingUc`
- `GetCourseUc`, `ListCoursesUc`
- `CreateLessonUc`, `GetLessonUc`
- `CreateStepUc`, `GetStepUc`
- `CreateFileMetadataUc`, `GetFileMetadataUc`
- `CourseApiModule` — регистрирует все UC
- `CourseApiModuleResolver` содержит: `courseRepo`, `lessonRepo`, `stepRepo`, `fileMetadataRepo`, `userFacade`

### FR6. Infra — реализации репозиториев
> **doc:** `conductor/code_styleguides/skills/repo.md` (интерфейс), `conductor/code_styleguides/skills/repo-impl.md` (реализация); **skill:** `ddd-infra`

- `CourseJsonRepo` — на основе `JsonFileRepo<Course>` из `@u7/core/infra`. Путь: `data/courses/courses.json`, **без seed**
- `LessonJsonRepo` — `JsonFileRepo<Lesson>`, путь: `data/courses/lessons.json`, без seed
- `StepJsonRepo` — `JsonFileRepo<Step>`, путь: `data/courses/steps.json`, без seed
- `FileMetadataJsonRepo` — `JsonFileRepo<FileMetadata>`, путь: `data/courses/files.json`, без seed

### FR7. UI-модуль и интеграция с u7-cli
> **doc:** `conductor/code_styleguides/skills/module.md`; **skill:** `ddd-api`

- `CourseAutoUiModule extends AutoUiModule<CourseModuleMeta>`
- `CourseCliController`
- Модуль должен быть подключен и работоспособен в `u7-cli`

### FR8. Фасад модуля `user` — `UserInProcFacade`
> **doc:** `conductor/code_styleguides/integration.md` (фасады); **skill:** `ddd-domain`

- Интерфейс `UserFacade` в `domain/facade.ts`
- Методы: получение пользователя по UUID, проверка существования
- Реализация `UserInProcFacade` — класс, принимающий `UserApiModule` и реализующий интерфейс. Все вызовы делегируются API-модулю
- Импорт типов (`User`, `Role`) из `@u7/user/domain`
- Доступ к фасаду — через `CourseApiModuleResolver.userFacade`

### FR9. Межагрегатные связи
> **doc:** `conductor/code_styleguides/ddd.md`; **skill:** `ddd-domain`

Все ссылки между агрегатами — через поле `uuid`:
- `Project.lessonIds: string[]` → агрегаты `Lesson`
- `Lesson.stepIds: string[]` → агрегаты `Step`
- `Lesson.mentorStepIds: string[]` → агрегаты `Step`
- `Step.fileId?: string` → агрегат `FileMetadata`
- `Lesson.courseId`, `Step.courseId`, `FileMetadata.courseId` — readonly, задаётся при создании

### FR10. Удаление старых файлов
> **doc:** `conductor/code_styleguides/naming.md` (структура)

Полностью удалить:
- Все файлы в старой структуре `course/src/` (domain старого образца, api старого образца)
- `api/user/` (user-creating-uc.ts, user-repository.ts, create-user-command.ts) — следы User
- `domain/shared/exceptions.ts` (AppException/DomainException)
- `domain/shared/iso-now.ts` (замена на `@u7/core/shared`)
- `api/shared/parse-or-throw.ts`
- `api/controllers/`
- `api/main.ts`
- `api/integration.test.ts`

## Нефункциональные требования

- `bun test` — все тесты проходят
- Покрытие >80% для нового кода
- `bun run lint` (Biome) — без ошибок
- `bun run tslint` (tsc) — без ошибок
- Именование строго по `naming.md`: kebab-case файлы, PascalCase-классы/типы

## Критерии приёмки

1. Структура `course/src/` зеркальна `user/src/` (domain, api, infra, ui слой)
2. `package.json` содержит `exports`/`imports` и `"@u7/core": "workspace:*"`
3. 4 агрегата реализованы: Course, Lesson, Step, FileMetadata
4. Межагрегатные связи — только через `uuid`
5. Статусы на всех уровнях (Course, Module, Project, Lesson, Step) — независимые
6. Старые файлы полностью удалены (включая все следы User)
7. Все JSON-репозитории на `JsonFileRepo` с пустыми файлами, без seed
8. Фасад `UserInProcFacade` реализован, принимает `UserApiModule`
9. Модуль `course` подключен к `u7-cli` и работоспособен
10. `bun run check` — чисто

## За рамками

- Интеграция с Telegram-ботом или REST (только структура модуля)
- Миграция данных (начинаем с пустых файлов)
- Новые функции курса (только перенос существующих)
- Функционал загрузки/указания файлов для FileMetadata
