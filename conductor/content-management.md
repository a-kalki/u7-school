# Управление учебным контентом: фронт работ

> v7 (2026-08-01). Объединяющий документ для серии треков.
> **Этот документ содержит ПОЛНЫЙ контекст для генерации треков в другой сессии.**
> Ниже — все архитектурные решения, карта существующего кода (Приложение А), целевое состояние и декомпозиция.
> Для генерации трека: прочитай этот документ → загрузи skill `conductor-newtrack` → создай трек.
> После утверждения — разлагается на треки в `conductor/tracks/`.
>
> **Принцип рефакторинга:** трек может ломать нижележащий функционал, если тот восстанавливается в следующем треке. Промежуточные сломанные состояния допустимы.
>
> **Связанные conductor-документы:**
> - [`conductor/development-roadmap.md`](./development-roadmap.md) — **дорожная карта:** порядок релизов, миграции, зависимости между инициативами
> - `conductor/workflow.md` — процесс работы conductor (создание треков, генерация планов)
> - `conductor/architecture-evolution.md` — архитектурные правила (domain boundaries, зависимости пакетов)
> - `conductor/code_styleguides/domain-boundaries.md` — где размещать логику
> - `conductor/index.md` — индекс всех документов
>
> **Главные изменения от v6:** добавлены мета-поля (`planMd`, `lessonMd`, `summaryMd`) в entity; добавлен файловый Import/Export (папка ↔ JSON) с dry-run; `steps.md` генерируется из Step[] (не хранится); `.content-meta.json` для точного сопоставления при импорте; `AUTHOR_GUIDE.md` — единый промпт для ИИ-агентов; порядок треков перестроен: Import/Export до форка.
>
> **Решения, принятые в сессии v7 (2026-08-01):**
> 1. `steps.md` НЕ хранить в entity — генерировать из Step[] при экспорте, парсить при импорте.
> 2. `.content-meta.json` — если файл есть → обновление (UUID известны); если нет → создание нового. Title не используется для сопоставления.
> 3. Импорт всегда через dry-run → утверждение → запись.
> 4. Два режима импорта: полный модуль и отдельные уроки (например, «уроки 2–4 проекта p1»).
> 5. Создание всегда через `plan.md` (обязательный файл со структурой модуля).
> 6. Fork-режим в импорте — архитектурный задел в Треке 3, реализация в Треке 4.
> 7. Менторские файлы (`mentor/`) — в техдолг (TODO.md).
> 8. Изображения и бинарные ресурсы — на будущее, пока не используются.

---

## 1. Проблема и цель

Автор работает с `data/courses/*.json` напрямую. Есть только UC **создания**. Нет update/archive/fork. Реструктуризация модуля ломает прод-потоки. Нет безопасного способа создать новую версию контента.

**Цель:** API для автора, чтобы безопасно **добавлять и редактировать** объекты контента, не ломая прод-потоки. **Единые правила на всех уровнях** (от курса до шага). **Файловый обмен** (папка ↔ JSON) для работы автора локально и с ИИ-агентами. При множестве авторов — стабильность, удобство, низкая кривая обучения.

---

## 2. Ключевой механизм: frozen snapshots

### 2.1. Как работает защита потоков

При создании потока `CreateStreamUc` строит дерево `проекты → уроки → шаги` из **published** сущностей → копирует в `stream.contentSnapshot`. После этого поток живёт с **замороженной копией**. Студент хранит `steps[]` с `stepId` — UUID шагов из снапшота. Навигация (`findNextStep`, `findStepContext`) обходят **только снапшот** — модуль не перечитывается.

**Следствие:** изменение `modules.json` / `lessons.json` / `steps.json` не меняет структуру существующих потоков.

### 2.2. Snapshot = чистое UUID-дерево (без title'ов)

**Решение (пункт 2):** убрать из снапшота ВСЕ title'ы. Снапшот — только структура (UUID-дерево):

```ts
type ContentSnapshot = Array<{
  projectUuid: string
  lessons: Array<{
    lessonUuid: string
    stepUuids: string[]
  }>
}>
```

ВСЕ отображаемые данные (projectTitle, lessonTitle, step content) читаются **live по UUID**:
- `projectTitle` — загрузить модуль (`stream.moduleId`), найти project VO по `projectUuid`.
- `lessonTitle` — загрузить lesson по `lessonUuid`.
- `step.content` — загрузить step по `stepUuid`.

**Почему не добавить step title в снапшот?** Это не решает асимметрию (step content всё равно live). Делает схему сложнее. Лучше убрать ВСЕ title'ы — полная однообразность.

**Почему убрать title'ы — правильно:**

| | Title'ы в снапшоте (v5) | Чистое UUID-дерево (v6) |
|---|---|---|
| Edit project title | невидим активным (frozen) | виден всем (live) — hotfix |
| Edit lesson title | невидим активным (frozen) | виден всем (live) — hotfix |
| Edit step content | виден всем (live) | виден всем (live) — hotfix |
| Правило для автора | разное для title vs content | **одно правило: edit = видно всем** |
| Fork (new UUID) | скрывает от активных | скрывает от активных |

Единое правило: **edit (тот же UUID) = видно всем немедленно; fork (новый UUID) = скрыто от активных.** На всех уровнях. Автор не думает «заморожено или live» — всё live.

**Цена:** больше lookups для отображения (project/lesson title). Но это batch-загрузки по UUID — дёшево. Компенсируется DS callbacks (§3.13).

### 2.3. Большинство структурных правок — это edit, не fork

Frozen snapshots защищают активные потоки от структурных изменений. Автор может переставлять/добавлять/удалять шаги, уроки, проекты — **не создавая новые UUID**. Активные потоки продолжают по своему замороженному снапшоту. Новые потоки получают свежий снапшот.

**Форк (новый UUID) нужен только когда изменение не должно быть видно активным потокам:**
- Смена контента шага (активные должны видеть старый текст) → fork-step.
- Новая версия модуля (другая программа) → fork-module.

---

## 3. Архитектурная концепция

### 3.1. UUID везде — без code (пункт 3)

**Решение:** убрать `code`. ВСЕ связи — по UUID. Course → Phase → Module → Project → Lesson → Step — UUID на каждом уровне.

**Почему не нужен code:**

В v5 `code` служил двум целям:
1. **Auto-follow:** course ссылается на code, publish нового модуля (тот же code) автоматически переключает course.
2. **Gating:** `canEnrollNextModule` проверял completed codes.

Обе цели решаются **без code**:

1. **Auto-follow через publish-replace:** `publish-module-replace` UC сам обновляет course (`phase.moduleIds`: старый UUID → новый UUID). Автору не нужно править course вручную. Course ссылается по UUID — publish UC обновляет ссылку. Равномерно с другими уровнями: publish-step-replace обновляет lesson.stepIds, publish-lesson-replace обновляет project.lessonIds, и т.д.

