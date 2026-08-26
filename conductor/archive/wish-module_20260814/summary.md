# Итоговый отчёт — Трек C1: wish модуль (ядро)

## Цель трека

Создать модуль **`@u7-scl/wish`** («Желание»), который фиксирует желание пользователя пройти курс. Модуль заменяет старый `@u7-scl/onboarding` — весь код анкетирования из onboarding удалён, анкеты теперь ведёт `questionnaire`.

## Выполненные задачи

### Фаза 1: Агрегат Wish + repo
- Реализованы `Wish` entity (схема Valibot), `WishAr` (aggregate: `express`, `cancel`, инвариант «отменить можно только expressed»), `WishRepo` (интерфейс) и `WishJsonRepo` (JSON-файловая реализация).
- Написаны тесты на агрегат и репозиторий (19 тестов в пакете, все проходят).

### Фаза 2: UC express-wish + ER record-wish
- Реализован `express-wish` (две ветки): курс без анкеты → мгновенное создание `Wish`; курс с анкетой → запуск анкеты через `questionnaireFacade.startStandard`, желание создаёт ER.
- Реализован ER `record-wish` (подписка на `questionnaire:complete`, идемпотентность по существующему `expressed`-желанию).
- Добавлен `domain/wish/wish-questionnaire.ts` — пул анкеты желания + `hasQuestionnaire(courseId)`.
- Добавлен метод `CourseFacade.getCourse(courseId)` для проверки существования курса.

### Фаза 3: UC cancel-wish
- Реализован `cancel-wish`: поиск `Wish(expressed)` по `(userId, courseId)` → `cancel()` → сохранение; ошибка `WISH_NOT_FOUND` при отсутствии.

### Фаза 4: Удаление onboarding + регистрация
- Удалён весь старый код анкет onboarding; пакет переименован в `@u7-scl/wish`.
- Обновлены `create-api-app.ts`, `u7-bot-app-meta.ts` (WishApiModuleMeta вместо OnboardingApiModuleMeta), `create-ui-app.ts` (без onboarding-контроллера).
- Удалены `controllers/onboarding/` и e2e-тест `onboarding.e2e.test.ts`.
- `WishApiModule` (useCases + reactions) зарегистрирован в `ApiApp`.

## Созданные/изменённые файлы

**Новый пакет `packages/wish`:**
- `src/domain/wish/entity.ts`, `a-root.ts`, `repo.ts`, `errors.ts`
- `src/domain/wish/commands/express-wish-cmd.ts`, `cancel-wish-cmd.ts`
- `src/domain/wish/wish-questionnaire.ts`
- `src/domain/module.ts`, `src/domain/index.ts`
- `src/api/wish-uc.ts`, `src/api/wish/express-wish-uc.ts`, `cancel-wish-uc.ts`
- `src/api/er/record-wish-er.ts`, `src/api/module.ts`, `src/api/index.ts`
- `src/infra/db/wish-json-repo.ts`, `src/infra/index.ts`, `src/index.ts`
- тесты: `a-root.test.ts`, `wish-json-repo.test.ts`, `express-wish-uc.test.ts`, `cancel-wish-uc.test.ts`, `record-wish-er.test.ts`

**Изменённые файлы:**
- `packages/course/src/domain/facade.ts`, `packages/course/src/infra/course-in-proc-facade.ts` — добавлен `getCourse`
- `tsconfig.json` — пути `@u7-scl/wish/*`
- `apps/u7-bot/package.json` — зависимости `@u7-scl/wish`, `@u7-scl/questionnaire`
- `apps/u7-bot/src/create-api-app.ts`, `create-ui-app.ts`, `core/u7-bot-app-meta.ts`
- `apps/u7-bot/src/controllers/questionnaire/controller.ts` — комментарий
- `README.md`, `apps/u7-bot/README.md` — описание модулей
- `bun.lock`

**Удалённые файлы:**
- `packages/onboarding/` (весь пакет)
- `apps/u7-bot/src/controllers/onboarding/`
- `apps/u7-bot/tests/e2e/onboarding.e2e.test.ts`

## Архитектурные решения

1. **wish фиксирует желание, анкету ведёт questionnaire** — express-wish вызывает `questionnaireFacade.startStandard` ровно один раз; желание создаётся ER `record-wish` по событию `questionnaire:complete`.
2. **Роль `CANDIDATE` wish НЕ выдаёт** — удаление роли из enum/policy/stream перенесено в трек C2 (в C1 enum не трогали, чтобы не сломать stream).
3. **Курс без анкеты → мгновенное желание** — `hasQuestionnaire(courseId)` по конфигу (множество courseId); по умолчанию пусто, все курсы фиксируют желание мгновенно.
4. **`getByUserAndCourse` возвращает последнее желание** по `createdAt` — в каждый момент существует не более одного `expressed`-желания на пару (user, course).

## Отклонения от плана

- Вместо размещения UC-ошибок в `domain/wish/commands/errors.ts` ошибки вынесены в `domain/wish/errors.ts` (по структуре из spec.md).
- `CourseFacade` дополнен методом `getCourse(courseId)` — в исходном фасаде не было метода проверки существования курса (spec FR3 требует проверку «через CourseFacade»).

## Известные ограничения

- `hasQuestionnaire(courseId)` по умолчанию пуст — подключение реального конфига «у каких курсов есть анкета» выполнит UI-трек D.
- Метод `WishAr.fulfill()` и переход `expressed → fulfilled` добавляются в треке C2.
- Роль `CANDIDATE` всё ещё присутствует в enum (удаление — трек C2).
