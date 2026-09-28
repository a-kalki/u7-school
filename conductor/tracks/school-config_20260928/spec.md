# Трек: Школа как конфигурация уровня приложения (school-config)

## Обзор

Ввести на уровне модуля `app` понятие **«Школа»** — единый источник данных о школе
(имя, описание, адрес, контакты, Telegram-группы), резолвимый из конфигурации приложения.
Расширить `AppResolver` полем `school` и закрыть дженерик `AppResolver` на уровне `app`
(единообразно с закрытием актора `User` в `U7UseCase`/`U7ApiModule`).

Устранить архитектурную дыру: сейчас значения «школы» раскиданы напрямую из `config`
по точкам сборки (`main.ts` → `group-handler`, `create-ui-app.ts` → `AppController`).
После трека все потребители берут школу из резолвера, а `config` остаётся единственной
точкой чтения env в композиционном корне.

Дополнительно: исправить `AppResolver.mode` (сейчас жёстко `'development'`) и
предзаполнить wizard создания потока студенческой группой.

## Контекст (текущее состояние)

- `AppResolver` (`packages/core/src/domain/types.ts`): `{ logger, mode, eventBus }`;
  `ModuleResolver` **не generic**.
- `U7AppResolver extends AppResolver {}` — пуст и нигде не используется (задел).
- `config.schoolGroupId` → `registerGroupHandlers` (`main.ts:120`);
  `config.schoolGroupUrl` → `AppController` → `CommunityStory` (`create-ui-app.ts:51`).
- `appResolver.mode` захардкожен `'development' as const` (`create-api-app.ts`).
- Фактический прод-процесс запущен с `NODE_ENV=development` (pm2 не применил
  `env_production`), т.е. прод работает в dev-режиме.
- У всех 8 потоков одна группа: `telegramGroupId=-1003960918937`,
  `telegramGroupInvite=https://t.me/+6xeqTYm2831lODZi`.
- `.env*` вне git — правки env выполняются вручную и документируются.

## Функциональные требования

**FR-1. Тип `School` в модуле app.**
В `packages/app/src/domain/school.ts`: value object + valibot-схема, экспорт из
`@u7-scl/app/domain`. Поля:

- `name: string` — «U7 School»;
- `description: string` — «Развиваем не только хард-скиллы, но и софт-скиллы, придавая
  последним не меньшее значение. Весь процесс обучения заточен на это.»;
- `address: string` — «Оффлайн уроки на территории BatysHub. Адрес: г. Уральск,
  ул. Исатая-Махамбета, 84 (здание ЦОН по Чагано-Набережной).»;
- `contacts: { phone: string; site?: string }` — `phone = "+7 777 287 8182"`, `site` пока не задаётся;
- `mentors: string[]` — массив uuid менторов школы, сейчас
  `["8d9a56f6-51e7-49f0-ba58-2832b157e718"]` (Nur); статика в коде, пополняется
  по мере появления менторов; имена резолвятся по uuid на UI-слое (`userFacade`);
- `communityGroup: { id: number; url: string }` — группа сообщества (для всех);
- `studentGroup: { id: number; inviteUrl: string }` — студенческая группа (для потоков).

Статические значения (имя, описание, адрес, телефон) живут в коде app-слоя.
Средозависимые (группы) приходят из env.

**FR-2. Резолверы.**
- `core`: `ModuleResolver<TAppResolver extends AppResolver = AppResolver>` — generic с
  дефолтом (обратная совместимость).
- `app`: `U7AppResolver extends AppResolver { school: School }` (переносится из
  `apps/u7-bot` в `packages/app/src/domain` — иначе пакеты не могут на него ссылаться).
- `app`: `U7ModuleResolver extends ModuleResolver<U7AppResolver>` — закрывает дженерик один
  раз; доменные модули наследуют свои `*ApiModuleResolver` от него.

