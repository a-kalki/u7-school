# Todo задачи

> Контекст всех задач — в `conductor/architecture-evolution.md`. Треки — в `conductor/tracks/`.

**UI бота (stream):**
1. `CreateStreamStory` (wizard): шаг 9 запрашивает только ссылку на Telegram-группу и сохраняет в `telegramGroupId`. Нужно запрашивать **два** поля — ID группы (`telegramGroupId`) и ссылку-приглашение (`telegramGroupInvite`) — и записывать их в соответствующие свойства. Сейчас `telegramGroupInvite` никогда не заполняется через wizard.


## Архитектурные
1. **`WizardStory`** — базовый класс с унифицированным движком пошагового ввода (контекст, переходы, обработка ошибок валидации). Сейчас логика wizard дублируется в `CreateStreamStory`. **Отложено** — делать при появлении второго wizard'а (см. `conductor/architecture-evolution.md` §2.7).

2. **Дубликат `User`/`Role` и цикл `app ↔ доменные модули`** (выявлено в треке `author_role_20260708`). **Отложено** — выделить в отдельный трек `app_cycle_break`.

   ### Суть проблемы

   В проекте **две копии** `Role`/`RoleSchema`/`UserSchema`/`User`/`UserArMeta`:
   - **`packages/user/src/domain/user/roles.ts`** + `entity.ts` — каноничный домен user-пакета (`@u7-scl/user/domain`). Используется всеми доменными политиками (`ModulePolicy`, `LessonPolicy`, `StreamPolicy`, ...) и UC.
   - **`packages/app/src/domain/user.ts`** — легаси-дубликат внутри app-пакета (`@u7-scl/app/domain`). Используется app-контроллерами и **всеми** UI-stories/тестами (`tests/bot/*`, `packages/stream/src/ui/bot/stories/*`, `packages/onboarding/...`) через реэкспорт `@u7-scl/app/domain`.

   Дубликат всплыл при добавлении `Role.AUTHOR` только в `packages/user`: TypeScript сравнивает enum'ы структурно, и пока обе копии были идентичны (6 ролей) — типы считались совместимыми. После расхождения (7 vs 6 ролей) возникла `TS2322` в `tests/bot/integration/stream/view-stream.integration.test.ts` (значение с `packages/user.Role[]` не присваивается туда, где ждали `packages/app.Role[]`). Временный фикс: `AUTHOR` добавлен в обе копии.

   ### Корень цикла (не в User!)

   User — лишь `TActor` (type-only), и доменные уже зависят от `@u7-scl/user` (объявлено). Сам цикл создаёт **`appApi.execute(...)` в доменных stories**. Stream-stories вызывают кросс-модульные UC через `this.appApi`:
   - `view-stream.story.ts`: `appApi.execute('get-user', ...)` (модуль user)
   - `create-stream.story.ts`: `appApi.execute('list-modules', ...)`, `('get-module', ...)` (модуль course)
   - `monitor.story.ts`: `appApi.execute('get-user', ...)` ×4
   - `learning.story.ts`: `appApi.execute('get-step', ...)` (модуль course)
   - `progress.story.ts`: `appApi.execute('get-user', ...)`

   Чтобы `appApi.execute('get-user', {uuid})` был **типизирован** (имя UC + input + output), story обязана знать `U7BotAppMeta` — композитный тип `moduleMetas: UserApiModuleMeta | OnboardingApiModuleMeta | StreamApiModuleMeta | CourseApiModuleMeta` (см. `packages/app/src/domain/u7-bot-app-meta.ts`). `U7BotAppMeta` живёт в `packages/app`, поэтому stream-story импортирует `U7BotApp` из app → **stream → app**, при этом app → stream (для `StreamApiModuleMeta` в union). Двунаправленный цикл.

   ### Текущая карта зависимостей
   ```
   app → {user, course, stream, onboarding}        (package.json deps)
   onboarding → {app, user}                         (объявлено → onboarding↔app двусторонний)
   stream → {user, course}                          (объявлено)
   stream → app/domain  ⚠ НЕ объявлено, но импортирует User, U7BotApp (import type)
   ```
   Цикл «работает» только потому, что `import type` стирается tsc, а Bun резолвит пакеты через workspace hoisting.

   ### Ключевые типы (контекст для реализации)
   - `ApiExecutor<TMeta>` (`packages/core/src/domain/types.ts`): `execute<N extends GetUcNamesFromMeta<TMeta>>(ucName, attrs, actorId)`. `TMeta` = `AppMeta` (уровень app) или `ApiModuleMeta` (уровень модуля).
   - `BotUserStory<TAppMeta, TModuleMeta, TActor>` (`packages/core/src/ui/bot/bot-user-story.ts`): имеет `moduleApi: ApiExecutor<TModuleMeta>` (свой модуль) и `appApi: ApiApp<TAppMeta>` (всё приложение).
   - `U7BotUserStory<TMeta>` (`packages/app/src/ui/u7-bot-user-story.ts`): `extends BotUserStory<U7BotAppMeta, TMeta, User>` — фиксирует `U7BotAppMeta` и `User`, оставляет открытым `TMeta`. Именно этот класс тянет `U7BotAppMeta` в доменные stories.
   - `U7BotAppMeta` (`packages/app/src/domain/u7-bot-app-meta.ts`): композиция всех `*ApiModuleMeta`.

   ### Почему «обобщёнить TAppMeta» не работает
   Если сделать stories обобщёнными `BotUserStory<TAppMeta extends AppMeta, ...>` и фиксировать `U7BotAppMeta` только при композиции в app — типизация `appApi.execute` **сломается**: `GetUcNamesFromMeta<TAppMeta>` при обобщённом `TAppMeta extends AppMeta` даст `string` (базовый `ApiModuleMeta.ucMetas.ucName: string`), конкретные имена UC (`'get-user'`, `'list-modules'`) и типы input/output исчезнут. Типизация cross-module-вызовов требует фиксации `U7BotAppMeta` прямо в story → неизбежный импорт → цикл.

   ### Вариант A — DDD-фасады (чистый, рекомендуется)
   Убрать `appApi` из story-слоя. Кросс-модульные вызовы — через типизированные **фасады**, объявленные в нижних пакетах:
   - `UserFacade` — **уже есть** в `@u7-scl/user/domain` (course/stream уже зависят).
   - `CourseReadFacade` — **добавить** в `@u7-scl/course/domain`: `listModules()`, `getModule(uuid)`, `getStep(uuid)`.
   - Story получает фасады через `init()` (как сейчас `moduleApi`) и зовёт напрямую: `this.userFacade.getUserByUuid(id)`, `this.courseFacade.listModules()`.
   - `BotUserStory` упрощается до `<TModuleMeta, TActor>` — `TAppMeta` и `U7BotAppMeta` больше не нужны в stories.
   - `U7BotAppMeta` остаётся в `packages/app`, но используется **только в точке композиции** (`apps/u7-bot/src/api-app.ts` — регистрация модулей), не в stories.
   - **Плюсы:** цикл разорван полностью; типизация сохранена; стандартный DDD-паттерн (порт в домене, реализация в infra/app); убирает «знание о всём приложении» из story-слоя.
   - **Минусы:** большой рефакторинг (переписать все `appApi.execute`-вызовы в stream/onboarding-stories; добавить `CourseReadFacade` + реализацию; упростить `BotUserStory`/`U7BotUserStory`; поправить контроллеры, инициализирующие stories фасадами).

   ### Вариант B — принять type-only двунаправленность (компромисс)
   Оставить композитный `appApi`, но сделать цикл честным и безопасным:
   - Объявить `@u7-scl/app` в `dependencies` stream (сейчас не объявлено — скрытый долг).
   - Зафиксировать правило: app ↔ доменные **только `import type`** (никаких value imports через границу — `Role`/`UserSchema` тащить только из `@u7-scl/user/domain`, не из app).
   - `packages/app/domain/user.ts` → **реэкспорт** из `@u7-scl/user/domain` (устраняет дубликат `User`/`Role`):
     ```ts
     export { Role, RoleSchema, UserSchema } from '@u7-scl/user/domain';
     export type { User, UserArMeta } from '@u7-scl/user/domain';
     ```
   - **Плюсы:** минимальные изменения; сохраняется типизированный `appApi.execute`; реэкспорт убирает дубликат `User` (и регрессию при добавлении новых ролей).
   - **Минусы:** цикл остаётся; любое случайное value-импортирование через границу ломает схему; при npm-публикации пакетов type-only-цикл работает (типов нет в runtime), но требует наличия деклараций всех пакетов в deps.

   ### Смирение с двунаправленностью (текущее состояние)
   Применён **только временный фикс**: `AUTHOR` добавлен в обе копии `Role` (и в `packages/user`, и в `packages/app/src/domain/user.ts`), чтобы устранить `TS2322`. Дубликат **не устранён** — обе копии `User`/`Role` продолжают существовать независимо. Цикл `app ↔ stream/onboarding` через `U7BotAppMeta`/`appApi` **оставлен как есть** (type-only) — он переживается Bun/tsc в монорепо. Это сознательное «смирение»: разрыв через фасады (Вариант A) и устранение дубликата через реэкспорт (Вариант B) отложены в отдельный трек `app_cycle_break`, чтобы не раздувать скоуп текущих релизов.

   ### Минимальный следующий шаг (при взятии в работу)
   Заменить тело `packages/app/src/domain/user.ts` на реэкспорт из `@u7-scl/user/domain` (см. код в Варианте B). Это устранит дубликат `User`/`Role` разом: при добавлении новых ролей править только `packages/user/src/domain/user/roles.ts`. Канон — `packages/user` (самый нижний пакет, от него зависят все); `packages/app/domain/user.ts` — фасад-реэкспорт для UI-слоя (чтобы stories/tests импортировали из единой точки `@u7-scl/app/domain`).

