# Plan: Выделение модуля аутентификации и пользователей (auth)

## Phase 1: Создание структуры packages/auth [x] [checkpoint: c75b9b2]

- [x] Task: Создать `packages/auth/package.json` с зависимостями `@u7/core`, `valibot`
- [x] Task: Создать `packages/auth/tsconfig.json`, наследующий базовую конфигурацию
- [x] Task: Создать директории `packages/auth/src/{domain,api,ui}/`
- [x] Task: Создать `packages/auth/src/index.ts` с публичными экспортами
- [ ] Task: Conductor - User Manual Verification 'Phase 1' (Protocol in workflow.md)

## Phase 2: Перенос домена User из packages/course [x] [checkpoint: 3685bc3]

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
- [ ] Task: Conductor - User Manual Verification 'Phase 2' (Protocol in workflow.md)

## Phase 3: Реализация API-модуля auth

- [ ] Task: Создать интерфейс `UserRepository` в `packages/auth/src/api/user-repository.ts`
- [ ] Task: Реализовать `InMemoryUserRepository` в `packages/auth/src/api/user-repository-inmemory.ts`
- [ ] Task: Написать тесты для `InMemoryUserRepository`
- [ ] Task: Создать схему `CreateUserCommandSchema` в `packages/auth/src/api/commands/create-user-command.ts`
- [ ] Task: Реализовать `CreateUserUc` с логикой бутстрапа (первый пользователь = ADMIN)
    - [ ] Subtask: Написать падающие тесты для `CreateUserUc`
    - [ ] Subtask: Реализовать `CreateUserUc`, наследуясь от `@u7/core` `UseCase`
    - [ ] Subtask: Убедиться, что тесты проходят
- [ ] Task: Реализовать `GetUserUc` (по UUID)
    - [ ] Subtask: Написать падающие тесты
    - [ ] Subtask: Реализовать UseCase
    - [ ] Subtask: Убедиться, что тесты проходят
- [ ] Task: Реализовать `ListUsersUc`
    - [ ] Subtask: Написать падающие тесты
    - [ ] Subtask: Реализовать UseCase
    - [ ] Subtask: Убедиться, что тесты проходят
- [ ] Task: Реализовать `GetUserByTelegramIdUc`
    - [ ] Subtask: Написать падающие тесты
    - [ ] Subtask: Реализовать UseCase
    - [ ] Subtask: Убедиться, что тесты проходят
- [ ] Task: Создать `AuthApiModule extends Module` в `packages/auth/src/api/auth-module.ts`
- [ ] Task: Написать интеграционный тест `api/module.test.ts` для `AuthApiModule`
- [ ] Task: Conductor - User Manual Verification 'Phase 3' (Protocol in workflow.md)

## Phase 4: Интеграция в apps/u7-cli

- [ ] Task: Создать `AuthAutoUiModule extends AutoUiModule` в `packages/auth/src/ui/auto-ui/auth-auto-ui-module.ts`
- [ ] Task: Экспортировать `AuthAutoUiModule` из `packages/auth/src/index.ts`
- [ ] Task: Подключить `AuthApiModule` и `AuthAutoUiModule` в `apps/u7-cli/src/main.ts`
- [ ] Task: Удалить демо-модуль (`GreetUseCase`, `DemoApiModule`, `DemoUiModule`) из `main.ts`
- [ ] Task: Написать интеграционный тест CLI (`apps/u7-cli/src/main.test.ts`) — проверка запуска и команд auth
- [ ] Task: Обновить `apps/u7-cli/package.json` — добавить зависимость `@u7/auth`
- [ ] Task: Conductor - User Manual Verification 'Phase 4' (Protocol in workflow.md)

## Phase 5: Финализация и проверка качества

- [ ] Task: Убедиться, что `packages/auth` собирается (`tsc --noEmit`)
- [ ] Task: Убедиться, что `packages/course` собирается после удаления user
- [ ] Task: Убедиться, что `apps/u7-cli` собирается
- [ ] Task: Запустить полный набор тестов (`bun test`)
- [ ] Task: Проверить покрытие кода (`bun test --coverage`), цель >80%
- [ ] Task: Запустить линтинг (`bunx biome check --write .`)
- [ ] Task: Обновить `README.md` (если нужно) с информацией о новом модуле
- [ ] Task: Conductor - User Manual Verification 'Phase 5' (Protocol in workflow.md)