2. **Gating через basedOn-цепочку (§3.5):** `canEnrollNextModule` проверяет, завершил ли студент prerequisite-модуль ИЛИ любого его предка (basedOn-цепочка). Не нужен code.

**Преимущества убирания code:**
- **Единое правило связей:** UUID на всех уровнях. Не нужно учить «code для course→module, UUID для остального».
- **Нет инварианта уникальности code:** не нужно проверять «один published на code».
- **Нет `ModuleRepo.getByCode`:** не нужен метод и его edge-cases (дубликаты).
- **Меньше миграций:** не нужно придумывать code'ы для существующих модулей.
- **CreateStream проще:** принимает `moduleId` (UUID), не нужно резолвить code→UUID.

**Code для будущих URL** — откладывается. Добавить поле позже (additive, не ломая). Не связано со связями.

### 3.2. `basedOn` на всех уровнях — provenance + gating (пункты 2, 5)

| Сущность | Поле | Тип | Назначение |
|----------|------|-----|------------|
| Course | `basedOn` | `uuid \| null` | курс-источник (если создан из шаблона) |
| Module | `basedOn` | `uuid \| null` | модуль-источник при форке |
| Project (VO) | `basedOn` | `uuid \| null` | проект-источник при форке |
| Lesson | `basedOn` | `uuid \| null` | урок-источник при форке |
| Step | `basedOn` | `uuid \| null` | шаг-источник при форке |

При форке: новый объект `basedOn = старый.uuid`. При создании с нуля: `basedOn = null`.

**Двойное назначение:**
1. **Provenance (аудит):** цепочка `M3.basedOn → M2 → M1 → null`. Какая версия у студента (по UUID в снапшоте → basedOn-цепочка).
2. **Gating (§3.5):** проверка завершения через basedOn-цепочку.

### 3.3. Edit vs Fork — единые правила на всех уровнях (пункт 4)

**Edit (тот же UUID):**
- **Контентный edit** (`update-step` content, `update-lesson` title, `update-module` title): виден **всем немедленно** (данные читаются live по UUID). Hotfix.
- **Структурный edit** (reorder, add, remove children): **невидим** активным потокам (снапшот frozen), виден только новым потокам. Не требует форка.

**Fork (новый UUID, deep-copy):**
- Создаёт draft-копию поддерева (новые UUID, `basedOn = старый`). Старый **не трогается**.
- Автор редактирует draft.
- **Publish-replace:** старый → archived (каскад), родитель обновляется (старый UUID → новый UUID), новый → published. Атомарно.

**Правило выбора:**
- Мелкая правка → edit (всем сразу).
- Реструктуризация (reorder/add/remove) → структурный edit (только новым, без форка).
- Смена смысла, активные не должны видеть → fork + publish-replace.
- Новая версия модуля → fork-module + publish-replace.

### 3.4. Форк на всех уровнях (пункт 4)

Форк поддерживается на каждом уровне. **Только replace** (без переиспользования). Создание форка не трогает старый. Когда draft → published, старый → archived.

| Уровень | Fork | Publish-replace |
|---------|------|-----------------|
| Step | `fork-step(S1)` → S2 (draft, basedOn=S1, копия контента) | `publish-step(S2)`: архивирует S1, обновляет lesson.stepIds (S1→S2), публикует S2 |
| Lesson | `fork-lesson(L1)` → L2 (draft, basedOn=L1) + deep-copy steps (basedOn=старые) | `publish-lesson(L2)`: архивирует L1+steps, обновляет project.lessonIds (L1→L2), публикует L2+steps |
| Project | `fork-project(P1)` → P2 (draft VO, basedOn=P1) + deep-copy lessons+steps | `publish-project(P2)`: архивирует P1+children, обновляет module.projects (P1→P2), публикует P2+children |
| Module | `fork-module(M1)` → M2 (draft, basedOn=M1) + deep-copy всего | `publish-module(M2)`: архивирует M1+children, обновляет course.moduleIds (M1→M2), публикует M2+children |

**Как publish-replace находит старый объект:** по `basedOn`. `newStep.basedOn → oldStepUuid`. Архивируем oldStepUuid, в родителе заменяем oldStepUuid → newStepUuid.

**Параллельная ветка (branch):** fork без последующего publish-replace. Новый объект (draft) публикуется без архивирования старого (`publish` без `-replace`). Используется для создания альтернативной версии. Родитель (course) вручную ссылается на нужный UUID. Оба published.

### 3.5. Gating через basedOn-цепочку (вместо code)

`canEnrollNextModule` проверяет, завершил ли студент prerequisite-модуль **или любого его предка**:

```ts
canEnrollNextModule(course, targetModuleId, completedModuleIds, repo):
  prevModuleId = course.getPrevModuleId(targetModuleId)
  if prevModuleId === undefined → true  // первый модуль
  if prevModuleId === null → false      // не в курсе

  // Идём по basedOn-цепочке от prerequisite
  let cursor = prevModuleId
  while cursor:
    if completedModuleIds.includes(cursor) → true
    cursor = (await repo.getByUuid(cursor))?.basedOn ?? null

  return false
```

**Пример:** Course = [M2, M3]. M2.basedOn = M1. Студент завершил M1 (старая версия).
- `getPrevModuleId(M3)` → M2.
- Цепочка: M2 → M1. `completedModuleIds.includes(M1)` → true. ✅

Работает для любой глубины версионирования. Не нужен code.

**Производительность:** цепочка короткая (2–3 версии). Загрузка модуля по UUID — дёшево. Только при зачислении (не частая операция).

### 3.6. Нет «окна без published» (пункт 5)

**Проблема:** если fork сразу архивирует старый, а новый — draft, то нет published-модуля.

**Решение:**
1. **Fork НЕ архивирует.** Создаёт draft. Старый остаётся published.
2. **Publish-replace архивирует атомарно.** `publish-module-replace`: архивирует старый + обновляет course + публикует новый — одна транзакция.
3. **Course readiness check (защита от багов).** `CourseFacade.isProgramReady(courseId)` — все `moduleIds` во всех фазах резолвятся в published-модуль (не archived). `CreateStreamUc` проверяет → если не готов → ошибка.

### 3.7. Каскадное архивирование (пункт 4)

При архивировании **все дети тоже архивируются:**

- `archive-module`: модуль → archived; все lessons с `moduleId` → archived; все steps с `moduleId` → archived.
- `archive-lesson`: урок → archived; все steps из `stepIds` → archived.
- `archive-project`: проект (VO) → archived; уроки проекта → archived (каскад); шаги → archived.
- `archive-step`: шаг → archived (лист).

**Каскад — в DS/UC** (оркестрирует загрузку детей из репо). Агрегат архивирует только себя (`status = archived`). Агрегаты не лезут в репо.

### 3.8. archived ≠ hidden

