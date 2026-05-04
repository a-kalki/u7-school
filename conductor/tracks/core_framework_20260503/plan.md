# План реализации: Абстрактный каркас приложения (@u7/core)

## Phase 1: Инициализация пакета и базовые типы ошибок (FR1)

- [x] Task: Создать пакет `packages/core/` с `package.json` (`@u7/core`) [728c6a5]
- [x] Task: Написать тесты для типов и объектов ошибок [c4afe8a]
    - [x] Тест: хелпер создания DomainError работает корректно
    - [x] Тест: хелпер создания ApiError работает корректно
    - [x] Тест: хелпер throwError выбрасывает исключение с правильным объектом ошибки
    - [x] Тест: хелпер fromError восстанавливает объект ошибки из исключения
- [x] Task: Реализовать типы ошибок и хелперы [c4afe8a]
    - [x] `AppError` — базовый тип со свойствами
    - [x] `DomainError` — level: "domain"
    - [x] `ApiError` — level: "api"
    - [x] `throwError(error)` — выбрасывает исключение с сериализованной ошибкой
    - [x] `fromError(exception)` — восстанавливает `ErrorObject` из исключения
    - [x] Тип `AppException` (базовое исключение)
- [x] Task: Интегрировать в корневой workspace и bun link [c4afe8a]
- [x] Task: Регресс-проверка: все тесты проходят [c4afe8a]
- [x] Task: Conductor - User Manual Verification 'Phase 1: errors' (Protocol in workflow.md) [checkpoint: fc1170c]

## Phase 2: UC Meta и Aggregate Meta (FR2, FR3)

- [x] Task: Написать типы Meta [0abcee7]
    - [x] Определить тип UcMeta, ArMeta;
    - [x] Определить болванки абстрактных классов UseCase, Aggregate
- [x] Task: Написать тесты для UseCase [0abcee7]
    - [x] Тест: метод use-case выбрасывает ошибку из объявленного пула
- [x] Task: Написать тесты для Aggregate [0abcee7]
    - [x] Тест: метод агрегата выбрасывает ошибку из объявленного пула
- [x] Task: Реализовать UseCase и Aggregate [0abcee7]
    - [x] Агрегат проходит все тесты и нет ошибок линтера tsc
    - [x] UseCase проходит все тесты и нет ошибок линтера tsc
    - [x] Все работает через встроенный хелпер: `this.throwError(error)` который следит за типами ошибок с meta
- [x] Task: Регресс-проверка: все тесты проходят, типы компилируются [0abcee7]
- [x] Task: Conductor - User Manual Verification 'Phase 2: meta types' (Protocol in workflow.md) [checkpoint: 1be4125]

## Phase 3: Абстрактный класс UseCase (FR4)

- [x] Task: Написать тесты для UseCase [1fbb1ad]
    - [x] Тест: use-case валидирует команду через схему
    - [x] Тест: use-case вызывает execute с command и actorId
    - [x] Тест: use-case имеет доступ к резолверу модуля
    - [x] Тест: use-case выбрасывает ошибку через throwError
- [x] Task: Реализовать абстрактный класс UseCase [1fbb1ad]
    - [x] `UseCase<TMeta, TResolve>` — дженерик по Meta и резолверу
    - [x] Абстрактное свойство `commandSchema` (Valibot)
    - [x] Абстрактный метод `execute(command, actorId?)`
    - [x] Защищённый метод `validate(command)` — валидация через схему, выбрасывает ошибку при провале
    - [x] Защищённый геттер/свойство `resolve` — доступ к резолверу
    - [x] Статическое/экземплярное свойство `commandName` из Meta
- [x] Task: Регресс-проверка: все тесты проходят, типы компилируются [1fbb1ad]
- [x] Task: Conductor - User Manual Verification 'Phase 3: UseCase' (Protocol in workflow.md) [checkpoint: 02a41fc]

## Phase 4: Абстрактный класс Module (FR5)

- [~] Task: Написать тесты для Module
    - [ ] Тест: модуль инициализируется с резолвером
    - [ ] Тест: модуль передаёт резолвер use-case'ам
    - [ ] Тест: модуль находит use-case по имени команды
    - [ ] Тест: модуль передаёт команду в execute нужного use-case
    - [ ] Тест: модуль выбрасывает ошибку badRequest для неизвестной команды
- [ ] Task: Реализовать абстрактный класс Module
    - [ ] `Module<TResolve>` — дженерик по типу резолвера
    - [ ] Абстрактное свойство `useCases: UseCase[]`
    - [ ] Метод `handle(moduleCommand)`:
      - Находит use-case по `commandName`
      - Валидирует команду через схему use-case
      - Вызывает `execute(command, actorId)`
      - Возвращает результат
    - [ ] Конструктор или init() принимает `TResolve`, сохраняет
    - [ ] Метод для OpenAPI-вывода: `getCommands()` — список схем команд модуля с Meta
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