## Релиз 1 — Фундамент

### Трек A: Роль AUTHOR (автор программы) — `author_role_20260708`
- Новая `Role.AUTHOR` — создаёт программу (модули/курсы/уроки/шаги).
- `MENTOR` — преподаёт (потоки). Принцип: создание — роли, редактирование — ADMIN или author. ADMIN не создаёт.
- `ModulePolicy.canCreate` → AUTHOR; `CoursePolicy.canCreate` → AUTHOR.
- Миграция: авторы существующих модулей получают AUTHOR.

### Трек 0: Курс (последовательность модулей) — `course_aggregate_20260708`
- Новый агрегат `Course` (ordered `phases` с `track: tech|business`, `moduleIds[]`).
- UC: `create-course`, `list-courses`, `get-course`, `add-module-to-course`.
- `Module` → ссылка на курс/этап.
- Программа курса = агрегация snapshot'ов модулей.

### Трек 1: Жизненный цикл студента — `student_lifecycle_20260708`
- Enriched статусы: `enrolled | active | abandoned | completed | wants_next | advanced | not_advanced` (+ `abandonReason`).
- `StudentAr` методы: `activate`, `drop`, `markAbandoned`, `complete`, `markWantsNext`, `advance`, `markNotAdvanced`.
- UC: `complete-student` (ментор), `drop-student` (self), `mark-abandoned` (mentor).
- `CompleteStreamUc`: при завершении потока active/enrolled → `completed`, снять `STUDENT`.
- `User.nick` (опц. поле).
- `TgFacade` (порт в `core`, реализация в `app`) — в resolver доменных модулей.
- Confirm-хелпер в `core/ui` (формализовать convention `action`/`action-confirm`).
- Миграция: `dropped`→`abandoned(voluntary)`, `expelled`→`abandoned(by_mentor)` — на месте.
- Bug: `statusLabels` в `MonitorStory` (`dropped`→`expelled`) — будет заменён на новые статусы.
- Отчисление студента (S08) — ✅ уже реализовано, войдёт в новый статус-модель как `abandoned(by_mentor)`.

