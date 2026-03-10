# План реализации: Доменная модель и парсинг материалов курсов

## Фаза 1: Проектирование доменной модели (DDD)
- [ ] Task: Создать JSON-схемы (Valibot) для Course, Module, Lesson в функциональном модуле.
    - [ ] Написать юнит-тесты для валидации доменных сущностей (Course, Module, Lesson).
    - [ ] Реализовать схемы в `src/modules/courses/domain/course.schema.ts`.
    - [ ] Убедиться, что схемы проходят тесты и корректно типизируют данные с префиксом `w3c-`.
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Проектирование доменной модели (DDD)' (Protocol in workflow.md)

## Фаза 2: Настройка файловой структуры данных
- [ ] Task: Создать базовую структуру директорий для хранения данных курсов.
    - [ ] Создать директории `data/courses/w3c-html/practice/` и `data/courses/w3c-css/practice/`.
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Настройка файловой структуры данных' (Protocol in workflow.md)

## Фаза 3: Инфраструктура парсера W3Schools (DDD)
- [ ] Task: Реализовать логику загрузки HTML страницы (Infrastructure Layer).
    - [ ] Написать тесты для функции извлечения HTML по URL (с использованием моков).
    - [ ] Реализовать загрузчик в `src/modules/courses/infrastructure/parser/fetcher.ts`.
- [ ] Task: Реализовать логику парсинга Sidebar-меню W3Schools.
    - [ ] Написать тесты на парсинг иерархии (модули, уроки, ссылки, id) из HTML-фрагмента Sidebar.
    - [ ] Реализовать функцию парсинга в `src/modules/courses/infrastructure/parser/w3c-parser.ts`.
- [ ] Task: Реализовать основной скрипт интеграции парсера и хранилища (Application/Infrastructure Layer).
    - [ ] Создать сервис-оркестратор или скрипт в `src/modules/courses/infrastructure/cli/run-parser.ts`.
    - [ ] Связать загрузчик, парсер и сохранение в файловую систему (fs/promises).
    - [ ] Обеспечить сохранение результата в `data/courses/w3c-html/index.json` и `data/courses/w3c-css/index.json` согласно доменной схеме Course.
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Инфраструктура парсера W3Schools (DDD)' (Protocol in workflow.md)