- `draft` — скрыт от всех, кроме author/admin. Не в live-структуре.
- `published` — в текущей программе. В каталоге, ContentPath, снапшоте новых потоков.
- `archived` — НЕ в текущей программе. **Но доступен по UUID** (для frozen-снапшотов активных потоков).

**Критично:** frozen-снапшот активного потока хранит UUID. Если объект архивирован, поток всё равно читает его контент по UUID. Без этого архивирование сломает активные потоки.

### 3.9. contentSnapshot → stream

`ContentSnapshot` — концепт потока. Переносится в `stream/domain/`:
- Тип + схема → `stream/domain/content-snapshot.ts` (чистое UUID-дерево, §2.2).
- Stream-навигация (`findNextStep`, `findStepContext`, `buildNavigationTree`, `computeProgress`) → `stream/domain/`. Методы принимают callbacks для загрузки title'ов (§3.13).
- Course имеет `resolveModuleContent(moduleId)` → `ModuleContent` (чистое UUID-дерево, course-тип). Каталог и content-path.
- `CreateStreamUc`: `resolveModuleContent(moduleId)` → маппит в `ContentSnapshot` → `StreamAr.create`.
- `CourseDs.findStepPosition` — остаётся в course (для content-path).

### 3.10. Project остаётся VO внутри Module

Project — value-object внутри Module (`projects: Project[]`). Deep-copy модуля естественно копирует VO-проекты. Fork-project создаёт новый VO внутри модуля (старый VO архивируется in-place). Модуль хранит published + archived VOs; `resolveModuleContent` фильтрует к published.

`moduleId` back-reference на Lesson/Step — **остаётся** (для каскадного архивирования: найти всех детей модуля). При deep-copy обновляется на новый moduleId.

### 3.11. Базовый агрегат (пункт 5)

Общая логика для всех content-агрегатов (Course, Module, Lesson, Step):
- `status: Status` — draft/published/archived.
- `basedOn: string | null`.
- `archive()` — `status = archived`.
- `publish()` — `status = published`.

**Решение:** ввести базовый класс `ContentAr<T>` (extends `Aggregate<T>`) с общими полями и методами. Entity-specific логика (update-поля, структурные операции) — в подклассах.

**Каскадное архивирование — НЕ в базовом классе.** Дерево разное:
- Module → Projects (VO) → Lessons → Steps (3 уровня).
- Lesson → Steps (1 уровень).
- Step → (лист).

Абстрактное `childIds` не отражает многоуровневый каскад. Каскад — в DS (знает структуру дерева, имеет доступ к репо через callbacks).

**Если общей логики окажется мало** (только `archive()` + `publish()` = 2 строки) — можно оставить агрегаты отдельными. Решение — при реализации Трека 1.

### 3.12. Visibility: `canRead` + `isPublished` вместо `getVisibleFor` (пункт 6)

Текущий `getVisibleFor(actor, module)` возвращает объект или null — смешивает два понятия:
1. **Читаемость** — может ли актор читать объект? (archived должен быть читаем для frozen-снапшотов).
2. **Членство в текущей программе** — published? (для каталога, снапшота новых потоков).

**Разделить:**

```ts
// На базовом ContentAr:
canRead(actor: User | undefined): boolean
// draft → только author/admin; published + archived → все.

isPublished(): boolean
// status === 'published'.

isArchived(): boolean
// status === 'archived'.
```

**Callers выбирают нужную проверку:**
- Студент читает шаг (bot story): `canRead(actor)` → archived тоже читается. ✅
- Каталог, resolveModuleContent, новый снапшот: фильтр по `isPublished()`.
- Admin/author browsing: `canRead` (возвращает true для всех статусов).

**Не возвращать `null`** — caller проверяет булевым методом, затем использует объект. Меньше `null`-проверок в callers.

### 3.13. DS callbacks для ленивого разрешения ресурсов (пункт 6 v5)

DS-методы могут принимать **callback-параметры** для получения внешних ресурсов:

```ts
// StreamDs.buildNavigationTree нужен projectTitle/lessonTitle.
// Снапшот — чистое UUID-дерево (без title'ов). Title'ы грузятся через callback.
StreamDs.buildNavigationTree(
  snapshot: ContentSnapshot,
  student: StudentState,
  resolve: {
    getProjectTitle: (projectUuid: string) => Promise<string>
    getLessonTitle: (lessonUuid: string) => Promise<string>
  },
): NavigationTree
```

UC передаёт callbacks (ленивый fetch). DS вызывает только когда нужен title.

**Когда применять:** большая вероятность, что ресурс не понадобится (ранний выход, условная логика). Когда ресурс нужен всегда — проще передать объект напрямую.

### 3.14. Repo-level валидация (пункт 7 v5)

Инварианты защищаются **в репозитории при каждом запросе:**
- `ModuleRepo.save(module)` — перед сохранением: проверить целостность (UUID уникален, basedOn-цепочка не циклична).
- Без code — нет инварианта «один published на code». Несколько published-модулей могут сосуществовать (branch).
- `content-validate.ts` — убирается как механизм защиты. Остаётся опциональным скриптом гигиены (orphan, dangling).

### 3.15. Мета-поля для авторского контента (новое в v7)

Автор работает с файлами `.md` локально (сам или через ИИ-агента). Система должна хранить этот контент как часть управляемого состояния — чтобы экспорт восстанавливал полную картину.

| Entity | Поле | Тип | Назначение |
|--------|------|-----|------------|
| Module | `planMd` | `string?` | Полный текст `module-N-plan.md` (структура модуля, цели, правила) |
| Module | `sourcePath` | `string?` | Относительный путь папки-источника при последнем импорте (audit trail) |
| Project (VO) | `planMd` | `string?` | Метаинформация проекта (цель, результат, описание) |
| Lesson | `lessonMd` | `string?` | Теория + цель урока (`lesson.md`) |
| Lesson | `summaryMd` | `string?` | Итог урока (`summary.md`) |

**`steps.md` — НЕ хранится.** Генерируется детерминированно из `Step[]` при экспорте. При импорте парсится и обновляет поля `Step.description`, `Step.content`, `Step.kind`, `Step.code`, `Step.language`.

**Преимущества:**
- Экспорт восстанавливает полную картину — автор получает те же файлы, что были импортированы.
- ИИ-агент видит полный контекст модуля (`planMd`) при работе над отдельным уроком.
- Мета-контент — часть managed-состояния, не теряется между импортами.

---

## 4. Единые правила работы с контентом (от курса до шага)