### Трек 2: ContentPath — `content_path_20260708`
- VO `ContentPath` (`A:B:C:D`, partial-формы) в домене `course`.
- UC `resolve-content-path` с role-based доступом (curious/student/mentor).
- Рефакторинг `monitor`/`learning` сториз на единый резолвер.

## Релиз 2 — UX ядра продукта

### Трек 3: Gating модулей — `module_gating_20260708`
- `CoursePolicy.canEnrollNextModule` — проверка завершения prerequisite.
- Gate в `enroll-student`.
- UI: после `completed` → предложение записаться на следующий модуль → `advanced`.
- Правило «Синтаксис → Алгоритмика».

### Трек 4: Навигация студента — `student_navigation_20260708`
- Хаб «Моя учёба» (Продолжить / Уроки / Прогресс) вместо прыжка в шаг.
- Дерево-навигация по урокам кнопками через ContentPath (🔒/✅/▶️ маркеры).
- ◀️/▶️ по истории шагов.
- Прогресс урока в шаге, мотивация на переходах.
- Самостоятельный выход из потока (`abandoned`, self).

### Трек 5: Витрина для любопытного — `curious_showcase_20260708`
- Каталог **курсов** (верхний уровень над потоками) + карточка курса + программа курса.
- Программа модуля расширенная (число шагов, типы, сводка объёма).
- Программа/Детали на любом статусе потока.
- Предзапись «Ждать новый набор» на completed-поток.

- «Инструменты ментора» (MENTOR) и «Инструменты автора» (AUTHOR) — role-gated секции (входит в Релиз 2, Трек 5).

## Релиз 3 — Мониторинг

### Трек 6: Мониторинг группы для ментора — `mentor_monitoring_20260708`
- Логика «Отстаёт» (неактивность 5 дней + отставание от медианы 30%+).
- Сводка по группе (медиана, отстающие, завершившие) на S07.
- Сортировка студентов: отстающие сверху.
- История шагов студента (S08 `history:*`) — сейчас заглушка.

## Бэклог (не планируется в ближайших релизах)
- Broadcast при запуске потока + произвольная рассылка ментором (требует `TgFacade`, уже в фундаменте).
- Сбор обратной связи (мини-опрос после урока/проекта).
- Типы шагов (тест/квиз, практическое задание с ревью).
- Заморозка студента (академический отпуск).
- Синхронизация контента (обновление `contentSnapshot` при изменении модуля).
- Снятие `CANDIDATE` при `+STUDENT` (сейчас: только добавление `STUDENT`).
- Отзывы выпускников на карточке completed-потока.

## Доменные
(покрыты треками выше)
