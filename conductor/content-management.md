# Управление учебным контентом: фронт работ

> v6 (2026-07-18). Объединяющий документ для серии треков.
> После утверждения — разлагается на треки в `conductor/tracks/`.
> **Принцип рефакторинга:** трек может ломать нижележащий функционал, если тот восстанавливается в следующем треке. Промежуточные сломанные состояния допустимы.
>
> **Главные изменения от v5:** убран `code` (UUID везде + `basedOn`-цепочка для gating); snapshot стал чистым UUID-деревом (без title'ов); форк на всех уровнях (step→module); `getVisibleFor` заменён на `canRead` + `isPublished`.

---

## 1. Проблема и цель

Автор работает с `data/courses/*.json` напрямую. Есть только UC **создания**. Нет update/archive/fork. Реструктуризация модуля ломает прод-потоки. Нет безопасного способа создать новую версию контента.

**Цель:** API для автора, чтобы безопасно **добавлять и редактировать** объекты контента, не ломая прод-потоки. **Единые правила на всех уровнях** (от курса до шага). При множестве авторов — стабильность, удобство, низкая кривая обучения.

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

---

## 4. Единые правила работы с контентом (от курса до шага)

| Правило | Описание |
|---------|----------|
| **UUID-связи** | Все связи — по UUID. Course→Module→Project→Lesson→Step. Без code. |
| **status** | `draft` (скрыт) → `published` (в программе) → `archived` (по UUID). На всех уровнях. |
| **basedOn** | `uuid \| null`. Provenance + gating chain. На всех уровнях. |
| **Edit (тот же UUID)** | Контентный: виден всем (live). Структурный: невидим активным (frozen snapshot). |
| **Fork (новый UUID)** | Draft-копия (basedOn=старый). Старый не трогается. На всех уровнях. |
| **Publish-replace** | Архивирует старый (каскад) + обновляет родителя + публикует новый. Атомарно. |
| **Publish (branch)** | Публикует без архивирования. Оба published. Родитель вручную выбирает. |
| **Archive** | Каскад: дети тоже archived. archived ≠ hidden (доступен по UUID). |
| **canRead / isPublished** | Раздельные проверки. canRead: published+archived. isPublished: только published. |

---

## 5. Авторские workflows (детально)

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
- **Автор:** `fork-module(M1)` → M2 (draft, basedOn=M1, deep-copy). Редактирует. `publish-module-replace(M2)`: архивирует M1 (каскад), course.moduleIds (M1→M2), публикует M2.
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

## 6. Принятые следствия

### 6.1. Orphan-объекты накапливаются
После fork/remove старые дети orphan (archived, UUID-доступ). Безвредны. Гигиена: опциональный `list-orphans`.

### 6.2. Edit-vs-fork — на авторе
API предупреждает при контентном edit. Автор решает. Образование — в воркфлоу (Трек 4).

### 6.3. `update-stream-snapshot.ts` — ограничить
Скрипт переписывает frozen-снапшот активного потока. Ограничить: только enrollment-статус (без прогресса). Или удалить (новый поток = новый снапшот).

### 6.4. Stream читает title'ы live
Без title'ов в снапшоте, stream загружает projectTitle/lessonTitle по UUID при отображении. Это batch-загрузки (дёшево). Step content уже читается так. Единообразно.

---

## 7. Текущее состояние → целевое

### 7.1. Структура данных

| Сущность | Сейчас | Целевое |
|----------|--------|---------|
| Course | нет basedOn | + `basedOn: uuid\|null` |
| Course.phase | `moduleIds: uuid[]` | без изменений (UUID) |
| Module | нет basedOn | + `basedOn: uuid\|null` |
| Module.projects | `Project[]` (VO) | + `Project.basedOn: uuid\|null` |
| Lesson | нет basedOn | + `basedOn: uuid\|null` |
| Step | нет basedOn | + `basedOn: uuid\|null` |
| Stream.contentSnapshot | тип в course, с title'ами | тип в stream, **чистое UUID-дерево** (без title'ов) |
| Stream.moduleId | UUID | UUID (без изменений) |

### 7.2. API