| Правило | Описание |
|---------|----------|
| **UUID-связи** | Все связи — по UUID. Course→Module→Project→Lesson→Step. Без code. |
| **status** | `draft` (скрыт) → `published` (в программе) → `archived` (по UUID). На всех уровнях. |
| **basedOn** | `uuid \| null`. Provenance + gating chain. На всех уровнях. |
| **Мета-поля** | `planMd` (Module, Project), `lessonMd` + `summaryMd` (Lesson). Хранятся в entity. |
| **Edit (тот же UUID)** | Контентный: виден всем (live). Структурный: невидим активным (frozen snapshot). |
| **Fork (новый UUID)** | Draft-копия (basedOn=старый). Старый не трогается. На всех уровнях. |
| **Publish-replace** | Архивирует старый (каскад) + обновляет родителя + публикует новый. Атомарно. |
| **Publish (branch)** | Публикует без архивирования. Оба published. Родитель вручную выбирает. |
| **Archive** | Каскад: дети тоже archived. archived ≠ hidden (доступен по UUID). |
| **canRead / isPublished** | Раздельные проверки. canRead: published+archived. isPublished: только published. |

---

## 5. Авторские workflows (доменные)

### W1: Исправить опечатку в шаге (hotfix)
- **Автор:** `update-step(S1, {content: fixedText})`
- **Данные:** steps.json — S1.content обновлён. Тот же UUID.
- **Активные:** читают S1 по UUID → видят исправление **немедленно**. ✅
- **Новые:** видят. ✅

### W2: Переписать контент шага (активные не должны видеть)
- **Автор:** `fork-step(S1)` → S2 (draft, basedOn=S1). Редактирует. `publish-step-replace(S2)`: архивирует S1, lesson.stepIds (S1→S2), публикует S2.
- **Данные:** steps.json — S1 (archived, старый текст), S2 (published, новый текст, basedOn=S1). lessons.json — stepIds обновлён.
- **Активные:** frozen-снапшот → S1 → archived, по UUID → **старый текст**. ✅
- **Новые:** свежий снапшот → S2 → **новый текст**. ✅

### W3: Добавить шаг в урок
- **Автор:** `create-step(content)` → S3 (draft → publish). `lesson.addStep(L1, S3)`.
- **Активные:** frozen → не видят S3. ✅ | **Новые:** видят S3. ✅

### W4: Удалить шаг из урока
- **Автор:** `lesson.removeStep(L1, S1)`. `archive-step(S1)`.
- **Активные:** frozen → S1 → archived, по UUID. ✅ | **Новые:** нет S1. ✅

### W5: Переставить шаги в уроке
- **Автор:** `lesson.reorderSteps(L1, [S3, S1, S2])`.
- **Активные:** frozen → старый порядок. ✅ | **Новые:** новый порядок. ✅

### W6–W11: Уроки/проекты (add/remove/reorder)
Аналогично W3–W5. Структурный edit (тот же UUID). Frozen защищает активных. Без форка.

### W12: Новая версия модуля (replace)
- **Автор:** `fork-module(M1)` → M2 (draft, basedOn=M1, deep-copy). Редактирует. `publish-module-replace(M2)`: архивирует M1 (каскад), обновляет course.moduleIds (M1→M2), публикует M2.
- **Данные:** modules.json — M1 (archived), M2 (published, basedOn=M1). Новые lessons/steps (basedOn=старые). Старые → archived.
- **Активные:** frozen → UUID'ы M1 → archived, по UUID → **старая версия**. ✅
- **Новые:** `resolveModuleContent(M2)` → свежий снапшот → **новая версия**. ✅
- **Gating:** basedOn-цепочка (§3.5). ✅

### W13: Параллельная версия модуля (branch)
- **Автор:** `fork-module(M1)` → M2 (draft, basedOn=M1). Редактирует. `publish-module(M2)` (без -replace): M2 → published, M1 остаётся published.
- **Данные:** modules.json — M1 (published), M2 (published, basedOn=M1).
- **Course:** вручную `course.addModuleToPhase(phase, M2)` (или заменяет M1 на M2 в phase).
- **Активные:** не затронуты. ✅ | **Новые:** по course.moduleIds (M1 или M2). ✅

### Сводная таблица

| Сценарий | Операция | Новый UUID? | Активным | Новым |
|----------|----------|-------------|----------|-------|
| Опечатка в шаге | edit (content) | нет | видят сразу | видят |
| Смена title (любого) | edit | нет | видят сразу | видят |
| Смена смысла шага | fork-step + publish-replace | да (шаг) | старый текст | новый текст |
| Добавить step/lesson/project | create + add | да (новый) | не видят | видят |
| Удалить step/lesson/project | remove + archive (cascade) | нет | видят (archived) | не видят |
| Переставить children | reorder (edit) | нет | старый порядок | новый |
| Новая версия модуля | fork-module + publish-replace | да (всё) | старая версия | новая |
| Параллельный модуль | fork-module + publish (branch) | да (всё) | не затронуты | по UUID в course |

---

## 6. Файловый обмен: Import/Export (новое в v7)

### 6.1. Структура папки модуля

```
module-<N>-<slug>/
├── plan.md                  # = Module.planMd
├── .content-meta.json       # UUID и структурные связи (генерируется при экспорте)
├── projects/
│   └── p<X>-<project-slug>/
│       ├── plan.md          # = Project.planMd (опционально)
│       └── lessons/
│           └── l<Y>-<lesson-slug>/
│               ├── lesson.md    # = Lesson.lessonMd
│               ├── steps.md     # ← генерируется из Step[] (не хранится)
│               └── summary.md   # = Lesson.summaryMd
```

**Именование папок:** префиксы `p1-`, `l2-` для порядка. Slug — human-readable из title (транслитерация, lowercase, дефисы). Порядок определяется положением в `module.projects[]` и `project.lessonIds[]`.

### 6.2. `.content-meta.json` — точное сопоставление

Генерируется при экспорте. Содержит UUID всех сущностей и структурные связи. **Не редактируется руками.**

```json
{
  "moduleUuid": "abc-123",
  "projects": {
    "p1-git-tdd": {
      "uuid": "proj-uuid-1",
      "lessons": {
        "l1-1-git-intro": {
          "uuid": "lesson-uuid-1",
          "stepUuids": ["step-uuid-1", "step-uuid-2"]
        },
        "l1-2-first-repo": {
          "uuid": "lesson-uuid-2",
          "stepUuids": ["step-uuid-3"]
        }
      }
    }
  }
}
```

**Правило сопоставления при импорте:**
- `.content-meta.json` **есть** → обновление существующего. UUID берутся из meta, title в `.md` игнорируется для сопоставления.
- `.content-meta.json` **нет** → создание нового (все новые UUID).
- Title **не используется** для сопоставления вообще.

### 6.3. Формат `steps.md`

**Машиночитаемый Markdown с жёсткой структурой.** Парсится детерминированно (без ИИ). Генератор (Step[] → steps.md) и парсер (steps.md → команды обновления) — чистые функции в `course/domain/`.

```markdown
# Шаги урока: «Название урока»

## Шаг 1: Название шага
- **Тип:** text
- **Описание:** Краткое описание шага

Контент шага. Может быть многострочным.

Может содержать списки, код и т.д.

---

## Шаг 2: Название шага
- **Тип:** code
- **Язык:** javascript
- **Описание:** Реализовать функцию

\`\`\`javascript
function hello() {
  return 'world';
}
\`\`\`

---

## Шаг 3: Название шага
- **Тип:** file
- **Описание:** Скачать файл
- **Файл:** path/to/file.zip
```

