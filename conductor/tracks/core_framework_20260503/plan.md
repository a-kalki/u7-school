# План реализации: Абстрактный каркас приложения (@u7/core)

## Phase 1: Инициализация пакета и базовые типы ошибок (FR1)

- [ ] Task: Создать пакет `packages/core/` с `package.json` (`@u7/core`)
- [ ] Task: Написать тесты для типов и объектов ошибок
    - [ ] Тест: DomainErrorObject создаётся корректно
    - [ ] Тест: ApiErrorObject создаётся корректно
    - [ ] Тест: хелпер throwError выбрасывает исключение с правильным объектом ошибки
    - [ ] Тест: хелпер fromError восстанавливает объект ошибки из исключения
- [ ] Task: Реализовать типы ошибок и хелперы
    - [ ] `ErrorObject` — базовый тип: `{ level, code, message, payload? }`
    - [ ] `DomainErrorObject` — level: "domain"
    - [ ] `ApiErrorObject` — level: "api"
    - [ ] `throwError(error)` — выбрасывает исключение с сериализованной ошибкой
    - [ ] `fromError(exception)` — восстанавливает `ErrorObject` из исключения
    - [ ] Тип `AppException` (базовое исключение)
- [ ] Task: Интегрировать в корневой workspace и bun link
- [ ] Task: Регресс-проверка: все тесты проходят
- [ ] Task: Conductor - User Manual Verification 'Phase 1: errors' (Protocol in workflow.md)

## Phase 2: UC Meta и Aggregate Meta (FR2, FR3)

- [ ] Task: Написать тесты для UseCaseMeta
    - [ ] Тест: Meta компилируется с input, output, errors, commandName
    - [ ] Тест: TypeScript проверяет, что errors соответствуют объявленным
- [ ] Task: Написать тесты для AggregateMeta
    - [ ] Тест: агрегат объявляет пул ошибок в Meta
    - [ ] Тест: метод агрегата выбрасывает ошибку из объявленного пула
    - [ ] Тест: ошибка агрегата включается в UC Meta
- [ ] Task: Реализовать UseCaseMeta и AggregateMeta
    - [ ] `UseCaseMeta<TInput, TOutput, TErrors, TCommandName>` — дженерик-тип
    - [ ] `AggregateMeta<TErrors>` — дженерик-тип для пула ошибок
    - [ ] Встроенный хелпер для агрегата: `this.throwError(error)` (через базовый класс или миксин)
- [ ] Task: Регресс-проверка: все тесты проходят, типы компилируются
- [ ] Task: Conductor - User Manual Verification 'Phase 2: meta types' (Protocol in workflow.md)

## Phase 3: Абстрактный класс UseCase (FR4)

- [ ] Task: Написать тесты для UseCase
    - [ ] Тест: use-case валидирует команду через схему
    - [ ] Тест: use-case вызывает execute с command и actorId
    - [ ] Тест: use-case имеет доступ к резолверу модуля
    - [ ] Тест: use-case выбрасывает ошибку через throwError
    - [ ] Тест: use-case с пустым резолвером (undefined)
- [ ] Task: Реализовать абстрактный класс UseCase
    - [ ] `UseCase<TMeta, TResolve>` — дженерик по Meta и резолверу
    - [ ] Абстрактное свойство `commandSchema` (Valibot)
    - [ ] Абстрактный метод `execute(command, actorId?)`
    - [ ] Защищённый метод `validate(command)` — валидация через схему, выбрасывает ошибку при провале
    - [ ] Защищённый геттер/свойство `resolve` — доступ к резолверу
    - [ ] Метод `throwError(error)` — хелпер выбрасывания
    - [ ] Статическое/экземплярное свойство `commandName` из Meta
- [ ] Task: Регресс-проверка: все тесты проходят, типы компилируются
- [ ] Task: Conductor - User Manual Verification 'Phase 3: UseCase' (Protocol in workflow.md)

## Phase 4: Абстрактный класс Module (FR5)

- [ ] Task: Написать тесты для Module
    - [ ] Тест: модуль инициализируется с резолвером
    - [ ] Тест: модуль находит use-case по имени команды
    - [ ] Тест: модуль передаёт команду в execute нужного use-case
    - [ ] Тест: модуль выбрасывает ошибку для неизвестной команды
    - [ ] Тест: модуль передаёт резолвер use-case'ам
- [ ] Task: Реализовать абстрактный класс Module
    - [ ] `Module<TResolve>` — дженерик по типу резолвера
    - [ ] Абстрактное свойство `useCases: UseCase[]`
    - [ ] Метод `handle(moduleCommand)`:
      - Находит use-case по `commandName`
      - Валидирует команду через схему use-case
      - Вызывает `execute(command, actorId)`
      - Возвращает результат
    - [ ] Конструктор принимает `TResolve`, сохраняет
    - [ ] Метод для OpenAPI-вывода: `getCommands()` — список команд модуля с Meta
- [ ] Task: Регресс-проверка: все тесты проходят
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Module' (Protocol in workflow.md)

## Phase 5: CLI-контроллер с обработкой ошибок (FR6)

- [ ] Task: Написать тесты для CLI-контроллера
    - [ ] Тест: контроллер создаёт ModuleCommand из CLI-аргументов
    - [ ] Тест: контроллер передаёт команду модулю
    - [ ] Тест: контроллер ловит DomainError → JSON-ошибка
    - [ ] Тест: контроллер ловит ApiError → JSON-ошибка
    - [ ] Тест: контроллер ловит неизвестное исключение → 500
- [ ] Task: Реализовать CLI-контроллер
    - [ ] Функция `createCliController(module)` — фабрика
    - [ ] `run(args: string[])` — парсинг CLI-аргументов в ModuleCommand
    - [ ] Обработчик ошибок: ловит исключения, `fromError()` → JSON-ответ
    - [ ] Успешный ответ: `{ success: true, data: result }`
    - [ ] Ошибочный ответ: `{ success: false, error: { code, message, payload? } }`
- [ ] Task: Регресс-проверка: все тесты проходят
- [ ] Task: Conductor - User Manual Verification 'Phase 5: CLI-controller' (Protocol in workflow.md)

## Phase 6: Интеграция — демо-модуль с тестами (FR7)

- [ ] Task: Написать интеграционные тесты
    - [ ] Тест: полный сценарий — CLI → Module → UseCase → ответ
    - [ ] Тест: полный сценарий с ошибкой агрегата → контроллер ловит
    - [ ] Тест: demo-модуль с getCommands() возвращает список команд
- [ ] Task: Создать demo-модуль для проверки каркаса
    - [ ] DemoCreateUserCommand, DemoCreateUserUC, DemoModule
    - [ ] DemoUserAr с AggregateMeta (пул ошибок: "invalid_name")
    - [ ] Интеграция через CLI-контроллер
- [ ] Task: Регресс-проверка: все тесты проходят, все сценарии работают
- [ ] Task: Conductor - User Manual Verification 'Phase 6: integration' (Protocol in workflow.md)
