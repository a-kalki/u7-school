# План реализации: Перепроектирование API ошибок в @u7/core

## Фаза 1: Хелперы-фабрики ошибок [checkpoint: e782b99]

- [x] Task: Создать дженерик-фабрики ошибок в `domain/errors/error-helpers.ts` `[f93fec8]`
    - [x] Написать тесты на `errNotFound`, `errConflict`, `errAccessDenied`, `errBadRequest`, `errValidation`, `errInternal` (Red)
    - [x] Реализовать фабрики как дженерик-функции, возвращающие типизированный объект ошибки (Green)
    - [x] Убедиться, что каждая фабрика возвращает правильный `kind` и `level` (Refactor)
- [x] Task: Проверить покрытие тестами хелперов (`bun test --coverage`) `[d6879a3]`
- [x] Task: Conductor - User Manual Verification 'Фаза 1: Хелперы-фабрики ошибок' (Protocol in workflow.md) `[e782b99]`

## Фаза 2: Перепроектирование UseCase [checkpoint: 4e72177]

- [x] Task: Заменить `throw*()` на единый `throwError()` в `UseCase` `[9421f05]`
    - [x] Написать тесты на новый метод `throwError` (Red)
    - [x] Удалить `throwNotFound`, `throwConflict`, `throwAccessDenied`, `throwBadRequest`, `throwValidation`, `throwInternal` (Green)
    - [x] Реализовать `throwError(error: TMeta["errors"] | BaseUcErrors): never` (Green)
    - [x] Обновить `validateInput`, `validateOutput`, `checkAuth` на использование `throwError` (Green)
    - [x] Проверить, что TypeScript блокирует передачу ошибок не из union (Green)
- [x] Task: Обновить `Module.throwNoCommandFound` на использование фабрики `errBadRequest` `[9421f05]`
- [x] Task: Обновить тесты `UseCase` и `Module` под новый API `[9421f05]`
- [x] Task: Проверить покрытие тестами (`bun test --coverage`) `[9421f05]`
- [x] Task: Conductor - User Manual Verification 'Фаза 2: Перепроектирование UseCase' (Protocol in workflow.md) `[4e72177]`

## Фаза 3: Обновление пакета @u7/user

- [ ] Task: Мигрировать `UserUseCase` на `throwError` + фабрики
    - [ ] Заменить `this.throwNotFound(...)` на `this.throwError(errNotFound(...))`
- [ ] Task: Мигрировать `CreateUserUc` на новый API
    - [ ] Заменить `this.throwAccessDenied(...)` и `this.throwConflict(...)` на `this.throwError(err*(...))`
- [ ] Task: Проверить остальные use-case'ы user-пакета на наличие вызовов `throw*()`
- [ ] Task: Запустить все тесты пакета `user` и убедиться, что они проходят
- [ ] Task: Проверить покрытие тестами (`bun test --coverage --filter @u7/user`)
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Обновление пакета @u7/user' (Protocol in workflow.md)