**Правила парсинга:**
- Секции шагов разделены `---` (horizontal rule)
- Каждый шаг начинается с `## Шаг N: Название`
- Блок meta — строки `- **Ключ:** Значение` до первой пустой строки
- Всё после meta-блока до `---` или конца файла — `content`
- Для `code`: блок кода внутри content — поле `code`
- Для `file`: ключ `Файл` в meta — путь к файлу

### 6.4. Два режима импорта

**Режим 1: полный модуль.** Импорт всей папки модуля. Создаёт/обновляет модуль, все проекты, уроки и шаги.

**Режим 2: отдельные уроки.** Импорт выбранных уроков (например, «уроки 2–4 проекта p1»). Обновляет только указанные уроки и их шаги. Структура проектов и остальные уроки не трогаются.

Создание **всегда** идёт через `plan.md` — обязательный файл со структурой модуля, проектов и уроков.

### 6.5. Dry-run отчёт

Импорт НЕ пишет сразу. Сначала парсит папку, сопоставляет с существующими сущностями (через `.content-meta.json`) и выдаёт отчёт:

```
╔══════════════════════════════════════════════════════════╗
║  ИМПОРТ МОДУЛЯ: «Основы JS. Алгоритмика»              ║
║  Режим: update (module-uuid-xxx)                       ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  🆕 Проект «Массивы: трансформация»                     ║
║     Урок 6.1 «fill()» — СОЗДАТЬ (новый)                ║
║     Урок 6.2 «reverse()» — СОЗДАТЬ (новый)             ║
║                                                          ║
║  ✏️ Проект «Git, TDD и сравнение строк»                  ║
║     Урок 1.1 «Что такое Git» — ОБНОВИТЬ (hotfix)       ║
║       → lesson.md: изменён                              ║
║       → steps.md: 9 шагов → 10 шагов (+1 новый)        ║
║     Урок 1.2 «Первый репозиторий» — без изменений       ║
║     Урок 1.5 «Таблица символов» — ОБНОВИТЬ (hotfix)    ║
║       → steps.md: шаг 3 изменён контент                 ║
║                                                          ║
║  🔀 Мета-поля модуля:                                    ║
║     plan.md: изменён                                    ║
║                                                          ║
║  Всего: 3 создания, 2 hotfix-обновления, 0 форков      ║
╚══════════════════════════════════════════════════════════╝
Применить? [y/N]
```

После утверждения — запись.

### 6.6. Экспорт

`export-module(moduleId)` → собирает структуру папки из entity:
- `Module.planMd` → `plan.md`
- `Module.projects` → папки `p1-slug/...`
- `Lesson.lessonMd` / `Lesson.summaryMd` → `lesson.md` / `summary.md`
- `Step[]` → `steps.md` (генерируется детерминированно)
- Все UUID → `.content-meta.json`

Экспорт всегда полный (весь модуль). Для отдельных уроков — автор скачивает модуль и берёт нужные папки.

### 6.7. AUTHOR_GUIDE.md — промпт для ИИ-агентов

Отдельный файл в корне репо. Описывает:
- Структуру папки модуля
- Форматы всех `.md`-файлов (`plan.md`, `lesson.md`, `steps.md`, `summary.md`)
- Процесс создания контента с нуля
- Процесс обновления существующего

Автор даёт ИИ-агенту этот файл как промпт: «прочитай AUTHOR_GUIDE.md и создай уроки для проекта X». ИИ понимает, в каком формате и куда писать.

---

## 7. Текущее состояние → целевое

### 7.1. Структура данных

| Сущность | Сейчас | Целевое |
|----------|--------|---------|
| Course | нет basedOn | + `basedOn: uuid\|null` |
| Course.phase | `moduleIds: uuid[]` | без изменений (UUID) |
| Module | нет basedOn | + `basedOn: uuid\|null` |
| Module | нет мета-полей | + `planMd: string?`, + `sourcePath: string?` |
| Module.projects | `Project[]` (VO) | + `Project.basedOn: uuid\|null`, + `Project.planMd: string?` |
| Lesson | нет basedOn | + `basedOn: uuid\|null` |
| Lesson | нет мета-полей | + `lessonMd: string?`, + `summaryMd: string?` |
| Step | нет basedOn | + `basedOn: uuid\|null` |
| Stream.contentSnapshot | тип в course, с title'ами | тип в stream, **чистое UUID-дерево** (без title'ов) |
| Stream.moduleId | UUID | UUID (без изменений) |

### 7.2. API

