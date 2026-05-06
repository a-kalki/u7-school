# Track: Выделение модуля аутентификации и пользователей (auth)

## Обзор
Цель — выделить агрегат `User` и связанную функциональность из `packages/course` в самостоятельный пакет `packages/auth` на базе фреймворка `@u7/core`. Модуль должен быть интегрирован в приложение `apps/u7-cli` и полностью работоспособен через Auto-UI.

## Контекст
- Агрегат `User` и команда `CreateUserCommand` сейчас находятся в `packages/course`.
- Новый пакет `packages/auth` станет каноническим местом для домена пользователей.
- `packages/course` более не будет содержать домен пользователей.

## Функциональные требования

### Перенос домена
1. Агрегат `UserAr` перенесён из `packages/course/src/domain/user` в `packages/auth/src/domain/user`.
2. Перенесены сущности и политики: `User`, `Role`, `UserPolicy`.
3. Удалены оригинальные файлы из `packages/course/src/domain/user`.
4. Обновлены импорты в `packages/course` (если требовались).

### API-модуль на базе @u7/core
1. Создан `AuthApiModule extends Module` в `packages/auth/src/api/auth-module.ts`.
2. Реализованы UseCase:
   - `CreateUserUc` — создание пользователя. При пустом репозитории первый созданный пользователь автоматически получает роль `ADMIN` (бутстрап).
   - `GetUserUc` — получение пользователя по `uuid`.
   - `ListUsersUc` — список всех пользователей.
   - `GetUserByTelegramIdUc` — поиск пользователя по `telegramId`.
3. Каждый UseCase наследуется от `@u7/core` `UseCase`, имеет `commandName`, `inputSchema`, `outputSchema`, `aggregateName`.
4. Репозиторий: определён интерфейс `UserRepository`, реализован `InMemoryUserRepository`.
5. Репозиторий передаётся в `AuthApiModule` через `deps`.

### CLI-интеграция
1. Создан `AuthUiModule extends AutoUiModule` в `packages/auth/src/ui/auto-ui/auth-ui-module.ts`.
2. `apps/u7-cli` подключает `AuthApiModule` и `AuthUiModule` вместо демо-модуля.
3. При запуске CLI пользователь может:
   - Создать пользователя (включая автоматический бутстрап первого админа).
   - Получить пользователя по UUID.
   - Получить пользователя по Telegram ID.
   - Список всех пользователей.

### Тестирование
1. Покрытие unit-тестами для домена (`UserAr`, `Role`, `UserPolicy`).
2. Покрытие интеграционными тестами для API-модуля (UseCase через `module.handle`).
3. Покрытие интеграционным тестом для CLI (`apps/u7-cli` с `AuthUiModule`).

## Нефункциональные требования
- Соответствие code styleguides проекта (`conductor/code_styleguides/`).
- Сборка без ошибок TypeScript (`tsc --noEmit`).
- Все тесты проходят (`bun test`).

## Критерии приёмки
- [ ] `packages/auth` собирается и проходит тесты.
- [ ] `packages/course` больше не содержит `src/domain/user/`.
- [ ] `apps/u7-cli` использует `auth` модуль и позволяет создавать/просматривать пользователей.
- [ ] Первый созданный пользователь автоматически ADMIN.
- [ ] Код проходит линтинг Biome.

## За рамками (Out of Scope)
- Персистентное хранение (файл/БД) — in-memory только.
- Аутентификация по паролю / токенам / сессиям.
- Удаление или редактирование пользователей.
- Авторизация в UseCase (`requiresAuth` всегда `false` в этом треке).
