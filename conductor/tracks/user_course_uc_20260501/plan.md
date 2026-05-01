# Implementation Plan: Реализация функционала пользователя и курсов (domain + api + console)

## Phase 0: Архитектурная документация [checkpoint: 8994f23]
- [x] Task: Создание `docs/architecture.md` [f3fed63]
    - [x] Описать разделения приложения на доменные модули (core, w3school).
    - [x] Каждый модуль имеет метод принимающий команду и распределяющий далее use-case объектам модуля. Метод вызывается внешним контроллером (rest, console, bot);
    - [x] Описать двухслойную архитектуру для бэкенда (domain + api в каждом модуле) и обоснование выбора.
    - [x] Зафиксировать соглашения об именовании (Entity, Schema, Ar, Policy, Record, Output, Command, Uc).
    - [x] Описать устройство доменных модулей: структура, эндпойнты, команды, сценарии использования.
    - [x] Зафиксировать правила межмодульного взаимодействия (фасады для мутаций, прямые импорты для политик).
    - [x] Описать подход к DI (контейнер/реестр в корне модуля, рассмотреть предлагает ли что либо elysia).
    - [x] Добавить диаграмму потока команды (console/bot/rest → command → module → uc → aggregate → repository).
    - [x] Структура команды: `{name: string, user?: uuid, attrs: unknown}`;
- [x] Task: Conductor - User Manual Verification 'Phase 0: Архитектурная документация' (Protocol in workflow.md)

## Phase 1: Агрегат пользователя (UserAr)
- [x] Task: Тесты для UserAr [8bc72a0]
    - [x] Тест: создание UserAr из валидной CreateUserCommand возвращает агрегат с корректным состоянием.
    - [x] Тест: создание UserAr с невалидными данными (пустое имя, невалидный telegramId) — ошибка валидации.
    - [x] Тест: UserAr отдаёт состояние только для чтения, мутация возможна только через методы агрегата.
- [x] Task: Реализация UserAr [8bc72a0]
    - [x] Реализовать класс `UserAr` с приватным состоянием `User`.
    - [x] Реализовать статический метод `UserAr.create(command)` с валидацией через `UserSchema`.
    - [x] Реализовать методы доступа к состоянию (getters).
    - [x] Добиться прохождения тестов.
- [~] Task: Conductor - User Manual Verification 'Phase 1: UserAr' (Protocol in workflow.md)

## Phase 2: Политики и репозитории пользователя
- [ ] Task: Тесты для UserPolicy
    - [ ] Тест: ADMIN может создавать пользователей.
- [ ] Task: Реализация UserPolicy
    - [ ] Реализовать `UserPolicy` с методами `canCreate(actor: User)`, `canRead`, `canEdit`.
    - [ ] Добиться прохождения тестов.
- [ ] Task: Тесты для UserRepository (in-memory)
    - [ ] Тест: сохранение и получение пользователя по uuid.
    - [ ] Тест: получение несуществующего пользователя возвращает undefined.
    - [ ] Тест: сохранение дубликата по uuid — ошибка.
- [ ] Task: Реализация UserRepository
    - [ ] Определить интерфейс `UserRepository`.
    - [ ] Реализовать `InMemoryUserRepository` с Map-хранилищем.
    - [ ] Добиться прохождения тестов.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: UserPolicy и UserRepository' (Protocol in workflow.md)

## Phase 3: Сценарий создания пользователя (UserCreatingUc)
- [ ] Task: Тесты для UserCreatingUc
    - [ ] Тест: успешное создание пользователя администратором.
    - [ ] Тест: создание пользователя студентом — отказ (недостаточно прав).
    - [ ] Тест: bootstrap-режим — создание первого пользователя без проверки прав.
    - [ ] Тест: дубликат telegramId — ошибка.
- [ ] Task: Реализация UserCreatingUc
    - [ ] Реализовать `UserCreatingUc.execute(command)`.
    - [ ] Реализовать логику bootstrap (если репозиторий пуст, проверка прав пропускается).
    - [ ] Интегрировать `UserAr.create`, `UserPolicy`, `UserRepository`.
    - [ ] Добиться прохождения тестов.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: UserCreatingUc' (Protocol in workflow.md)

## Phase 4: Агрегат курса (CourseAr)
- [ ] Task: Тесты для CourseAr
    - [ ] Тест: создание CourseAr из валидной CreateCourseCommand.
    - [ ] Тест: пустой title или description — ошибка валидации.
    - [ ] Тест: невалидный authorId (не UUID) — ошибка валидации.
    - [ ] Тест: CourseAr инкапсулирует состояние, изменение через методы агрегата.
