# Спецификация: Архитектурные улучшения ядра и сервисного слоя (v3)

## Обзор

Комплекс архитектурных улучшений в `@u7/core` и `@u7/course`:

1. **BaseJsonDb** с транзакциями — один на модуль, знает все Repo, передаётся в resolver.
2. **Domain Service (Ds)** — доменный объект, работает с агрегатами (не с репозиториями), координирует изменения между агрегатами.
3. **Aggregate.safeUpdate()** — частичное обновление состояния с защищёнными полями.
4. **throwInternal** — типизированная доменная ошибка, привязанная к имени агрегата.
5. **Удаление поля `order`** — порядок определяется позицией в массиве.
6. **Рефакторинг именования агрегатов в core** — статические `arName()`/`arLabel()`, переименование, очистка UseCase.
7. **Course ↔ Lesson/Step через Domain Service** — пример использования Ds.
8. **Документация.**

---

## Функциональные требования

### FR1: BaseJsonDb с транзакциями

- **Расположение:** `@u7/core/src/infra/base-json-db.ts`
- **Один экземпляр на модуль** (например, `CourseDb` для `@u7/course`).
- При создании `Db` получает **все** `Repo` данного модуля.
- `Db` передаётся в resolver (внедрение зависимостей).
- **API:**
  - `begin(): void` — начало транзакции.
  - `commit(): Promise<void>` — атомарная запись всех изменённых файлов.
  - `rollback(): void` — сброс кеша, файлы не меняются.
- **Внутреннее устройство:**
  - При `begin()` все последующие чтения и записи идут в кеш в памяти.
  - При `commit()` кеш сбрасывается на диск атомарно.
  - При `rollback()` кеш очищается без записи.
- **JsonFileRepo** принимает в конструктор экземпляр `BaseJsonDb` + имя коллекции. Читает/пишет через Db.
- **Документация:** правила работы с Db и Repo добавляются в `ddd-infra/SKILL.md`.

### FR2: Domain Service (Ds)

- **Расположение:** `<module>/domain/<module-name>-ds.ts`. Один Ds на модуль.
- **Класс:** `<Module>Ds`, конструктор пустой.
- **Не работает с репозиториями напрямую.** Принимает на вход **объекты агрегатов** (не state, не id).
- **Методы доменно-ориентированные:**
  - `courseDs.createLesson(course: CourseAr, cmd: CreateLessonCmd, projectId: string): { course: CourseAr, lesson: LessonAr }`
  - `courseDs.createStep(lesson: LessonAr, cmd: CreateStepCmd): { lesson: LessonAr, step: StepAr }`
- Внутри: создаёт агрегаты, вызывает их методы, возвращает plain-объект с изменёнными агрегатами.
- **UseCase** получает результат Ds и внутри транзакции сохраняет состояния агрегатов в соответствующие репозитории через Db.
- **Именование:**
  - Файл: `<модуль>-ds.ts`
  - Класс: `<Модуль>Ds`
  - Пример: `course/src/domain/course-ds.ts` → `CourseDs`
- **Документация:** новый файл `conductor/code_styleguides/skills/domain-service.md`.
- **Обновить `ddd-domain/SKILL.md`:** добавить упоминание `facade.md` и `domain-service.md`.

### FR3: Aggregate.safeUpdate()

- Новый метод в базовом классе `Aggregate` (`@u7/core`):
  ```ts
  protected safeUpdate(partial: Partial<TMeta["state"]>): void
  ```
- **Поведение:**
  - Обновляет только те поля, значение которых **не `undefined`**.
  - Поля со значением `undefined` пропускаются (не перезаписывают существующие).
- **Защищённые поля:**
  ```ts
  protected safeAttrs: Array<keyof TMeta["state"]> = ["uuid", "updatedAt"];
  ```
  Поля из `safeAttrs` **никогда** не перезаписываются `safeUpdate`, даже если переданы явно (не равны undefined).
