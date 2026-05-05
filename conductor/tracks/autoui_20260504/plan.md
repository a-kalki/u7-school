# План реализации: Архитектура Auto-UI

## Фаза 1: Базовые абстракции UI (App и Module) [checkpoint: 3795825]
- [x] Task: Разработать механизм загрузки и парсинга `about.md` для извлечения описания
    - [x] Написать модульные тесты для парсера файлов Markdown
    - [x] Реализовать чтение `about.md` (с учетом путей инициализации)
- [x] Task: Создать абстрактный класс `UIModule`
    - [x] Написать тесты для `UIModule` (загрузка `about.md` модуля, привязка к `api.Module`, получение списка UseCase)
    - [x] Реализовать `UIModule`
- [x] Task: Создать абстрактный класс `UIApp`
    - [x] Написать тесты для `UIApp` (регистрация `UIModule`, загрузка `about.md` уровня приложения)
    - [x] Реализовать `UIApp`
- [x] Task: Conductor - User Manual Verification 'Фаза 1: Базовые абстракции UI (App и Module)' (Protocol in workflow.md)

## Фаза 2: Система навигации (CommandParser & Intent)
- [x] Task: Создать абстракции намерений (UIIntent) и CommandParser (бывший Router)
    - [x] Написать тесты для парсера команд (парсинг `/app`, `/<module>`, многострочного ввода для execute)
    - [x] Реализовать парсер команд, не привязанный к логике приложения

## Фаза 3: Реализация Auto-UI (Оркестратор и Модуль) [checkpoint: a98c95a]
- [x] Task: Создать `AutoUiApp` (перевалочный пункт / Оркестратор)
    - [x] Написать тесты для `AutoUiApp.handleInput()` (маршрутизация intent'ов, генерация приветствий)
    - [x] Реализовать `AutoUiApp`
- [x] Task: Создать `AutoUiModule`
    - [x] Написать тесты (вычисление агрегатов, генерация меню, маппинг строкового payload в JSON)
    - [x] Реализовать `AutoUiModule` с привязкой к `ApiModule`
- [x] Task: Интеграция с консолью
    - [x] Реализовать `AutoUiConsoleController` для REPL
    - [x] Написать интеграционный тест для `AutoUiApp` + `AutoUiModule`
    - [x] Перенести CLI в `apps/u7-cli` и создать рабочее демо
- [x] Task: Conductor - User Manual Verification 'Фаза 3: Реализация Auto-UI' (Protocol in workflow.md)
