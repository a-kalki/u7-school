# План реализации — Трек: wish: полный жизненный цикл + универсальные цели (target)

## Фаза 1: target-модель

- [x] Task: Написать падающие тесты на `WishTargetSchema` (variant course) и `WishAr.express/pending` (сигнатуры (userId, target)) [35814814]
- [x] Task: Реализовать `WishTargetSchema`, обновить `WishSchema` (target вместо courseId), `WishAr` (express/pending/confirm/abandon/cancel + инварианты) [35814814]
- [x] Task: Обновить `WishRepo` → `getByUserAndTarget(userId, target)` + `WishJsonRepo` + тесты репозитория [35814814]
- [x] Task: Conductor - Ручная верификация 'target-модель' (check:p wish + check:a u7-bot зелёные, подтверждено пользователем) [35814814]

## Фаза 2: Анкетная ветка — ER confirm/abandon

- [x] Task: Написать падающие тесты на `confirm-wish-er` (pending→confirmed, идемпотентность: не pending → игнор) и `abandon-wish-er` (pending→abandoned) [624481ae]
- [x] Task: Реализовать `confirm-wish-er.ts` и `abandon-wish-er.ts`, зарегистрировать в `WishApiModule.reactions` (вместо `record-wish`) [624481ae]
- [x] Task: Conductor - Ручная верификация 'ER confirm/abandon' (check:p wish + check:a u7-bot зелёные, подтверждено пользователем) [624481ae]

## Фаза 3: UC create-course-wish + пул курса

- [x] Task: Написать падающие тесты на `findCoursePool` (course.json: привязка к курсу, undefined для курса без пула) [03db29bd]
- [x] Task: Создать `domain/wish/pools/course.json` + `pools/course-pool.ts` (findCoursePool), включить `resolveJsonModule` в tsconfig.json [03db29bd]
- [x] Task: Написать падающие тесты на `create-course-wish` (обе ветки: пул есть → pending + startStandard + outcome questionnaire; пула нет → expressed + outcome instant; COURSE_NOT_FOUND; WISH_ALREADY_EXISTS при активном желании на тот же (user, target); параллельные желания на разные курсы) [941ceff9]
- [x] Task: Реализовать `create-course-wish-uc.ts` + `create-course-wish-cmd.ts` (вход { courseId }, target course), обновить `cancel-wish` (скоуп (user, target), отмена только expressed|confirmed, для pending — WISH_NOT_FOUND) [941ceff9]
- [x] Task: Удалить `express-wish-uc.ts`, `express-wish-cmd.ts`, `record-wish-er.ts`, `wish-questionnaire.ts` + их тесты; обновить appApi-метаданные (`u7-bot-app-meta.ts`, `create-api-app.ts`); grep express-wish/record-wish/wishQuestionnairePool → пусто [941ceff9]
- [ ] Task: Conductor - Ручная верификация 'create-course-wish'

## Фаза 4: Документация

- [x] Task: Обновить `course/ui-spec.md` — экраны W01–W05 (контракт `create-course-wish`, статусы желания под новый жизненный цикл) [8e9210c6]
- [x] Task: Обновить спеки и планы треков C2 (`wish-fulfillment`) и D (`wish-ui`): контракт `create-course-wish` вместо `express-wish`, target-модель, новые статусы (`fulfill` из `expressed|confirmed`) [8e9210c6]
- [x] Task: Обновить `conductor/metrics-system.md` и `conductor/metrics-conception.md` (onboarding → wish, контексты анкет), проверить дочерние (`metrics-questionnaire-and-events.md`, `metrics-pipeline-and-modules.md`) [8e9210c6]
- [x] Task: Обновить README (root, apps/u7-bot) и JSDoc модуля wish (entity.ts, a-root.ts, pools) [8e9210c6]
- [x] Task: Conductor - Ручная верификация 'документация' (check:p wish зелёный, grep устаревших ссылок пуст, подтверждено пользователем) [8e9210c6]
