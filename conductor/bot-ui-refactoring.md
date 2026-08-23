# Рефакторинг Bot UI: перенос в `apps/u7-bot`

> v2 (2026-08-07). Объединяющий документ для серии треков.
> **Этот документ содержит ПОЛНЫЙ контекст для генерации треков в другой сессии.**
> Для генерации трека: прочитай этот документ → загрузи skill `conductor-newtrack` → создай трек.
> После утверждения — разлагается на треки в `conductor/tracks/`.
>
> **Принцип рефакторинга:** трек может ломать нижележащий функционал, если тот восстанавливается в следующем треке. Промежуточные сломанные состояния допустимы.
>
> **Связанные conductor-документы:**
> - [`conductor/development-roadmap.md`](./development-roadmap.md) — **дорожная карта:** порядок релизов, миграции, зависимости между инициативами
> - `conductor/workflow.md` — процесс работы conductor
> - `conductor/code_styleguides/architecture.md` — архитектурные правила (слои, импорты)
> - `conductor/code_styleguides/domain-boundaries.md` — где размещать логику
> - `conductor/index.md` — индекс всех документов

---

## 1. Проблема и цель

### Проблемы

1. **UI размазан по доменным пакетам.** `packages/stream/src/ui/bot/`, `packages/course/src/ui/bot/`, `packages/onboarding/src/ui/bot/` содержат контроллеры и стори. UI — это композиция поверх ВСЕХ доменов, он не принадлежит ни одному из них.

2. **Циклическая зависимость `app` ↔ `onboarding`.** `app/domain/u7-bot-app-meta.ts` импортирует `OnboardingApiModuleMeta` из `@u7-scl/onboarding`. `onboarding/ui/bot/controller` импортирует `U7BotAppMeta`, `U7BotController` из `@u7-scl/app`. Это вынуждает `app` зависеть от всех доменных модулей.

3. **Контроллеры разделены по модулям, а не по функциям.** `StreamController` содержит 10 стори, покрывающих разные пользовательские сценарии (каталог, обучение, менторство). `CourseController` — 1 стори. Граница «доменный модуль» не совпадает с границей «пользовательская функция».

4. **Жёсткие кросс-ссылки между стори.** `CatalogStory` вручную прописывает `this.cbFor('view-stream', 'view', id)`. `ViewStreamStory` — `this.cbFor('monitor', 'students', id)`. Изменение сигнатуры колбэка в стори-владельце требует правки всех потребителей.

5. **Разные архитектуры в разных модулях.** `OnboardingController` вшивает всю логику в контроллер (без стори). Остальные используют Controller→Story паттерн.

### Цель

- **Все bot-ui в одном пакете** `apps/u7-bot` — единая точка сборки UI бота.
- **Контроллеры = кнопки главного меню** — деление по пользовательским функциям, а не по доменным модулям.
- **`publicActions` на стори + `UiApp.getAction<T>(name)`** — стори объявляет публичные действия, потребители получают типизированную фабрику кнопки через `this.uiApp.getAction<T>(name)`.
- **Разрыв циклических зависимостей** — `app` зависит только от `core`, доменные модули — от `core` + `app`.
- **Единая архитектура** — все контроллеры тонкие (реестр стори), вся логика в стори.

---

## 2. Целевая структура

