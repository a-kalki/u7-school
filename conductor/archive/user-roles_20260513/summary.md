# Итоговый отчёт: Расширение ролей пользователя

## Цель
Расширить домен `@u7/user` новыми ролями жизненного цикла onboarding и добавить UC управления ролями.

## Выполненные задачи

### Фаза 1: Модель и агрегат
- Добавлены роли `GUEST`, `SUBSCRIBER`, `CANDIDATE` в `Role` enum и `RoleSchema`
- Добавлен метод `UserAr.register(cmd)` — создаёт пользователя с ролью `GUEST`
- Добавлен метод `UserAr.addRole(role)` — идемпотентное добавление роли
- Обновлены тесты `UserAr` (register, addRole)

### Фаза 2: UseCases
- Создан `RegisterUserUc` — регистрация без авторизации, делегирует `UserAr.register`
- Создан `AddRoleToUserUc` — добавление роли, требует прав `ADMIN`, делегирует `UserAr.addRole`
- Написаны тесты для обоих UC
- Обновлён `UserApiModule` — зарегистрированы новые UC
- Добавлен `throwNotFound` в `UserUseCase`

### Фаза 3: Интеграция и финал
- Обновлены экспорты `domain/index.ts`, `api/index.ts`
- Проверено покрытие >80%
- Проверены lint и tsc — чисто

## Изменённые файлы
- `packages/user/src/domain/user/roles.ts`
- `packages/user/src/domain/user/roles.test.ts`
- `packages/user/src/domain/user/a-root.ts`
- `packages/user/src/domain/user/a-root.test.ts`
- `packages/user/src/domain/user/commands/register-user-cmd.ts`
- `packages/user/src/domain/user/commands/add-role-to-user-cmd.ts`
- `packages/user/src/api/user/register-user-uc.ts`
- `packages/user/src/api/user/register-user-uc.test.ts`
- `packages/user/src/api/user/add-role-to-user-uc.ts`
- `packages/user/src/api/user/add-role-to-user-uc.test.ts`
- `packages/user/src/api/user-uc.ts`
- `packages/user/src/api/module.ts`
- `packages/user/src/domain/index.ts`
- `packages/user/src/api/index.ts`

## Архитектурные решения
- `RegisterUserUc` не требует авторизации (`requiresAuth: false`) — пользователь ещё не зарегистрирован
- `AddRoleToUserUc` требует `ADMIN` — управление ролями — привилегированная операция
- Политика `canAddRole` вынесена в `UserPolicy` — только `isAdmin`
- Self-service (actor === target) отклоняется — роли добавляет SYSTEM/бот
- Идемпотентность `addRole` реализована на уровне агрегата

## Архитектурное решение: бот как SYSTEM-пользователь
- Бот регистрируется в `@u7/user` как пользователь с ролью `ADMIN`
- `telegramId` бота получается через `bot.telegram.getMe()`
- Все системные операции (вступление в группу → `SUBSCRIBER`) выполняются через UC от имени бота
- `AddRoleToUserUc` остаётся с `requiresAuth: true`, проверяет `canAddRole`

## Результаты
- 140 тестов, 0 падений
- Покрытие нового кода 100%
- Lint и tsc чистые