- [ ] Task: Реализация CourseAr
    - [ ] Реализовать класс `CourseAr` с приватным состоянием `Course`.
    - [ ] Реализовать `CourseAr.create(command)` с валидацией через `CourseSchema`.
    - [ ] Реализовать методы `changeTitle`, `changeDescription`.
    - [ ] Добиться прохождения тестов.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: CourseAr' (Protocol in workflow.md)

## Phase 5: CoursePolicy, CourseRepository, CourseCreatingUc
- [ ] Task: Тесты для CoursePolicy
    - [ ] Тест: MENTOR и ADMIN могут создавать курсы.
    - [ ] Тест: STUDENT не может создавать курсы.
- [ ] Task: Реализация CoursePolicy
    - [ ] Реализовать `CoursePolicy` с методами `canCreate`, `canRead`, `canEdit`.
    - [ ] Добиться прохождения тестов.
- [ ] Task: Тесты для CourseRepository (in-memory)
    - [ ] Тест: сохранение и получение курса.
    - [ ] Тест: дубликат uuid — ошибка.
- [ ] Task: Реализация CourseRepository
    - [ ] Определить интерфейс `CourseRepository`.
    - [ ] Реализовать `InMemoryCourseRepository`.
    - [ ] Добиться прохождения тестов.
- [ ] Task: Тесты для CourseCreatingUc
    - [ ] Тест: успешное создание курса ментором.
    - [ ] Тест: создание курса студентом — отказ.
    - [ ] Тест: автор не существует в UserRepository — ошибка.
- [ ] Task: Реализация CourseCreatingUc
    - [ ] Реализовать `CourseCreatingUc.execute(command, policy, courseRepo, userRepo)`.
    - [ ] Проверка существования автора через `UserRepository`.
    - [ ] Добиться прохождения тестов.
- [ ] Task: Conductor - User Manual Verification 'Phase 5: CoursePolicy, CourseRepository, CourseCreatingUc' (Protocol in workflow.md)

## Phase 6: Модуль core — entry point и диспатчер команд
- [ ] Task: Тесты для диспатчера команд
    - [ ] Тест: команда `create-user` направляется в `UserCreatingUc`.
    - [ ] Тест: команда `create-course` направляется в `CourseCreatingUc`.
    - [ ] Тест: неизвестная команда — ошибка.
- [ ] Task: Реализация диспатчера команд
    - [ ] Определить структуру команд: `CreateUserCommand`, `CreateCourseCommand`.
    - [ ] Реализовать диспатчер: принимает команду (plain object), передаёт в соответствующий UC.
    - [ ] Добиться прохождения тестов.
- [ ] Task: Entry point модуля
    - [ ] Реализовать единый entry point модуля `core` — функция, принимающая команду и возвращающая результат.
    - [ ] Связать entry point с диспатчером.
    - [ ] Добиться прохождения тестов.
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Модуль core' (Protocol in workflow.md)

## Phase 7: Консольный интерфейс
- [ ] Task: Консольная команда create-user
    - [ ] Принимать аргументы: `--name`, `--telegram-id`, `--role`.
    - [ ] Формировать `CreateUserCommand`, отправлять в entry point модуля `core`.
    - [ ] Выводить результат (созданный пользователь или ошибка).
- [ ] Task: Консольная команда create-course
    - [ ] Принимать аргументы: `--title`, `--description`, `--author-id`.
    - [ ] Формировать `CreateCourseCommand`, отправлять в entry point модуля `core`.
    - [ ] Выводить результат.
- [ ] Task: Conductor - User Manual Verification 'Phase 7: Консольный интерфейс' (Protocol in workflow.md)

## Phase 8: DI, интеграция и финализация
- [ ] Task: Тесты для DI-контейнера
    - [ ] Тест: регистрация и получение зависимости.
    - [ ] Тест: перезапись зависимости (для тестовых моков).
    - [ ] Тест: получение незарегистрированной зависимости — ошибка.
- [ ] Task: Реализация DI-контейнера
    - [ ] Реализовать легковесный контейнер (Map-based) с методами `register`/`resolve`.
    - [ ] Добиться прохождения тестов.
- [ ] Task: Интеграционные тесты полного сценария
    - [ ] Тест: create-user (bootstrap) → create-course (с проверкой прав) — полный сквозной сценарий.
- [ ] Task: Проверка покрытия и Biome
    - [ ] Запустить `bun test --coverage`, убедиться в покрытии >80%.
    - [ ] Запустить `bunx biome check --write .`, исправить ошибки.
- [ ] Task: Conductor - User Manual Verification 'Phase 8: DI, интеграция и финализация' (Protocol in workflow.md)