```
apps/u7-bot/src/
├── shared/
│   └── tree-renderer.ts           # общий рендеринг дерева проект→урок→шаг в MarkdownV2
│
├── controllers/                   # доменные контроллеры (по функциям)
│   ├── app/                       # системные сценарии (без кнопки в меню)
│   │   ├── controller.ts
│   │   ├── ui-spec.md
│   │   └── stories/
│   │       └── community.ts
│   │
│   ├── courses/                   # «📖 Программы курсов»
│   │   ├── controller.ts
│   │   ├── ui-spec.md
│   │   └── stories/
│   │       └── course-catalog.ts  # S00: 5-уровневый drill-down (live published data)
│   │
│   ├── streams/                   # «📚 Потоки курсов»
│   │   ├── controller.ts
│   │   ├── ui-spec.md
│   │   └── stories/
│   │       ├── stream-catalog.ts  # S01: витрина потоков с фильтрами
│   │       └── view-stream.ts     # S02-S04: карточка, программа (из contentSnapshot), детали
│   │
│   ├── learning/                  # «🎓 Моя учёба» (видна только STUDENT)
│   │   ├── controller.ts
│   │   ├── ui-spec.md
│   │   └── stories/
│   │       ├── hub.ts             # S05: хаб
│   │       ├── step-view.ts       # S05a: просмотр/прохождение шага
│   │       ├── nav-tree.ts        # S05b: дерево уроков с ✅/▶️/🔒 (из contentSnapshot + student)
│   │       ├── transition.ts      # S05c: завершение урока/проекта/потока
│   │       ├── progress.ts        # S06: прогресс студента
│   │       └── enroll.ts          # S10: запись с кодовым словом
│   │
│   ├── mentor/                    # «🛠️ Инструменты ментора» (MENTOR, ADMIN)
│   │   ├── controller.ts
│   │   ├── ui-spec.md
│   │   └── stories/
│   │       ├── submenu.ts         # подменю
│   │       ├── my-streams.ts      # список потоков ментора
│   │       ├── view-stream-mentor.ts  # S02m: карточка с lifecycle-кнопками (наследует view-stream)
│   │       ├── create-stream.ts   # S09: wizard создания потока
│   │       ├── activate-stream.ts # запуск потока
│   │       └── monitor.ts         # S07/S08: мониторинг группы
│   │
│   └── onboarding/                # «📝 Заполнить анкету» (отложено до metrics)
│       ├── controller.ts
│       └── ...
│
├── core/                          # инфраструктура бота (базовые классы, мета-типы)
│   ├── u7-bot-app-meta.ts         # U7BotAppMeta (union всех *ApiModuleMeta)
│   ├── u7-bot-controller.ts       # U7BotController extends BotController<U7BotAppMeta, User>
│   ├── u7-bot-user-story.ts       # U7BotUserStory extends BotUserStory<U7BotAppMeta, User>
│   ├── ui-app.ts                  # U7BotUiApp extends UiApp<U7BotAppMeta, User>
│   └── ui-utils.ts                # executeResponses и хелперы
│
├── handlers/                      # Grammy-адаптеры
│   ├── connect-ui-app.ts          # connectUiApp: Grammy-события → UiApp
│   └── group-handler.ts           # обработчики групповых событий
│
├── infra/                         # реализации портов
│   ├── telegram-tg-facade.ts
│   └── logger/
│       ├── composite-logger.ts
│       ├── telegram-logger.ts
│       └── index.ts
│
├── bot.ts                         # Grammy-бот (без изменений)
├── create-api-app.ts              # createApiApp() — фабрика ApiApp
├── create-ui-app.ts               # createUiApp() — фабрика U7BotUiApp + контроллеры
├── main.ts
├── config.ts
└── context.ts

tests/ → apps/u7-bot/tests/        # интеграционные и e2e тесты
```

### Принципы именования

- **Контроллер:** `u7-bot/src/controllers/<controller-name>/controller.ts` (не `app-controller.ts`)
- **Стори:** `u7-bot/src/controllers/<controller-name>/stories/<story-name>.ts` (не `*.story.ts`)
- **UI-спецификация:** `u7-bot/src/controllers/<controller-name>/ui-spec.md` (на каждый контроллер)
- **Общая логика рендеринга:** `u7-bot/src/shared/`
- **Базовые классы и мета-типы:** `u7-bot/src/core/`
- **Реализации портов:** `u7-bot/src/infra/`
- **Адаптеры:** `u7-bot/src/handlers/connect-ui-app.ts` (не `router.ts`)
- **Фабрики:** `create-api-app.ts`, `create-ui-app.ts` (разделены)

---

## 3. Контроллеры и их зоны ответственности