- **Применение:**
  - `CourseAr.enrich()` — переписать на `safeUpdate`.
  - Просмотреть **все** методы `CourseAr`, где возможно частичное обновление, и применить `safeUpdate`.
  - Просмотреть **все** агрегаты (`LessonAr`, `StepAr`, `UserAr`, etc.) на предмет методов, где применим `safeUpdate` (любой частичный update).

### FR4: Доменные ошибки агрегата (throwInternal)

- В базовый `Aggregate` добавляется:
  ```ts
  static arName(): string {
    throw new Error("Нужно реализовать arName() в дочернем агрегате");
  }
  static arLabel(): string {
    throw new Error("Нужно реализовать arLabel() в дочернем агрегате");
  }
  ```
- Дочерние агрегаты переопределяют с привязкой к типу Meta:
  ```ts
  // CourseAr
  static arName(): CourseArMeta["name"] {
    return "Course";
  }
  static arLabel(): CourseArMeta["label"] {
    return "Курс";
  }
  ```
- Метод `throwInternal`:
  ```ts
  protected throwInternal(message: string): never
  ```
  Бросает `DomainError` (из `@u7/core`) с полями:
  - `aggregateName` — значение `(this.constructor as typeof Aggregate).arName()`
  - `message`
- **Все** существующие `throw new Error(...)` в агрегатах заменяются на `this.throwInternal(...)`.

### FR5: Переименование arName

- Все значения `arName` привести к «солидному» формату с заглавной буквы:
  - `"user"` → `"User"`
  - `"course"` → `"Course"`
  - `"lesson"` → `"Lesson"`
  - `"step"` → `"Step"`
  - `"fileMetadata"` → удаляется вместе с агрегатом (уже сделан в предыдущем треке)
- `arLabel` — аналогично. Может отличаться от `arName` для человекочитаемости (например, `"Курс"`, `"Урок"`, `"Шаг"`, `"Пользователь"`).

### FR6: Рефакторинг UseCase

- **Удалить** из класса `UseCase` свойства `arName` и `arLabel`.
- **Добавить** свойство для класса-конструктора агрегата:
  ```ts
  abstract ArClass: typeof Aggregate<UcMeta["arMeta"]>;
  ```
  Это гарантирует, что нельзя случайно подставить класс другого агрегата. Тип выводится из ArMeta через UcMeta.
- Везде в UseCase использовать `this.ArClass.arName()` / `this.ArClass.arLabel()`.
- **Удалить** `description` из `UcMeta`. Оставить в `UseCase` как:
  ```ts
  protected description: string;
  ```
  Это не часть контракта Meta, просто строковое поле.

### FR7: Удаление поля `order`, порядок через позицию в массиве

- **Удалить поле `order`** из всех объектов:
  - `Module` (value object в course)
  - `Project` (value object в course)
  - `Lesson` (entity/aggregate)
  - `Step` (entity/aggregate)
- **Порядок = позиция в массиве родительской коллекции:**
  - `course.modules[i]` → порядок модуля = i
  - `course.projects[i]` → порядок проекта = i
  - `project.lessonIds[i]` → порядок урока = i
  - `lesson.stepIds[i]` → порядок шага = i
- **Обновить Valibot-схемы** — удалить `order` из всех схем.
- **Переписать методы**, полагавшиеся на `order`:
  - Сортировка по `order` → естественный порядок массива.
  - `getNextLessonOrderNum()` → удалить, заменить на `project.lessonIds.length`.
  - `getNextStepOrderNum()` → удалить, заменить на `lesson.stepIds.length`.
- **Инварианты упрощаются:** массив гарантирует порядок и уникальность естественно.

### FR8: Course ↔ Lesson/Step (Domain Service)

- **CourseAr** получает методы:
  - `getLessons(projectId: string): string[]` — возвращает `lessonIds` проекта.
  - `addLessonToProject(projectId: string, lessonId: string): void` — добавляет lessonId в массив проекта.
