# План реализации: Перепроектирование API ошибок в @u7/core

## Фаза 1: Хелперы-фабрики ошибок

- [x] Task: Создать дженерик-фабрики ошибок в `domain/errors/error-helpers.ts` `[f93fec8]`
    - [x] Написать тесты на `errNotFound`, `errConflict`, `errAccessDenied`, `errBadRequest`, `errValidation`, `errInternal` (Red)
    - [x] Реализовать фабрики как дженерик-функции, возвращающие типизированный объект ошибки (Green)
    - [x] Убедиться, что каждая фабрика возвращает правильный `kind` и `level` (Refactor)
- [x] Task: Проверить покрытие тестами хелперов (`bun test --coverage`) `[d6879a3]`
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Хелперы-фабрики ошибок' (Protocol in workflow.md)

## Фаза 2: Перепроектирование UseCase

- [ ] Task: Заменить `throw*()` на единый `throwError()` в `UseCase`
    - [ ] Написать тесты на новый метод `throwError` (Red)
    - [ ] Удалить `throwNotFound`, `throwConflict`, `throwAccessDenied`, `throwBadRequest`, `throwValidation`, `throwInternal` (Green)
    - [ ] Реализовать `throwError(error: TMeta["errors"] | BaseUcErrors): never` (Green)
    - [ ] Обновить `validateInput`, `validateOutput`, `checkAuth` на использование `throwError` (Green)
    - [ ] Проверить, что TypeScript блокирует передачу ошибок не из union (Green)
- [ ] Task: Обновить `Module.throwNoCommandFound` на использование фабрики `errBadRequest`
- [ ] Task: Обновить тесты `UseCase` и `Module` под новый API
- [ ] Task: Проверить покрытие тестами (`bun test --coverage`)
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Перепроектирование UseCase' (Protocol in workflow.md)

## Фаза 3: Обновление пакета @u7/user

- [ ] Task: Мигрировать `UserUseCase` на `throwError` + фабрики
    - [ ] Заменить `this.throwNotFound(...)` на `this.throwError(errNotFound(...))`
- [ ] Task: Мигрировать `CreateUserUc` на новый API
    - [ ] Заменить `this.throwAccessDenied(...)` и `this.throwConflict(...)` на `this.throwError(err*(...))`
- [ ] Task: Проверить остальные use-case'ы user-пакета на наличие вызовов `throw*()`
- [ ] Task: Запустить все тесты пакета `user` и убедиться, что они проходят
- [ ] Task: Проверить покрытие тестами (`bun test --coverage --filter @u7/user`)
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Обновление пакета @u7/user' (Protocol in workflow.md)