| Контроллер | Кнопка в меню | Кому видна | Домены данных |
|-----------|---------------|-----------|---------------|
| `courses` | `📖 Программы курсов` | всем | course (live published) |
| `streams` | `📚 Потоки курсов` | всем | stream (snapshot) + course (резолв заголовков) |

> 🔑 **Правило видимости кнопки «📝 Записаться»** (в `view-stream`): видна всем, у кого **нет** роли `STUDENT` (гость, кандидат, ментор, автор, админ). Если пользователь уже студент — кнопка не показывается, т.к. пока можно проходить только один курс. Реализуется через `StreamPolicy.canEnroll(actor)` → `!UserPolicy.isStudent(actor)`.
| `learning` | `🎓 Моя учёба` | STUDENT | stream (snapshot + student progress) + course |
| `mentor` | `🛠️ Инструменты ментора` | MENTOR, ADMIN | stream (snapshot + management) + course |
| `app` | (нет своей кнопки) | фон | системные: main-menu, help, community |
| `onboarding` | `📝 Заполнить анкету` | всем (отключена до metrics) | onboarding |

### Различие экранов «Программа курса»

| Экран | Контроллер | Источник дерева | Статусы шагов | Контент шагов |
|-------|-----------|----------------|---------------|---------------|
| S00 — каталог курсов | `courses` | Опубликованные курсы (live) | Нет | Нет (только заголовки, макс. 3) |
| S03 — программа потока | `streams` | `contentSnapshot` (frozen UUID) | Нет | Нет (только заголовки, макс. 3) |
| S05b — мои уроки | `learning` | `contentSnapshot` + `student.steps` | ✅/▶️/🔒 | Только для пройденных ✅ шагов |

**Общая часть:** рендеринг дерева проект→урок→шаг в MarkdownV2 вынесен в `shared/tree-renderer.ts`. Каждая стори формирует `TreeNode[]` из своего источника и передаёт в общий рендерер.

---

## 4. Принятые архитектурные решения

### 4.1. `app` — только общие типы

После рефакторинга `app` содержит только `User`, `Role`, `UserSchema`, `RoleSchema` (в `app/domain/user.ts`). Зависит только от `core`. Доменные модули импортируют `User`/`Role` из `@u7-scl/app/domain`.

**Удаляется из `app`:**
- `domain/u7-bot-app-meta.ts` → `apps/u7-bot/src/u7-bot-app-meta.ts`
- `ui/` целиком → `apps/u7-bot/src/`

### 4.2. `U7BotAppMeta` переезжает в `u7-bot`

Это union всех `*ApiModuleMeta` из доменных модулей. Перенос разрывает циклическую зависимость: `app` больше не импортирует доменные модули.

### 4.3. `publicActions` на стори + `UiApp.getAction<T>(name)`

Каждая стори объявляет `publicActions` — объект с методами-фабриками колбэков (`UiBotButton`). `UiApp` при `init()` собирает все `publicActions` со всех стори всех контроллеров в плоскую глобальную мапу, проверяет уникальность имён. Другие стори получают типизированную фабрику через `this.uiApp.getAction<T>(name)`.

**Пример:**

```typescript
// stories/monitor.ts
type MonitorActions = {
  students: (streamId: string) => UiBotButton;
  detail: (studentId: string) => UiBotButton;
};

class MonitorStory extends BotUserStory<U7BotAppMeta, User, MonitorActions> {
  publicActions: MonitorActions = {
    students: (streamId) => this.action('👥 Студенты', 'students', streamId),
    detail: (studentId) => this.action('👤 Детали', 'detail', studentId),
  };
}

// Использование в другой стори:
import type { MonitorActions } from '../../mentor/stories/monitor';
const btn = this.uiApp.getAction<MonitorActions>('students')(streamId);
// btn: UiBotButton { text: '👥 Студенты', code: 'mentor:monitor:students:{streamId}' }
```

