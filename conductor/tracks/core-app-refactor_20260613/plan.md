# План реализации: Рефакторинг ядра и интеграция модулей через пакет `@u7-scl/app`

## Фаза 1: Инфраструктурная подготовка и создание пакета `@u7-scl/app`
В этой фазе мы создадим новый пакет, пропишем пути в `tsconfig.json` и определим базовые интерфейсы контрактов приложения.

- [ ] **Task: Инициализация пакета `@u7-scl/app`**
  - [ ] Создать директорию `packages/app/src`
  - [ ] Создать и настроить `packages/app/package.json` и `packages/app/tsconfig.json`
  - [ ] Зарегистрировать пути для `@u7-scl/app/*` в корневом `tsconfig.json`
- [ ] **Task: Определение доменных типов и схем в `@u7-scl/app/domain`**
  - [ ] Перенести определение `Role` и `RoleSchema` из `packages/user/src/domain/user/roles.ts` в `packages/app/src/domain/user.ts` (или аналогичный файл)
  - [ ] Перенести определение `User` и `UserSchema` из `packages/user/src/domain/user/entity.ts` в `packages/app/src/domain/user.ts`
  - [ ] Создать `packages/app/src/domain/u7-bot-app-meta.ts` и объявить `U7BotAppMeta` и `U7AppResolver`
  - [ ] Создать индексный файл экспорта `packages/app/src/domain/index.ts`
- [ ] **Task: Определение UI-компонентов в `@u7-scl/app/ui`**
  - [ ] Создать `packages/app/src/ui/u7-bot-controller.ts` и объявить `U7BotController`
  - [ ] Создать `packages/app/src/ui/u7-bot-user-story.ts` и объявить `U7BotUserStory`
  - [ ] Создать индексный файл экспорта `packages/app/src/ui/index.ts`
- [ ] **Task: Корневой экспорт пакета**
  - [ ] Создать `packages/app/src/index.ts`
- [ ] **Task: Conductor - User Manual Verification 'Фаза 1' (Protocol in workflow.md)**

## Фаза 2: Рефакторинг ядра (`@u7-scl/core`)
В этой фазе мы переведем ядро на использование `AppResolver`, внедрим `ApiExecutor` и перенесем телеметрию в модули.

- [ ] **Task: Обновление типов в `core`**
  - [ ] В `packages/core/src/domain/types.ts` добавить `AppEnvMode`, `AppResolver` и `ModuleResolver`
  - [ ] Там же добавить `GetUcNamesFromMeta`, `ExtractUcMetaFromMeta` и интерфейс `ApiExecutor<TMeta>`
- [ ] **Task: Рефакторинг `ApiModule`**
  - [ ] В `packages/core/src/api/module/api-module.ts` реализовать `ApiExecutor`
  - [ ] Обновить второй дженерик: `TResolve extends ModuleResolver`
  - [ ] В методе `init` извлекать `logger` и `mode` из `resolve.appResolver`
  - [ ] Реализовать строго типизированный метод `execute`
  - [ ] В методе `handle` реализовать замер времени выполнения use-case и логирование
- [ ] **Task: Рефакторинг `ApiApp`**
  - [ ] В `packages/core/src/api/app/api-app.ts` реализовать `ApiExecutor`
  - [ ] Переписать конструктор на прием `ApiAppResolver` (или напрямую `AppResolver`)
  - [ ] Убрать дублирующийся замер времени и логгер из метода `execute`
- [ ] **Task: Рефакторинг `BotController` и `BotUserStory`**
  - [ ] В `packages/core/src/ui/bot/controller/bot-controller.ts` добавить дженерик `TModuleMeta` и обновить конструктор/метод `init`
  - [ ] В `packages/core/src/ui/bot/bot-user-story.ts` обновить дженерики и метод `init`
- [ ] **Task: Conductor - User Manual Verification 'Фаза 2' (Protocol in workflow.md)**

## Фаза 3: Адаптация доменных модулей к новым интерфейсам
В этой фазе мы перенастроим модули `user`, `stream` и `onboarding` на новые контракты и уберем принудительные приведения типов.

- [ ] **Task: Рефакторинг модуля `user`**
  - [ ] Настроить импорт `User`, `Role`, `UserSchema`, `RoleSchema` из `@u7-scl/app/domain` во всех файлах модуля `user`
  - [ ] Обновить `UserApiModuleResolver`, добавив наследование от `ModuleResolver`
- [ ] **Task: Рефакторинг модуля `onboarding`**
  - [ ] Обновить `OnboardingApiModuleResolver` наследованием от `ModuleResolver`
  - [ ] Перевести `OnboardingController` на наследование от `U7BotController<OnboardingApiModuleMeta>`
  - [ ] Заменить обращения к `this.api.execute` на `this.moduleApi.execute`
- [ ] **Task: Рефакторинг модуля `stream`**
  - [ ] Обновить `StreamApiModuleResolver` наследованием от `ModuleResolver`
  - [ ] Перевести `StreamController` на наследование от `U7BotController<StreamApiModuleMeta>`
  - [ ] Перевести сценарии (`CatalogStory` и др.) на наследование от `U7BotUserStory<StreamApiModuleMeta>`
  - [ ] Заменить вызовы `this.api.execute` на `this.moduleApi.execute` и удалить `as unknown as StreamItem[]`
- [ ] **Task: Исправление опечаток и других модулей**
  - [ ] Исправить опечатку `initResolve` в `packages/course/src/api/module.ts`
- [ ] **Task: Conductor - User Manual Verification 'Фаза 3' (Protocol in workflow.md)**

## Фаза 4: Сборка, запуск и верификация приложения
Финальная сборка приложения и запуск тестов.

- [ ] **Task: Адаптация точки входа в `apps/u7-bot`**
  - [ ] В `apps/u7-bot/src/api-app.ts` настроить передачу `appResolver` при создании `ApiApp`
  - [ ] В `apps/u7-bot/src/main.ts` обновить создание контроллеров с передачей модулей в конструктор
- [ ] **Task: Верификация сборки и тестов**
  - [ ] Запустить `bun x tsc --noEmit` и убедиться в отсутствии ошибок во всех пакетах
  - [ ] Запустить `bun test` и проверить прохождение тестов ядра и модулей
- [ ] **Task: Conductor - User Manual Verification 'Фаза 4' (Protocol in workflow.md)**
