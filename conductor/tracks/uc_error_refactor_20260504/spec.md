# Спецификация: Перепроектирование API ошибок в @u7/core

## Обзор
Заменить разрозненные методы `throw*()` в `UseCase` на единый типизированный метод
`throwError()` с хелперами-фабриками ошибок. Система типов должна гарантировать,
что use-case выбрасывает только ошибки, объявленные в `UcMeta.errors | BaseUcErrors`.

## Функциональные требования

### FR1: Единый метод `throwError` в UseCase
- Удалить методы: `throwNotFound`, `throwConflict`, `throwAccessDenied`,
  `throwBadRequest`, `throwValidation`, `throwInternal`.
- Добавить `protected throwError(error: TMeta["errors"] | BaseUcErrors): never`.
- Система типов должна блокировать передачу ошибки, не входящей в union.

### FR2: Хелперы-фабрики ошибок (дженерики)
- Функции `errNotFound`, `errConflict`, `errAccessDenied`, `errBadRequest`,
  `errValidation`, `errInternal` в `domain/errors/error-helpers.ts`.
- Каждая — дженерик, принимающий `name`, `message`, `payload?` и возвращающий
  типизированный объект ошибки с правильным `kind` и `level`.
- Дженерик должен гарантировать соответствие `name` и `payload` заданному `kind`.

### FR3: Обновление валидации в UseCase
- `validateInput` использует `throwError` с `INPUT_VALIDATION_ERROR`.
- `validateOutput` использует `throwError` с `OUTPUT_VALIDATION_ERROR`.
- `checkAuth` использует `throwError` с `UNAUTHORIZED_ERROR`.

### FR4: Aggregate без изменений
- `throwInvariant` остаётся. Агрегат не знает о доменных ошибках use-case'ов.

### FR5: Обновление Module
- `throwNoCommandFound` заменить на `throwError(errBadRequest(...))` для единообразия.

### FR6: Обновление пакета @u7/user
- Заменить все вызовы `this.throw*()` на `this.throwError(err*(...))`
  в `UserUseCase`, `CreateUserUc`, и других use-case'ах.

## Критерии приёмки
1. `throwError` принимает только имена из `TMeta["errors"] | BaseUcErrors`.
2. Передача несуществующей ошибки вызывает ошибку компиляции TypeScript.
3. Все тесты `packages/core` и `packages/user` проходят.
4. Хелперы корректно создают объекты нужного `kind` и `level`.
5. Дженерики хелперов гарантируют соответствие kind, name и payload.

## За рамками
- Изменение структуры `AppError` / `BaseUcErrors`.
- Изменение `Controller` или `AutoUI`.