**FR-3. Резолв школы из env.**
`BotConfig` читает обязательные `COMMUNITY_GROUP_ID`, `COMMUNITY_GROUP_URL`,
`STUDENT_GROUP_ID`, `STUDENT_GROUP_INVITE`. `create-api-app.ts` собирает `School`
(статика + env) и кладёт в `appResolver.school`. При отсутствии значения —
**приложение падает при загрузке** (без fallback).

**FR-4. Проброс в UI; UI не зависит от `BotConfig`.**
`U7BotUiAppResolve` получает `school`. `AppController`/`CommunityStory` и
`CreateStreamStory` берут данные школы из resolve, а не из `config`.
Стори и контроллеры `config` уже не используют — закрепить инвариант;
`create-ui-app.ts` перестаёт принимать `BotConfig`: школа и `adminTelegramIds`
приходят через резолвер, `botAdminUser` резолвится из `botAdminUuid` в нём же.

**FR-5. Убрать прямые `config.schoolGroup*`.**
Из `main.ts` (для `group-handler`) и `create-ui-app.ts` (для `AppController`) —
в пользу резолвера.

**FR-6. Единые имена в коде и env.**
- `SCHOOL_GROUP_ID` → `COMMUNITY_GROUP_ID`, `SCHOOL_GROUP_URL` → `COMMUNITY_GROUP_URL`;
- новые `STUDENT_GROUP_ID`, `STUDENT_GROUP_INVITE`;
- переименование без fallback на старое имя;
- `.env.development`: одна группа и для community, и для student; исправить битый
  `SCHOOL_GROUP_URL` (`https:t.me/...` без `//`).

**FR-7. `mode` из `NODE_ENV`.**
`AppEnvMode` (`test`/`development`/`production`) читается из `NODE_ENV` с валидацией;
если не задана — падает. Согласовано: `bun test` выставляет `test`,
`dev:fixtures` — `development`, pm2 `env_production` — `production`.

**FR-8. Pre-fill wizard создания потока.**
Шаги 9–10 (`CreateStreamStory`) предзаполняются `school.studentGroup`: значение показано
в тексте шага, есть «Оставить значение», «Пропустить» и возможность ввести другое.

**FR-9. Миграционная инструкция для прода.**
Секция **Migration** в `CHANGELOG` с точными значениями и шагами для `.env.production`
и корректного перезапуска pm2 под `production`.

## Нефункциональные требования

- Обратная совместимость типов резолверов (generic с дефолтом).
- Гейт качества: `bun run lint`, `bun run tslint`, `bun test` — чисто.
- Данные БД не мигрируются; существующие потоки не перезаписываются.
- `.env*` вне git: правки — ручные, документируются; `.env.production` меняет владелец
  отдельно с подтверждением.

## Критерии приёмки

- `bun run lint`, `bun run tslint`, `bun test` проходят.
- `School` доступна из `appResolver` (API) и `U7BotUiAppResolve` (UI); покрыто тестами.
- В коде не осталось чтения `config.schoolGroup*` вне композиционного корня.
- UI-слой (стори, контроллеры, `create-ui-app`) не импортирует `BotConfig`/`config`.
- `loadConfig` падает при отсутствии обязательной переменной; `config.test.ts` обновлён.
- `mode` соответствует `NODE_ENV` (`test`/`development`/`production`).
- Wizard предзаполняет студенческую группу (тест story).
- `CHANGELOG` содержит Migration-инструкцию с готовыми значениями.

## За рамками

- Хаб «🏫 Школа» (инфо, менторы, потоки, отзывы, сообщество) — отдельный трек
  (`school-hub`); концепция школ — `conductor/roadmap/schools-system.md`.
- Модуль школ: `SchoolAr`/`SchoolRepo`, несколько школ, резолв из БД.
- Миграция/перезапись существующих потоков и их `telegramGroupId`.
- Отображение `name`/`description`/`address`/`contacts` в новых экранах (кроме
  информации о группе сообщества).
