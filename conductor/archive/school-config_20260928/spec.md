# Трек: Школа как конфигурация уровня приложения (school-config)

**Релиз:** `0.2.0` (группа «Школа»).

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

**FR-1. Тип `School` в модуле app (сущность).**
В `packages/app/src/domain/school.ts`: сущность (entity) + valibot-схема, экспорт из
`@u7-scl/app/domain`. Поля:

- `id: string` — uuid школы, константа в app-слое (связка `Stream.schoolId`; в будущем —
  из БД модуля школ);
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
- `studentGroup: { id: number; inviteUrl: string }` — общая студенческая группа школы
  (дефолт для новых потоков; не путать с группой конкретного потока).

Статические значения (имя, описание, адрес, телефон) живут в коде app-слоя.
Средозависимые (группы) приходят из env.

**FR-2. Резолверы и закрытие дженериков уровня приложения.**
- `core`: `ModuleResolver<TAppResolver extends AppResolver = AppResolver>` — generic
  с дефолтом (обратная совместимость).
- `app`: `U7AppResolver extends AppResolver { school: School }` — переносится из
  `apps/u7-bot` в `packages/app/src/domain` (иначе пакеты не могут на него ссылаться).
- `app`: `U7ModuleResolver extends ModuleResolver<U7AppResolver>` — закрывает дженерик
  один раз.
- `app`: `U7UseCase<TMeta, TResolve extends U7ModuleResolver = U7ModuleResolver>` и
  `U7ApiModule<TMeta, TResolve extends U7ModuleResolver = U7ModuleResolver>` — дефолт
  резолвера уровня приложения (актор `User` остаётся закрытым там же).
- Доменные модули убирают прямой импорт core-`ModuleResolver`: их `*ApiModuleResolver`
  наследуют `U7ModuleResolver` и дополняют своими зависимостями (`streamRepo`,
  `userFacade`, …).
- Удалить пустой `U7AppResolver` из `apps/u7-bot/src/core/u7-bot-app-meta.ts`.

**FR-3. Резолв школы из env.**
`BotConfig` читает обязательные `COMMUNITY_GROUP_ID`, `COMMUNITY_GROUP_URL`,
`STUDENT_GROUP_ID`, `STUDENT_GROUP_INVITE`. `create-api-app.ts` собирает `School`
(статика + env) и кладёт в `appResolver.school`. При отсутствии значения —
**приложение падает при загрузке** (без fallback).

**FR-4. Проброс в UI; UI не зависит от `BotConfig`.**
`U7BotUiAppResolve` получает `school`, `adminTelegramIds` и `botAdminUser`
(резолв из `botAdminUuid`); `AppController`/`CommunityStory` и `CreateStreamStory`
берут данные школы из resolve, а не из `config`. Стори и контроллеры `config` уже не
используют — закрепить инвариант; `create-ui-app.ts` перестаёт принимать `BotConfig`.

**FR-5. Убрать прямые `config.schoolGroup*`.**
Из `main.ts` (для `group-handler`) и `create-ui-app.ts` (для `AppController`) —
в пользу резолвера.

**FR-6. Единые имена в коде и env.**
- `SCHOOL_GROUP_ID` → `COMMUNITY_GROUP_ID`, `SCHOOL_GROUP_URL` → `COMMUNITY_GROUP_URL`;
- новые `STUDENT_GROUP_ID`, `STUDENT_GROUP_INVITE` — общая студенческая группа школы;
- переименование без fallback; legacy `SCHOOL_GROUP_*` **сразу удаляются** (в `.env.development`
  тоже) — код и env меняются в одном релизе `0.2.0`, дубли имён не нужны;
- значения различаются по средам; для `.env.development` обе группы совпадают —
  `COMMUNITY_GROUP_ID=-5242483751` / `COMMUNITY_GROUP_URL=https://t.me/+31g_Pw1AWfQ1YjQy`,
  те же значения для `STUDENT_GROUP_*`;
- прод-значения задаёт владелец по Migration-инструкции (они другие).

**FR-7. `mode` из `NODE_ENV`.**
`AppEnvMode` (`test`/`development`/`production`) читается из `NODE_ENV` с валидацией;
отсутствующее или неизвестное значение — **падение при загрузке** (fallback нет).
Значения задают скрипты и окружения: `bun test` → `test`, `dev:fixtures` →
`development`, pm2 `env_production` → `production`; в `.env.development` добавляется
`NODE_ENV=development`.

**FR-8. Pre-fill wizard создания потока.**
Шаги 9–10 (`CreateStreamStory`) предзаполняются `school.studentGroup`: значение показано
в тексте шага, есть «Оставить значение», «Пропустить» и возможность ввести другое.

**FR-9. Миграционная инструкция для прода.**
Секция **Migration** в `CHANGELOG`: (1) перенести значения `SCHOOL_GROUP_*` в
`COMMUNITY_GROUP_*`, (2) задать `STUDENT_GROUP_ID`/`STUDENT_GROUP_INVITE` (прод-значения),
(3) задать `NODE_ENV=production`, (4) перезапустить
`pm2 start pm2.config.cjs --env production --update-env`. Порядок обязателен: **env
правится до выката кода** — без обязательной переменной приложение падает при загрузке.

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
- Модуль школ: `SchoolAr`/`SchoolRepo`, несколько школ, резолв из БД (`School` пока —
  сущность уровня app без Ar/Repo: статика + env).
- Миграция/перезапись существующих потоков и их `telegramGroupId`.
- Отображение `name`/`description`/`address`/`contacts` в новых экранах (кроме
  информации о группе сообщества).