| Операция | Сейчас | Целевое |
|----------|--------|---------|
| Create | ✅ | ✅ |
| Read | ✅ | ✅ (canRead / isPublished) |
| Update (content/metadata) | ❌ | ✅ update-* (live, по UUID) |
| Update (meta-md fields) | ❌ | ✅ update-* (planMd, lessonMd, summaryMd) |
| Update (structural: reorder/add/remove) | частично (add) | ✅ reorder-*, remove-* |
| Archive (cascade) | ❌ | ✅ archive-* (≠ hidden) |
| Fork (all levels) | ❌ | ✅ fork-step/lesson/project/module |
| Publish-replace (all levels) | ❌ | ✅ publish-*-replace (archive old + update parent) |
| Publish (branch) | ❌ | ✅ publish-* (без archive) |
| Resolve hierarchy | buildSnapshot (course, с title'ами) | resolveModuleContent (course, чистое UUID-дерево) |
| Course readiness | ❌ | ✅ isProgramReady(courseId) |
| Gating | canEnrollNextModule (UUID) | canEnrollNextModule + basedOn-chain |
| Export module → папка | ❌ | ✅ export-module (полный модуль, все мета-поля, .content-meta.json) |
| Import папка → модуль | ❌ | ✅ import-module (полный, dry-run + apply) |
| Import уроков | ❌ | ✅ import-lessons (выбранные уроки, dry-run + apply) |
| Generate steps.md из Step[] | ❌ | ✅ stepsMdGenerator (чистая функция) |
| Parse steps.md → команды | ❌ | ✅ stepsMdParser (чистая функция) |

---

## 8. Декомпозиция на треки

**Принцип:** API (domain + UC) → Snapshot → Import/Export → Fork. Треки последовательны.

---

### Трек 1: «basedOn + visibility + CRUD + мета-поля»

**Цель:** `basedOn` на всех сущностях. Visibility refactor (canRead/isPublished, archived доступен). CRUD: update, archive (каскад), structural ops. Мета-поля (`planMd`, `lessonMd`, `summaryMd`, `sourcePath`).

**Domain:**
- Все entity-схемы: + `basedOn: v.optional(v.pipe(v.string(), v.uuid()))`.
- `ProjectSchema` (VO): + `basedOn`, + `planMd: v.optional(v.string())`.
- `ModuleSchema`: + `planMd: v.optional(v.string())`, + `sourcePath: v.optional(v.string())`.
- `LessonSchema`: + `lessonMd: v.optional(v.string())`, + `summaryMd: v.optional(v.string())`.
- Базовый класс `ContentAr<T>` (опционально, §3.11): status, basedOn, archive(), publish(), canRead(), isPublished().
- `StepAr.update({...})`, `LessonAr.update({...})`, `ModuleAr.update({...})`, `CourseAr.update({...})` — включая мета-поля.
- `LessonAr.removeStep(stepId)`, `LessonAr.reorderSteps(stepIds[])`.
- `ModuleAr.removeLessonFromProject(...)`, `ModuleAr.reorderLessonsInProject(...)`, `ModuleAr.removeProject(...)`, `ModuleAr.reorderProjects(...)`.
- Archive: `*Ar.archive()` (self only). Каскад — в DS/UC.

**Visibility (§3.12):**
- Заменить `getVisibleFor` на `canRead(actor)` + `isPublished()` + `isArchived()` на всех уровнях.
- `resolveModuleContent`: фильтр по `isPublished()`.
- archived доступен по UUID (canRead → true).

**UC:** update-*, archive-* (с каскадом через DS), remove-*, reorder-*.

**Каскадный archive UC** (оркестрация через DS):
- `archive-module(M1)`: загрузить M1 → ModuleAr.archive() → загрузить lessons (moduleId=M1) → LessonAr.archive() → загрузить steps (moduleId=M1) → StepAr.archive(). Сохранить всё.
- DS использует callbacks (§3.13) для загрузки детей.

**Зависимости:** нет.

---

### Трек 2: «contentSnapshot → stream (чистое UUID-дерево)»

**Цель:** ContentSnapshot (чистое UUID-дерево, без title'ов) переносится в stream. Course имеет `resolveModuleContent` → `ModuleContent`. Catalog/content-path/stream-creation восстановлены.

**Изменения:**
- `ContentSnapshot` тип + схема → `stream/domain/content-snapshot.ts`: `{projectUuid, lessons: [{lessonUuid, stepUuids}]}`. Без title'ов.
- `CourseDs.buildSnapshot` → `resolveModuleContent(moduleId)` → `ModuleContent` (чистое UUID-дерево). Course-side.
- `CourseFacade`: `resolveModuleContent(moduleId)` (вместо `getModuleSnapshot`).
- `CreateStreamUc`: `resolveModuleContent(moduleId)` → маппит в `ContentSnapshot` → `StreamAr.create`.
- Stream-traversal (`findNextStep`, `findStepContext`, `buildNavigationTree`, `computeProgress`) → `stream/domain/`. Принимают callbacks для title'ов (§3.13).
- `CourseDs.findStepPosition` — остаётся в course (для content-path).
- Миграция: streams.json — убрать title'ы из contentSnapshot.

**Зависимости:** Трек 1.

---

### Трек 3: «Import/Export + CLI + воркфлоу»

**Цель:** Автор работает через файловый обмен (папка ↔ JSON), не через прямой edit JSON. Детерминированные парсеры/генераторы. Dry-run. `AUTHOR_GUIDE.md`. Fork-режим — **архитектурный задел**, реализация в Треке 4.

**Domain (course/domain/):**
- `stepsMdGenerator.ts` — Step[] → строка `steps.md` (чистая функция).
- `stepsMdParser.ts` — строка `steps.md` → массив команд обновления шагов (чистая функция).
- `moduleExporter.ts` — Module + Lessons + Steps → объект папки (memory-structure: `ModuleFolder`).
- `moduleImporter.ts` — `ModuleFolder` + `.content-meta.json` → dry-run отчёт → команды create/update.

**Типы:**
```ts
// Структура папки модуля в памяти
type ModuleFolder = {
  planMd: string | null
  meta: ContentMetaFile | null  // .content-meta.json
  projects: ProjectFolder[]
}
type ProjectFolder = {
  slug: string
  planMd: string | null
  lessons: LessonFolder[]
}
type LessonFolder = {
  slug: string
  lessonMd: string | null
  stepsMd: string | null
  summaryMd: string | null
}

// .content-meta.json
type ContentMetaFile = {
  moduleUuid: string
  projects: Record<string, {
    uuid: string
    lessons: Record<string, {
      uuid: string
      stepUuids: string[]
    }>
  }>
}

// Отчёт dry-run
type ImportReport = {
  module: { action: 'create' | 'update' | 'unchanged', changes: string[] }
  projects: Array<{ slug: string, action: 'create' | 'update' | 'unchanged', changes: string[] }>
  lessons: Array<{ slug: string, action: 'create' | 'update' | 'unchanged', changes: string[] }>
  summary: { creates: number, updates: number, forks: number }
}
```

**UC:**
- `export-module(moduleId)` → собирает папку из entity → пишет на диск / отдаёт zip.
- `import-module(folderPath)` → парсит папку → сопоставляет с существующим через `.content-meta.json` → dry-run отчёт → apply (create/update через UC Трека 1).
- `import-lessons(folderPath, lessonSlugs[])` → парсит выбранные уроки → dry-run → apply.

**CLI:**
- `content-export <moduleId> --output <dir>` — экспорт в папку.
- `content-import <dir> [--new | --update <moduleId>]` — импорт с dry-run.
- `content-import-lessons <dir> --lessons <slugs>` — импорт отдельных уроков.
- `content-validate <dir>` — проверка структуры папки перед импортом (валидация формата).

**AUTHOR_GUIDE.md:**
- Файл в корне репо. Описывает структуру папки, форматы файлов, workflow создания и обновления.
- Это же — промпт для ИИ-агента.

**Воркфлоу:**
- Запрет прямого edit `data/courses/*.json`.
- Правила: контентный edit (hotfix) vs структурный edit (новым) vs fork (новая версия) — fork в Треке 4.
- Процедуры: создание модуля с нуля (папка → import), обновление модуля (export → edit → import).

**Зависимости:** Трек 1, Трек 2.

**Не входит (отложено до Трека 4):**
- Fork-режим в импорте (всегда edit/create, без fork).
- Менторские файлы (экспорт/импорт папки `mentor/` внутрь урока) — в техдолг (TODO.md).

---

### Трек 4: «Форк на всех уровнях + publish-replace + gating»

**Цель:** Безопасное создание новой версии на любом уровне. Deep-copy. Provenance. Gating через basedOn. Fork-режим в импорте.

**Domain:**
- `StepAr.fork()` → новый StepAr (новый uuid, basedOn=старый, копия контента, draft).
- `LessonAr.fork(newModuleId)` → новый LessonAr (basedOn=старый, draft) + заготовка для fork steps.
- `ModuleAr.fork()` → новый ModuleAr (новый uuid, basedOn=старый, draft, deep-copied projects VOs с новыми uuid + basedOn).
- `CourseDs.forkChildren(...)` → deep-copy поддерева (новые uuid, basedOn, remapped childIds). Координирует через callbacks (§3.13).

**UC:**
- `fork-step(stepUuid)` → draft copy.
- `fork-lesson(lessonUuid)` → draft copy + deep-copy steps.
- `fork-project(moduleUuid, projectUuid)` → draft copy + deep-copy lessons+steps.
- `fork-module(moduleUuid)` → draft copy + deep-copy всего.
- `publish-step-replace(newStepUuid)`: по basedOn найти старый → archive → update lesson.stepIds → publish new.
- `publish-lesson-replace(newLessonUuid)`: аналогично + каскад steps.
- `publish-project-replace(newProjectUuid, moduleUuid)`: аналогично + каскад.
- `publish-module-replace(newModuleUuid)`: по basedOn найти старый → archive (каскад) → update course.moduleIds → publish new.
- `publish-step/lesson/project/module(newUuid)` (branch, без -replace): просто publish.

**Gating (§3.5):**
- `CoursePolicy.canEnrollNextModule` — walks basedOn-chain. Принимает `repo` (или callback `getModuleByUuid`) для ходьбы по цепочке.

**Course readiness (§3.6):**
- `CourseFacade.isProgramReady(courseId)`: все moduleIds → published.
- `CreateStreamUc`: проверка readiness.

**API-предупреждение:** fork UC: «новая версия видна только будущим; активные продолжают на старой».

**`update-stream-snapshot.ts`:** ограничить/вынести (§6.3).

**Доработка импорта:** добавить режим `--fork` в `import-module` и `import-lessons` — создание fork + publish-replace вместо edit.

**Зависимости:** Трек 1, Трек 2, Трек 3.

---

### Трек F (будущий): «Bot/Web UI для автора»

API готово. Реализация — когда встанет потребность.

---

## 9. Карта зависимостей

```
1 (basedOn + visibility + CRUD + мета-поля)
├──→ 2 (contentSnapshot → stream, чистое UUID-дерево)
│     └──→ 3 (Import/Export + CLI + воркфлоу)
│            └──→ 4 (Форк + publish-replace + gating + fork-режим в импорте)
│
└──→ (Трек 2 и Трек 3 могут использовать CRUD и мета-поля из Трека 1)
```

---

## 10. Влияние на существующий код

### Без изменений (семантически)
- `Course.phase.moduleIds` — UUID, остаётся.
- `Module.projects` (VO), `Project.lessonIds`, `Lesson.stepIds` — UUID-связи.
- `Lesson.moduleId`, `Step.moduleId` — back-reference, остаётся.
- `Stream.moduleId` — UUID (frozen).
- `Student` — stepUuids из снапшота.
- Stream-traversal — логика та же, тип перенесён, callbacks для title'ов.

### С изменениями (по трекам)

**Трек 1:**
- Все entity-схемы: + `basedOn`.
- `ProjectSchema` (VO): + `basedOn`, + `planMd`.
- `ModuleSchema`: + `planMd`, + `sourcePath`.
- `LessonSchema`: + `lessonMd`, + `summaryMd`.
- Базовый `ContentAr` (опционально).
- `getVisibleFor` → `canRead` + `isPublished` + `isArchived` (на всех уровнях).
- `*Ar.update(...)`, `*Ar.archive()`, structural ops (remove, reorder).

**Трек 2:**
- `CourseDs.buildSnapshot` → `resolveModuleContent` (чистое UUID-дерево).
- `CourseFacade`: `resolveModuleContent(moduleId)`, `isProgramReady`. Убрать `getModuleSnapshot`.
- `CreateStreamUc`: moduleId → snapshot + readiness check.
- Stream-traversal: callbacks для title'ов.
- `content-snapshot.ts` → `stream/domain/` (чистое UUID-дерево). `ModuleContent` — в course.
- Миграция: streams.json — убрать title'ы из snapshot.

**Трек 3:**
- Новые файлы: `stepsMdGenerator.ts`, `stepsMdParser.ts`, `moduleExporter.ts`, `moduleImporter.ts`.
- UC: `export-module`, `import-module`, `import-lessons`.
- CLI: `content-export`, `content-import`, `content-import-lessons`, `content-validate`.
- `AUTHOR_GUIDE.md` в корне репо.
- Миграция: заполнить `planMd`, `lessonMd`, `summaryMd` из существующих JSON (если есть исходные .md).

**Трек 4:**
- `*Ar.fork()` — фабрики копий.
- `CourseDs.forkChildren(...)` — deep-copy координация.
- `CoursePolicy.canEnrollNextModule` — basedOn-chain walk.
- Fork-режим в `import-module`/`import-lessons`.

---

## 11. Приложение А: Карта существующего кода

> **Критично для генерации треков.** Здесь перечислены конкретные файлы, которые затрагиваются изменениями. Используй эту карту при составлении `plan.md` трека.

### 11.1. Структура монорепо

```
packages/
├── core/          # Фреймворк (Aggregate, UseCase, порты). НЕ трогать.
├── app/           # Главный модуль u7-school. НЕ зависит от domain-модулей.
├── course/        # Домен курсов: Course, Module, Lesson, Step, ContentSnapshot
├── stream/        # Домен потоков: Stream, Student, enrollment
├── user/          # Домен пользователей: User, Role, Policy
└── onboarding/    # Домен онбординга

apps/
├── u7-bot/        # Telegram-бот
└── u7-cli/        # CLI-утилиты

data/courses/      # JSON-хранилище (в будущем — БД)
├── courses.json
├── modules.json
├── lessons.json
└── steps.json
```

### 11.2. Ключевые файлы (domain)

| Файл | Содержит | Трек |
|------|----------|------|
| `packages/course/src/domain/course/entity.ts` | `CourseSchema`, `Course` | 1 |
| `packages/course/src/domain/course/a-root.ts` | `CourseAr` | 1 |
| `packages/course/src/domain/course/policy.ts` | `CoursePolicy` (canCreate, canRead, canEdit, canEnrollNextModule) | 1, 4 |
| `packages/course/src/domain/module/entity.ts` | `ModuleSchema`, `ProjectSchema`, `Module`, `Project` | 1 |
| `packages/course/src/domain/module/a-root.ts` | `ModuleAr` (getVisibleFor, addProject, publish, etc.) | 1 |
| `packages/course/src/domain/module/policy.ts` | `ModulePolicy` | 1 |
| `packages/course/src/domain/module/get-visible-for.test.ts` | Тесты getVisibleFor | 1 |
| `packages/course/src/domain/lesson/entity.ts` | `LessonSchema`, `Lesson` | 1 |
| `packages/course/src/domain/lesson/a-root.ts` | `LessonAr` | 1 |
| `packages/course/src/domain/lesson/policy.ts` | `LessonPolicy` | 1 |
| `packages/course/src/domain/step/entity.ts` | `StepSchema`, `Step`, `StepText`, `StepCode`, `StepFile` | 1 |
| `packages/course/src/domain/step/a-root.ts` | `StepAr` | 1 |
| `packages/course/src/domain/step/policy.ts` | `StepPolicy` | 1 |
| `packages/course/src/domain/status.ts` | `Status` enum (DRAFT, PUBLISHED, ARCHIVED), `StatusSchema` | — |
| `packages/course/src/domain/content-snapshot.ts` | `ContentSnapshot`, `ContentSnapshotSchema` (с title'ами, v5) | 2 |
| `packages/course/src/domain/course-ds.ts` | `CourseDs` (buildSnapshot, findStepPosition, etc.) | 2 |
| `packages/course/src/domain/facade.ts` | `CourseFacade` interface (getModuleSnapshot, getCourseProgram, etc.) | 2 |
| `packages/stream/src/domain/stream/entity.ts` | `StreamSchema`, `Stream` (contentSnapshot с title'ами) | 2 |
| `packages/stream/src/domain/stream/a-root.ts` | `StreamAr` (create, findNextStep, findStepContext, enroll) | 2 |
| `packages/stream/src/domain/stream/policy.ts` | `StreamPolicy` (canEnrollNextModule) | 4 |

### 11.3. Ключевые файлы (API / UC)

| Файл | Содержит | Трек |
|------|----------|------|
| `packages/course/src/api/module/create-module-uc.ts` | `CreateModuleUc` | — |
| `packages/course/src/api/module/publish-module-uc.ts` | `PublishModuleUc` | 1 |
| `packages/course/src/api/module/get-module-uc.ts` | `GetModuleUc` (getVisibleFor) | 1 |
| `packages/course/src/api/module/get-module-snapshot-uc.ts` | `GetModuleSnapshotUc` (buildSnapshot) | 2 |
| `packages/course/src/api/module/enrich-module-uc.ts` | `EnrichModuleUc` | — |
| `packages/course/src/api/module/add-project-uc.ts` | `AddProjectUc` | — |
| `packages/course/src/api/lesson/create-lesson-uc.ts` | `CreateLessonUc` | — |
| `packages/course/src/api/lesson/get-lesson-uc.ts` | `GetLessonUc` | 1 |
| `packages/course/src/api/step/create-step-uc.ts` | `CreateStepUc` | — |
| `packages/course/src/api/step/get-step-uc.ts` | `GetStepUc` | 1 |
| `packages/course/src/api/step/get-steps-by-lessons-uc.ts` | `GetStepsByLessonsUc` | 1 |
| `packages/course/src/api/course/create-course-uc.ts` | `CreateCourseUc` | — |
| `packages/course/src/api/course/get-course-uc.ts` | `GetCourseUc` | 1 |
| `packages/course/src/api/course/add-module-to-course-uc.ts` | `AddModuleToCourseUc` | — |
| `packages/stream/src/api/stream/create-stream-uc.ts` | `CreateStreamUc` (getModuleSnapshot → snapshot) | 2 |
| `packages/stream/src/api/student/enroll-student-uc.ts` | `EnrollStudentUc` (canEnrollNextModule) | 4 |

### 11.4. Ключевые файлы (infra)

| Файл | Содержит |
|------|----------|
| `packages/course/src/infra/db/course-json-repo.ts` | `CourseJsonRepo` |
| `packages/course/src/infra/db/module-json-repo.ts` | `ModuleJsonRepo` |
| `packages/course/src/infra/db/lesson-json-repo.ts` | `LessonJsonRepo` |
| `packages/course/src/infra/db/step-json-repo.ts` | `StepJsonRepo` |
| `packages/stream/src/infra/db/stream-json-repo.ts` | `StreamJsonRepo` |
| `packages/stream/src/infra/db/student-json-repo.ts` | `StudentJsonRepo` |

### 11.5. Данные (JSON)

| Файл | Записи |
|------|--------|
| `data/courses/courses.json` | 1 курс: «Fullstack JS» |
| `data/courses/modules.json` | ~2 модуля |
| `data/courses/lessons.json` | ~30 уроков |
| `data/courses/steps.json` | ~100 шагов |

### 11.6. Текущий формат данных (v5, для справки)

**Course:** `{ uuid, title, description, authorId, phases: [{ title, track?, moduleIds[] }], status, createdAt, updatedAt? }`

**Module:** `{ uuid, title, description, authorId, targetAudience?, goal?, result?, rules?, additional?, tags?, status, projects: [{ uuid, title, goal?, result?, additional?, status, lessonIds[] }], createdAt, updatedAt? }`

**Lesson:** `{ uuid, moduleId, title, additional?, status, createdAt, updatedAt?, estimatedMinutes?, stepIds[], mentorStepIds[] }`

**Step:** `{ uuid, moduleId, description, content?, status, createdAt, updatedAt?, kind: 'text'|'code'|'file', code?, language?, file? }`

**Stream:** `{ ..., contentSnapshot: [{ projectId, projectTitle, lessons: [{ lessonId, lessonTitle, stepIds[] }] }] }`

### 11.7. Скиллы (PI skills) для реализации

При реализации треков используй скиллы:
- `arch-boundary-design` — **первым**, перед созданием ЛЮБЫХ методов/классов (определяет ГДЕ)
- `ddd-domain` — для domain-слоя (Entity, Aggregate, Repo, Policy)
- `ddd-api` — для API-слоя (UseCase, Command, Module)
- `ddd-infra` — для Infra-слоя (реализация репозиториев)
- `ddd-naming` — для именования файлов/папок/классов
- `conductor-docs` — при создании/перемещении файлов в conductor/
- `troubleshoot` — при неожиданных ошибках
- `post-task-debrief` — после завершения задачи

---

## 12. Открытые вопросы

1. **Базовый класс `ContentAr`?** Общая логика: status, basedOn, archive(), publish(), canRead(), isPublished() — ~6 методов. Стоит ли базовый класс или оставить агрегаты отдельными? Решить в Треке 1.

2. **Code для будущих URL?** Откладывается. Добавить поле позже (additive). Не связано со связями. Обсудить когда подойдёт web.

3. **Course fork?** Course — корневой уровень. `fork-course` = `create-course` с `basedOn`. Замены нет (нет родителя). Пока отложено — course fork не требует нового API (create + basedOn).

4. **Производительность basedOn-chain gating?** Цепочка короткая (2–3). Загрузка по UUID дёшево. Кэшировать при необходимости. Обсудить в Треке 4.

5. **Менторские файлы в Import/Export?** Папка `mentor/` внутри урока. Отложено до будущего трека (в техдолге TODO.md).

6. **Изображения и бинарные ресурсы?** Сейчас не используются. При появлении — расширить формат папки (zip-контейнер).