- **CourseDs.createLesson():**
  ```ts
  createLesson(course: CourseAr, cmd: CreateLessonCmd, projectId: string): { course: CourseAr, lesson: LessonAr }
  ```
  - Создаёт `LessonAr`.
  - Вызывает `course.addLessonToProject(projectId, lesson.uuid)`.
  - Возвращает `{ course, lesson }`.
- **CourseDs.createStep():**
  ```ts
  createStep(lesson: LessonAr, cmd: CreateStepCmd): { lesson: LessonAr, step: StepAr }
  ```
  - Создаёт `StepAr`.
  - Вызывает `lesson.addStep(step.uuid)` (добавляет stepId в массив урока).
  - Возвращает `{ lesson, step }`.
- **create-lesson-uc:**
  - Загружает `CourseAr` через `CourseRepo`.
  - Вызывает `courseDs.createLesson(course, cmd, projectId)`.
  - Внутри транзакции Db сохраняет оба агрегата: `courseRepo.save(course.state)` и `lessonRepo.save(lesson.state)`.
- **create-step-uc:**
  - Загружает `LessonAr` через `LessonRepo`.
  - Вызывает `courseDs.createStep(lesson, cmd)`.
  - Внутри транзакции Db сохраняет оба агрегата: `lessonRepo.save(lesson.state)` и `stepRepo.save(step.state)`.
- **LessonAr** получает метод:
  - `addStep(stepId: string): void` — добавляет stepId в массив урока.

---

## Нефункциональные требования

- **Обратная совместимость:** существующие тесты адаптируются к изменениям, но не ломаются без причины.
- **Покрытие:** >80% для всего нового и изменённого кода.
- **Линтинг/типы:** `bun run check` без ошибок.
- **Документация:** актуальна и полна.

---

## Критерии приёмки

- [ ] `BaseJsonDb.begin()` → изменить 2 файла → `commit()` — оба файла сохранены.
- [ ] `BaseJsonDb.begin()` → изменить 2 файла → `rollback()` — оба файла не изменены.
- [ ] `CourseDs.createLesson()` возвращает `{ course, lesson }`.
- [ ] `CourseDs.createStep()` возвращает `{ lesson, step }`.
- [ ] `create-lesson-uc` сохраняет оба агрегата в одной транзакции.
- [ ] `create-step-uc` сохраняет оба агрегата в одной транзакции.
- [ ] `safeUpdate({ tags: undefined, goal: "new" })` — `tags` не перезаписан, `goal` обновлён.
- [ ] `safeUpdate({ uuid: "hack" })` — `uuid` не перезаписан (в `safeAttrs`).
- [ ] `safeUpdate` применён во всех агрегатах, где есть частичное обновление.
- [ ] `this.throwInternal("msg")` бросает `DomainError` с `aggregateName` и `message`.
- [ ] Все `throw new Error(...)` в агрегатах заменены на `this.throwInternal(...)`.
- [ ] Все `arName()` возвращают значения с заглавной буквы (`"User"`, `"Course"`, `"Lesson"`, `"Step"`).
- [ ] `UseCase.arName`/`arLabel` удалены; `ArClass` добавлен и используется.
- [ ] `UcMeta.description` удалён.
- [ ] Поле `order` удалено из Module, Project, Lesson, Step.
- [ ] Все тесты проходят: `bun test`.
- [ ] Проверки чисты: `bun run check`.
- [ ] Документация: `domain-service.md` создан, `ddd-domain/SKILL.md` и `ddd-infra/SKILL.md` обновлены.

---

## За рамками

- Миграция всех существующих UseCase на Domain Service (только `create-lesson` и `create-step` как примеры).
- Вложенные транзакции (savepoints).
- Распределённые транзакции.
- Автоматическая перенумерация при удалении элементов из массива.
