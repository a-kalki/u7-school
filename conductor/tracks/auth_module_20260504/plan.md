# Plan: Выделение модуля аутентификации и пользователей (auth)

## Phase 1: Создание структуры packages/auth [x] [checkpoint: c75b9b2]

- [x] Task: Создать `packages/auth/package.json` с зависимостями `@u7/core`, `valibot`
- [x] Task: Создать `packages/auth/tsconfig.json`, наследующий базовую конфигурацию
- [x] Task: Создать директории `packages/auth/src/{domain,api,ui}/`
- [x] Task: Создать `packages/auth/src/index.ts` с публичными экспортами
- [x] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Перенос домена User из packages/course [x] [checkpoint: fc89e4d]

- [x] Task: Перенести `domain/user/user-ar.ts` → `packages/auth/src/domain/user/user-ar.ts`
- [x] Task: Перенести `domain/user/user.ts` → `packages/auth/src/domain/user/user.ts`
- [x] Task: Перенести `domain/user/roles.ts` → `packages/auth/src/domain/user/roles.ts`
- [x] Task: Перенести `domain/user/user-policy.ts` → `packages/auth/src/domain/user/user-policy.ts`
- [x] Task: Адаптировать `UserAr` под базовый класс `Aggregate` из `@u7/core`
- [x] Task: Написать тесты для `user-ar.test.ts`
- [x] Task: Написать тесты для `user-policy.test.ts`
- [x] Task: Написать тесты для `roles.test.ts`
- [x] Task: Удалить `packages/course/src/domain/user/` и обновить импорты в `packages/course`
- [x] Task: Обновить `packages/course/src/index.ts` (удалить экспорты user, добавить зависимость от `@u7/auth` при необходимости)
- [x] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Реализация API-модуля auth [x] [checkpoint: 865f6b0]

- [x] Task: Создать интерфейс `UserRepository` в `packages/auth/src/api/user-repository.ts`
- [x] Task: Реализовать `InMemoryUserRepository` в `packages/auth/src/api/user-repository-inmemory.ts`
- [x] Task: Написать тесты для `InMemoryUserRepository`
- [x] Task: Создать схему `CreateUserCommandSchema` в `packages/auth/src/api/commands/create-user-command.ts`
- [x] Task: Реализовать `CreateUserUc` с логикой бутстрапа (первый пользователь = ADMIN)
    - [x] Subtask: Написать падающие тесты для `CreateUserUc`
    - [x] Subtask: Реализовать `CreateUserUc`, наследуясь от `@u7/core` `UseCase`
    - [x] Subtask: Убедиться, что тесты проходят
- [x] Task: Реализовать `GetUserUc` (по UUID)
    - [x] Subtask: Написать падающие тесты
    - [x] Subtask: Реализовать UseCase
    - [x] Subtask: Убедиться, что тесты проходят
- [x] Task: Реализовать `ListUsersUc`
    - [x] Subtask: Написать падающие тесты
    - [x] Subtask: Реализовать UseCase
    - [x] Subtask: Убедиться, что тесты проходят
- [x] Task: Реализовать `GetUserByTelegramIdUc`
    - [x] Subtask: Написать падающие тесты
    - [x] Subtask: Реализовать UseCase
    - [x] Subtask: Убедиться, что тесты проходят
- [x] Task: Создать `AuthApiModule extends Module` в `packages/auth/src/api/auth-module.ts`
- [x] Task: Написать интеграционный тест `api/module.test.ts` для `AuthApiModule`
- [x] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

## Phase 4: Интеграция в apps/u7-cli [x] [checkpoint: 85304af]

- [x] Task: Создать `AuthAutoUiModule extends AutoUiModule` в `packages/auth/src/ui/auto-ui/auth-auto-ui-module.ts`
- [x] Task: Экспортировать `AuthAutoUiModule` из `packages/auth/src/index.ts`
- [x] Task: Подключить `AuthApiModule` и `AuthAutoUiModule` в `apps/u7-cli/src/main.ts`
- [x] Task: Удалить демо-модуль (`GreetUseCase`, `DemoApiModule`, `DemoUiModule`) из `main.ts`
- [x] Task: Написать интеграционный тест CLI (`apps/u7-cli/src/main.test.ts`) — проверка запуска и команд auth
- [x] Task: Обновить `apps/u7-cli/package.json` — добавить зависимость `@u7/auth`
- [x] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)

## Phase 5: Финализация и проверка качества [x] [checkpoint: 47a8d0a]

- [x] Task: Убедиться, что `packages/auth` собирается (`tsc --noEmit`)
- [x] Task: Убедиться, что `packages/course` собирается после удаления user
- [x] Task: Убедиться, что `apps/u7-cli` собирается
- [x] Task: Запустить полный набор тестов (`bun test`)
- [x] Task: Проверить покрытие кода (`bun test --coverage`), цель >80%
- [x] Task: Запустить линтинг (`bunx biome check --write .`)
- [x] Task: Обновить `README.md` (если нужно) с информацией о новом модуле
- [x] Task: Conductor - User Manual Verification 'Phase 5' (Protocol in workflow.md)