Хелпер `this.action()` уже существует в `BotUserStory`:
```typescript
protected action(text: string, actionName: string, ...ids: string[]): UiBotButton {
  return { text, code: this.cb(actionName, ...ids) };
}
```

Для обратной совместимости оставлен геттер `this.ui` (возвращает `any`), но новые стори должны использовать `this.uiApp.getAction<T>(name)`.

### 4.4. `UiApp` в core — центральный хаб

`UiApp<TAppMeta, TActor>` в `packages/core/src/ui/bot/ui-app.ts` реализует `MenuAggregator` и содержит:

- **Маршрутизацию:** `handleWelcome`, `handleCallback`, `handleMessage`, `handleCancel`, `handleTimeout`
- **Сбор меню:** `collectMainMenu`, `collectHelp`, `collectAllMenuItems`, `collectAllHelpDescriptions`
- **Реестр publicActions:** `#registerPublicActions()` — плоская мапа с проверкой уникальности
- **Типизированный доступ:** `getAction<T>(name)` — дженерик задаёт контракт стори

`U7BotUiApp` в `apps/u7-bot/src/ui-app.ts` наследует `UiApp<U7BotAppMeta, User>`, закрывая дженерики.

### 4.5. `connectUiApp` — Grammy-адаптер

`apps/u7-bot/src/handlers/connect-ui-app.ts` — функция `connectUiApp(bot, uiApp, userFacade, botAdminUuid, logger?)`. Чистый адаптер: Grammy-события → `uiApp.handle*()` → `executeResponses(ctx, response)`. Не содержит пользовательских текстов и клавиатур.

### 4.6. Баг с пропадающими кнопками ментора

В коде есть жёсткая строка в `ActivateStreamStory`:
```typescript
code: `view-stream:view:${streamId}`  // всегда в публичный view-stream!
```
После активации ментор жмёт «Назад к потоку» и попадает в `view-stream` (curious-режим, без lifecycle-кнопок). Исправляется через `this.uiApp.getAction<ViewStreamMentorActions>('view')(streamId)`.

### 4.7. Onboarding — заглушка

`OnboardingController` переносится как есть (без рефакторинга на стори). Кнопка `📝 Заполнить анкету` отключается (не возвращается из `handleStart`). Рефакторинг на стори — в рамках трека metrics.

### 4.8. Разделение `learning.story.ts`

Текущий файл (~670 строк) содержит: хаб, шаг, дерево (3 уровня), transition (3 типа), выход. Разделяется на 6 файлов по ~80-200 строк каждый: `hub.ts`, `step-view.ts`, `nav-tree.ts`, `transition.ts`, `progress.ts`, `enroll.ts`.

### 4.9. Документация обновляется

7 файлов требуют изменений:
- `conductor/code_styleguides/architecture.md` — убрать `ui/` из структуры доменных модулей
- `conductor/code_styleguides/skills/bot-controller.md` — новая иерархия, `UiApp`, `publicActions`
- `conductor/code_styleguides/skills/bot-user-story.md` — новые пути, `uiApp.getAction<T>()`
- `conductor/index.md` — обновить ссылки
- `packages/core/src/ui/bot/README.md` — правила навигации
- `packages/stream/src/ui/bot/ui-spec.md` → разделить на 4 файла в `apps/u7-bot/src/{courses,streams,learning,mentor}/ui-spec.md`
- `apps/u7-bot/README.md` — создать

---

## 5. Зависимости пакетов после рефакторинга

```
apps/u7-bot → core, app, user, course, stream, onboarding
app         → core
user        → core, app
course      → core, app, user
stream      → core, app, user, course
onboarding  → core, app, user
```

Ни одной циклической зависимости.

---

## 6. Декомпозиция на треки

**Принцип:** треки последовательны. Каждый следующий может полагаться на результаты предыдущего.

---

### Трек 0: «`UiApp` в core + удаление `BotRouter` + доработка `publicActions`»

**Цель:** заменить `BotRouter` на `UiApp` в core, добавить механизм `publicActions` + `getAction<T>(name)`, обновить `BotController.init()` и `BotUserStory`, подготовить инфраструктуру для следующих треков.

