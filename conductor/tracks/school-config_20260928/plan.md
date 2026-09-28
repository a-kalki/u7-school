# План реализации: Школа как конфигурация уровня приложения (school-config)

> Методология — [workflow.md](../../workflow.md): TDD (Red → Green → Refactor),
> гейт из трёх проверок (`lint` + `tslint` + `test`), протокол завершения фазы.

---

## Фаза 1: Core — generic `ModuleResolver`

- [ ] Task: Написать тест типов: `ModuleResolver<TAppResolver>` принимает расширенный
      `AppResolver`, а `ModuleResolver` без параметра остаётся совместим со старым кодом.
    - [ ] Тест-файл в `packages/core/src/domain/types.test.ts` (или type-check сценарий).
- [ ] Task: Реализовать `ModuleResolver<TAppResolver extends AppResolver = AppResolver>`.
- [ ] Task: Прогнать `bun run tslint` и тесты core — убедиться в отсутствии регрессов типов.
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Core generic ModuleResolver' (Protocol in workflow.md)

## Фаза 2: App — тип `School` и резолверы

- [ ] Task: Тесты `SchoolSchema` (валидный объект с `id`; отсутствие обязательного поля; опциональный `site`).
- [ ] Task: Реализовать `packages/app/src/domain/school.ts` — сущность (entity)
      + valibot-схема, константа `id` + статические значения школы (`name`, `description`,
      `address`, `contacts.phone`).
- [ ] Task: Перенести `U7AppResolver` в `packages/app/src/domain`, добавить `school: School`.
- [ ] Task: Ввести `U7ModuleResolver extends ModuleResolver<U7AppResolver>`.
- [ ] Task: Закрыть резолвер в `U7UseCase`/`U7ApiModule`
      (`TResolve extends U7ModuleResolver = U7ModuleResolver`) и перевести **все** доменные
      `*ApiModuleResolver` со core-`ModuleResolver` на `U7ModuleResolver`.
- [ ] Task: Удалить пустой `U7AppResolver` из `apps/u7-bot/src/core/u7-bot-app-meta.ts`,
      заменить импортом из `@u7-scl/app/domain`.
- [ ] Task: Экспортировать новые типы из `@u7-scl/app/domain` (barrel `index.ts`).
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: App — тип School и резолверы' (Protocol in workflow.md)

## Фаза 3: apps/u7-bot — env → config → резолвер, `mode`

- [ ] Task: Обновить тесты `loadConfig`: новые обязательные переменные, `mode` из `NODE_ENV`,
      падение при отсутствии/невалидности `NODE_ENV` (дефолта нет).
- [ ] Task: Обновить `BotConfigSchema`: `communityGroupId`/`communityGroupUrl`,
      `studentGroupId`/`studentGroupInvite`, поле `mode`.
- [ ] Task: Собрать `School` (статика + config) в `create-api-app.ts`, положить в
      `appResolver.school`; выставить `mode` из config.
- [ ] Task: Прокинуть `school` и `adminTelegramIds` в `U7BotUiAppResolve`;
      `create-ui-app.ts` перестаёт принимать `BotConfig` (FR-4).
- [ ] Task: Обновить `config.test.ts` и моки `appResolver` в тестах под новые типы.
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: env → config → резолвер' (Protocol in workflow.md)

## Фаза 4: Потребители — убрать прямые `config.schoolGroup*`

- [ ] Task: Тесты `AppController`/`CommunityStory` — URL сообщества берётся из `school`.
- [ ] Task: `AppController`/`CommunityStory` получают `school.communityGroup.url` из resolve.
- [ ] Task: `group-handler` получает `school.communityGroup.id` (через резолвер), не из `config`.
- [ ] Task: Убрать прямые `config.schoolGroup*` из `main.ts` и `create-ui-app.ts`.
- [ ] Task: Conductor - User Manual Verification 'Фаза 4: Потребители school' (Protocol in workflow.md)

## Фаза 5: Wizard — pre-fill студенческой группы

- [ ] Task: Тесты wizard: шаги 9–10 предзаполнены `school.studentGroup`, доступны «Оставить»,
      «Пропустить» и ручной ввод другого значения.
- [ ] Task: Реализовать дефолт из `school.studentGroup` в `CreateStreamStory`.
- [ ] Task: Conductor - User Manual Verification 'Фаза 5: Wizard pre-fill' (Protocol in workflow.md)

## Фаза 6: Env-файлы, CHANGELOG, документация

- [ ] Task: Обновить `.env.development`: удалить legacy `SCHOOL_GROUP_*`, оставить только
      `COMMUNITY_GROUP_*`/`STUDENT_GROUP_*` и `NODE_ENV=development` (код и env меняются
      в одном релизе `0.2.0`, дубли имён не нужны).
- [ ] Task: `CHANGELOG`: секция Migration — перенос `SCHOOL_GROUP_*` → `COMMUNITY_GROUP_*`,
      новые `STUDENT_GROUP_*` (прод-значения), `NODE_ENV=production`, порядок «env → выкат
      кода», корректный перезапуск pm2 под `production`.
- [ ] Task: Обновить conductor-документацию (`architecture.md` / `domain-boundaries.md`) про
      `AppResolver.school` и generic `ModuleResolver`.
- [ ] Task: Conductor - User Manual Verification 'Фаза 6: Миграция и документация' (Protocol in workflow.md)

## Фаза 7: Финал — гейт качества и итоги

- [ ] Task: Полный прогон `bun run check` (lint + tslint + test), триаж красных тестов.
- [ ] Task: `summary.md` трека (числа pass/fail, промежуточные состояния, решения).
- [ ] Task: Прод-миграция (выполняет владелец с подтверждением): правка `.env.production`,
      корректный `pm2 start pm2.config.cjs --env production`, проверка `mode`.
- [ ] Task: Conductor - User Manual Verification 'Фаза 7: Финал' (Protocol in workflow.md)