| Операция | Сейчас | Целевое |
|----------|--------|---------|
| Create | ✅ | ✅ |
| Read | ✅ | ✅ (canRead / isPublished) |
| Update (content/metadata) | ❌ | ✅ update-* (live, по UUID) |
| Update (structural: reorder/add/remove) | частично (add) | ✅ reorder-*, remove-* |
| Archive (cascade) | ❌ | ✅ archive-* (≠ hidden) |
| Fork (all levels) | ❌ | ✅ fork-step/lesson/project/module |
| Publish-replace (all levels) | ❌ | ✅ publish-*-replace (archive old + update parent) |
| Publish (branch) | ❌ | ✅ publish-* (без archive) |
| Resolve hierarchy | buildSnapshot (course, с title'ами) | resolveModuleContent (course, чистое UUID-дерево) |
| Course readiness | ❌ | ✅ isProgramReady(courseId) |
| Gating | canEnrollNextModule (UUID) | canEnrollNextModule + basedOn-chain |

---

## 8. Декомпозиция на треки

**Принцип:** API (domain + UC) → CLI → воркфлоу. Треки последовательны.

---

### Трек 1: «basedOn + visibility + CRUD»

**Цель:** `basedOn` на всех сущностях. Visibility refactor (canRead/isPublished, archived доступен). CRUD: update, archive (каскад), structural ops.

**Domain:**
- Все entity-схемы: + `basedOn: v.optional(v.pipe(v.string(), v.uuid()))`.
- `ProjectSchema` (VO): + `basedOn`.
- Базовый класс `ContentAr<T>` (опционально, §3.11): status, basedOn, archive(), publish(), canRead(), isPublished().
- `StepAr.update({...})`, `LessonAr.update({...})`, `ModuleAr.update({...})`, `CourseAr.update({...})`.
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

### Трек 3: «Форк на всех уровнях + publish-replace + gating»

**Цель:** Безопасное создание новой версии на любом уровне. Deep-copy. Provenance. Gating через basedOn.

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

**Зависимости:** Трек 1, 2.

---

### Трек 4: «CLI-инструменты + воркфлоу»

**Цель:** Автор работает через CLI (UC), не через прямой edit JSON.

**CLI/скрипты:**
- `call-uc.ts` — покрывает все UC (update/archive/fork/reorder/remove/publish).
- `list-orphans` — висячие объекты (гигиена).
- `content-import.ts` — импорт из `data/fullstack-js/*.md` через UC.
- Опциональный `content-validate.ts` — гигиена (dangling, orphan). НЕ защита инвариантов.

**Воркфлоу (AGENTS.md / guide):**
- Запрет прямого edit `data/courses/*.json`.
- Правила: контентный edit (hotfix) vs структурный edit (новым) vs fork (новая версия).
- Процедуры: реструктуризация урока (edit), смена контента (fork-step + publish-replace), новая версия модуля (fork-module + publish-replace).

**Зависимости:** Треки 1–3.

---

### Трек F (будущий): «Bot/Web UI для автора»

API готово. Реализация — когда встанет потребность.

---

## 9. Карта зависимостей

```
1 (basedOn + visibility + CRUD)
└──→ 2 (contentSnapshot → stream, чистое UUID-дерево)
       └──→ 3 (Форк + publish-replace + gating)
              └──→ 4 (CLI + воркфлоу)
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

### С изменениями
- Все entity-схемы: + `basedOn`.
- `ProjectSchema` (VO): + `basedOn`.
- Базовый `ContentAr` (опционально).
- `getVisibleFor` → `canRead` + `isPublished` + `isArchived` (на всех уровнях).
- `*Ar.update(...)`, `*Ar.archive()`, structural ops (remove, reorder).
- `*Ar.fork()` — фабрики копий.
- `CourseDs.forkChildren(...)` — deep-copy координация.
- `CourseDs.buildSnapshot` → `resolveModuleContent` (чистое UUID-дерево).
- `CourseFacade`: `resolveModuleContent(moduleId)`, `isProgramReady`. Убрать `getModuleSnapshot`.
- `CreateStreamUc`: moduleId → snapshot + readiness check.
- `CoursePolicy.canEnrollNextModule` — basedOn-chain walk.
- Stream-traversal: callbacks для title'ов.
- `content-snapshot.ts` → `stream/domain/` (чистое UUID-дерево). `ModuleContent` — в course.
- Миграция: + basedOn на всех. streams.json — убрать title'ы из snapshot.
- `update-stream-snapshot.ts` — ограничить/вынести.

---

## 11. Открытые вопросы

1. **Базовый класс `ContentAr`?** Общая логика: status, basedOn, archive(), publish(), canRead(), isPublished() — ~6 методов. Стоит ли базовый класс или оставить агрегаты отдельными? Решить в Треке 1.

2. **Code для будущих URL?** Откладывается. Добавить поле позже (additive). Не связано со связями. Обсудить когда подойдёт web.

3. **Course fork?** Course — корневой уровень. `fork-course` = `create-course` с `basedOn`. Замены нет (нет родителя). Включать ли в Трек 3 или отложить? Пока отложено — course fork не требует нового API (create + basedOn).

4. **Производительность basedOn-chain gating?** Цепочка короткая (2–3). Загрузка по UUID дёшево. Кэшировать при необходимости. Обсудить в Треке 3.