**Выполнен.** Статус: `[x]` в реестре треков.

**Действия (выполненные):**
- Создан `UiApp<TAppMeta, TActor>` в `packages/core/src/ui/bot/ui-app.ts`
- Вся маршрутизация перенесена из `BotRouter` в `UiApp`
- `BotRouter` удалён
- `BotController.init(appApi, uiApp)` — второй аргумент
- `BotUserStory.uiApp` + `publicActions`
- `connectRouter` → `connectUiApp` в `apps/u7-bot/src/handlers/connect-ui-app.ts`
- `U7BotUiApp extends UiApp<U7BotAppMeta, User>`
- `api-app.ts` разделён на `create-api-app.ts` + `create-ui-app.ts`
- `ui-actions.ts` удалён

---

### Трек 1: «Перенос базовых классов и `U7BotAppMeta` в `u7-bot`» ✅

**Цель:** создать фундамент в `apps/u7-bot` и разорвать циклическую зависимость `app ↔ onboarding`.

**Выполнен.**

**Действия:**
- Создать целевую структуру папок в `apps/u7-bot`
- Перенести `U7BotAppMeta` из `app/domain/` в `u7-bot/src/u7-bot-app-meta.ts`
- Перенести `U7BotController`, `U7BotUserStory` из `app/ui/` в `u7-bot/src/`
- Обновить `app/package.json` — убрать зависимости от `stream`, `course`, `onboarding`
- Обновить импорты во всех файлах, которые ссылались на старые пути

**Зависимости:** Трек 0.

---

### Трек 2: «Перенос `AppController` + `CommunityStory`» ✅

**Цель:** первый контроллер в новом пакете. Системные сценарии (не привязаны к домену).

**Выполнен.**

**Действия:**
- Создать `apps/u7-bot/src/app/controller.ts` и `stories/community.ts`
- Заменить `'app:main-menu'` на вызовы `this.uiApp.getAction<AppActions>('mainMenu')()`
- Перенести тесты

**Зависимости:** Трек 1.

---

### Трек 3: «Контроллер `courses` — "Программы курсов"» ✅

**Цель:** перенос `CourseCatalogStory` из `course/ui/bot/` в новый контроллер.

**Выполнен.** Архив: `conductor/archive/bot_ui_courses_20260807/`.

**Действия:**
- Создать `courses/controller.ts`, `courses/ui-spec.md`
- Перенести `course-catalog.ts` (S00: курсы → этапы → модули → проекты → уроки → заголовки шагов)
- Выделить общий рендеринг в `shared/tree-renderer.ts`
- Все кросс-ссылки перевести на `this.uiApp.getAction<T>(name)`
- Перенести тесты

**Зависимости:** Трек 2.

---

### Трек 4: «Контроллер `streams` — "Потоки курсов"» ✅

**Цель:** перенос `CatalogStory` + `ViewStreamStory` из `stream/ui/bot/` в новый контроллер.

**Выполнен.** Архив: `conductor/archive/bot_ui_streams_20260807/`.

**Результаты:**
- `StreamsController` (name='stream', 2 стори: catalog + view-stream)
- `tree-renderer.ts` переиспользован для S03 без модификаций
- Кросс-ссылки `getAction<T>(name)`: `CommunityActions.mainMenu` работает, `MonitorActions`/`EnrollActions` — TODO в Треках 5-6
- Старые файлы `packages/stream/src/ui/bot/controller/` удалены
- Немигрированные стори (8 шт.) оставлены в `packages/stream/src/ui/bot/stories/` для будущих треков
- `tests/bot/` полностью удалён — тесты перенесены в `apps/u7-bot/`: unit рядом с исходниками, integration/e2e в `apps/u7-bot/tests/`
- 202 теста (unit + integration + e2e), biome + tsc чисто

