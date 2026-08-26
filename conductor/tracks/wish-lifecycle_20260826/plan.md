# План реализации — Трек: wish: полный жизненный цикл + универсальные цели (target)

## Фаза 1: target-модель

- [ ] Task: Написать падающие тесты на `WishTargetSchema` (variant course) и `WishAr.express/pending` (сигнатуры (userId, target))
- [ ] Task: Реализовать `WishTargetSchema`, обновить `WishSchema` (target вместо courseId), `WishAr` (express/pending/confirm/abandon/cancel + инварианты)
- [ ] Task: Обновить `WishRepo` → `getByUserAndTarget(userId, target)` + `WishJsonRepo` + тесты репозитория
- [ ] Task: Conductor - Ручная верификация 'target-модель'

## Фаза 2: Анкетная ветка — ER confirm/abandon

- [ ] Task: Написать падающие тесты на `confirm-wish-er` (pending→confirmed, идемпотентность: не pending → игнор) и `abandon-wish-er` (pending→abandoned)
- [ ] Task: Реализовать `confirm-wish-er.ts` и `abandon-wish-er.ts`, зарегистрировать в `WishApiModule.reactions` (вместо `record-wish`)
- [ ] Task: Conductor - Ручная верификация 'ER confirm/abandon'

## Фаза 3: UC create-course-wish + пул курса

- [ ] Task: Написать падающие тесты на `findCoursePool` (course.json: привязка к курсу, undefined для курса без пула)
- [ ] Task: Создать `domain/wish/pools/course.json` + `pools/course-pool.ts` (findCoursePool), включить `resolveJsonModule` в tsconfig.json
- [ ] Task: Написать падающие тесты на `create-course-wish` (обе ветки: пул есть → pending + startStandard + outcome questionnaire; пула нет → expressed + outcome instant; COURSE_NOT_FOUND; WISH_ALREADY_EXISTS при активном желании на тот же (user, target); параллельные желания на разные курсы)
- [ ] Task: Реализовать `create-course-wish-uc.ts` + `create-course-wish-cmd.ts` (вход { courseId }, target course), обновить `cancel-wish` (скоуп (user, target), отмена только expressed|confirmed, для pending — WISH_NOT_FOUND)
- [ ] Task: Удалить `express-wish-uc.ts`, `express-wish-cmd.ts`, `record-wish-er.ts`, `wish-questionnaire.ts` + их тесты; обновить appApi-метаданные (`u7-bot-app-meta.ts`, `create-api-app.ts`); grep express-wish/record-wish/wishQuestionnairePool → пусто
- [ ] Task: Conductor - Ручная верификация 'create-course-wish'

## Фаза 4: Документация

- [ ] Task: Обновить `course/ui-spec.md` — экраны W01–W05 (контракт `create-course-wish`, статусы желания под новый жизненный цикл)
- [ ] Task: Обновить `conductor/metrics-system.md` и `conductor/metrics-conception.md` (onboarding → wish, контексты анкет), проверить дочерние (`metrics-questionnaire-and-events.md`, `metrics-pipeline-and-modules.md`)
- [ ] Task: Обновить README (root, apps/u7-bot) и JSDoc модуля wish (entity.ts, a-root.ts, pools)
- [ ] Task: Conductor - Ручная верификация 'документация'