**Действия:**
- Создать `streams/controller.ts`, `streams/ui-spec.md`
- Перенести `stream-catalog.ts` (S01: витрина потоков с фильтрами)
- Перенести `view-stream.ts` (S02-S04: карточка, программа из contentSnapshot, детали)
- Все кросс-ссылки (`monitor`, `enroll`, `app`) перевести на `this.uiApp.getAction<T>(name)`
- Перенести тесты

**Зависимости:** Трек 3 (нужен `tree-renderer`).

---

### Трек 5: «Контроллер `learning` — "Моя учёба"»

**Цель:** разделить `learning.story.ts` (670 строк) на 6 файлов и перенести в новый контроллер.

**Действия:**
- Создать `learning/controller.ts`, `learning/ui-spec.md`
- Разделить на: `hub.ts`, `step-view.ts`, `nav-tree.ts`, `transition.ts`, `progress.ts`, `enroll.ts`
- Вынести общие хелперы в `learning/shared.ts` (или оставить protected в базовом классе)
- `nav-tree.ts` использует `shared/tree-renderer.ts` с добавлением статусов ✅/▶️/🔒
- Все `cbFor()` → `this.uiApp.getAction<T>(name)`
- Исправить `StreamPolicy.canEnroll` в `packages/stream/src/domain/stream/policy.ts`: разрешить всем, кроме STUDENT (сейчас только guest/candidate — ментор/автор/админ не могут записаться)
- Перенести тесты

**Зависимости:** Трек 4 (нужен `view-stream` для кросс-ссылок на программу потока).

---

### Трек 6: «Контроллер `mentor` — "Инструменты ментора"»

**Цель:** перенести 6 стори из `stream/ui/bot/` в новый контроллер.

**Действия:**
- Создать `mentor/controller.ts`, `mentor/ui-spec.md`
- Перенести: `submenu.ts` (подменю), `my-streams.ts`, `view-stream-mentor.ts`, `create-stream.ts`, `activate-stream.ts`, `monitor.ts`
- Исправить баг с кнопкой «Назад» в `activate-stream.ts` → `this.uiApp.getAction<ViewStreamMentorActions>('view')(streamId)`
- `view-stream-mentor.ts` наследует `view-stream.ts` из `streams` контроллера — проанализировать, можно ли избежать наследования через композицию
- Все `cbFor()` → `this.uiApp.getAction<T>(name)`
- Перенести тесты

**Зависимости:** Трек 4 (нужен `view-stream` как база для `view-stream-mentor`), Трек 5 (нужны `monitor` кросс-ссылки).

---

### Трек 7: «Onboarding — заглушка»

**Цель:** перенести как есть, отключить, освободить `packages/onboarding/src/ui/bot/`.

**Действия:**
- Создать `onboarding/controller.ts`
- Перенести `OnboardingController` без изменений
- Отключить кнопку в `handleStart()` (возвращать пустой массив)
- Перенести тесты

**Зависимости:** Трек 1 (нужен `U7BotController` в новом месте).

---

### Трек 8: «Зачистка и обновление документации»

**Цель:** удалить старый код, обновить все `.md` файлы, проверить целостность.

**Действия:**
- Удалить `packages/stream/src/ui/`, `packages/course/src/ui/`, `packages/onboarding/src/ui/`, `packages/app/src/ui/`
- Удалить `packages/app/src/domain/u7-bot-app-meta.ts`
- Обновить `package.json` exports во всех пакетах
- Обновить 7 файлов документации (см. §4.9)
- Прогнать `tsc --noEmit`, `biome check`, все тесты
- Перенести `tests/bot/` → `apps/u7-bot/tests/`

**Зависимости:** Треки 1-7.

---

## 7. Что НЕ входит

- Рефакторинг onboarding на стори — отложено до metrics
- Изменения в доменных слоях (domain, api) — только UI, **кроме** `StreamPolicy.canEnroll` (исправление правила доступа к записи)
- Изменения в `contentSnapshot` (чистое UUID-дерево) — это `content-management.md`, трек 2
- `apps/u7-cli` — не трогается
- Новые фичи — только перенос существующего функционала
