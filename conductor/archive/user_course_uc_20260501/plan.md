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

## Phase 1: Агрегат пользователя (UserAr) [checkpoint: e4f89b6]
- [x] Task: Тесты для UserAr [8bc72a0]
    - [x] Тест: создание UserAr из валидной CreateUserCommand возвращает агрегат с корректным состоянием.
    - [x] Тест: создание UserAr с невалидными данными (пустое имя, невалидный telegramId) — ошибка валидации.
    - [x] Тест: UserAr отдаёт состояние только для чтения, мутация возможна только через методы агрегата.
- [x] Task: Реализация UserAr [094e3dd]
    - [x] Реализовать класс `UserAr` с приватным состоянием `User`.
    - [x] Реализовать статический метод `UserAr.create(command)` с валидацией через `UserSchema`.
    - [x] Реализовать методы доступа к состоянию (getters).
    - [x] Добиться прохождения тестов.
- [x] Task: Conductor - User Manual Verification 'Phase 1: UserAr' (Protocol in workflow.md)

## Phase 2: Политики и репозитории пользователя [checkpoint: 24cb3d4]
- [x] Task: Тесты для UserPolicy [8b33b3c]
    - [x] Тест: ADMIN может создавать пользователей.
- [x] Task: Реализация UserPolicy [8b33b3c]
    - [x] Реализовать `UserPolicy` с методами `canCreate(actor: User)`, `canRead`, `canEdit`.
    - [x] Добиться прохождения тестов.
- [x] Task: Тесты для UserRepository (in-memory) [8b33b3c]
    - [x] Тест: сохранение и получение пользователя по uuid.
    - [x] Тест: получение несуществующего пользователя возвращает undefined.
    - [x] Тест: сохранение дубликата по uuid — ошибка.
- [x] Task: Реализация UserRepository
    - [x] Определить интерфейс `UserRepository`.
    - [x] Реализовать `InMemoryUserRepository` с Map-хранилищем.
    - [x] Добиться прохождения тестов.
- [x] Task: Conductor - User Manual Verification 'Phase 2: UserPolicy и UserRepository' (Protocol in workflow.md)

## Phase 3: Сценарий создания пользователя (UserCreatingUc) [checkpoint: 661b0fd]
- [x] Task: Тесты для UserCreatingUc [16eaa45]
    - [x] Тест: успешное создание пользователя администратором.
    - [x] Тест: создание пользователя студентом — отказ (недостаточно прав).
    - [x] Тест: bootstrap-режим — создание первого пользователя без проверки прав.
    - [x] Тест: дубликат telegramId — ошибка.
- [x] Task: Реализация UserCreatingUc
    - [x] Реализовать `UserCreatingUc.execute(command)`.
    - [x] Реализовать логику bootstrap (если репозиторий пуст, проверка прав пропускается).
    - [x] Интегрировать `UserAr.create`, `UserPolicy`, `UserRepository`.
    - [x] Добиться прохождения тестов.
- [x] Task: Conductor - User Manual Verification 'Phase 3: UserCreatingUc' (Protocol in workflow.md)

## Phase 4: Агрегат курса (CourseAr) [checkpoint: 8ff9fea]
- [x] Task: Тесты для CourseAr
    - [x] Тест: создание CourseAr из валидной CreateCourseCommand.
    - [x] Тест: пустой title или description — ошибка валидации.
    - [x] Тест: невалидный authorId (не UUID) — ошибка валидации.
    - [x] Тест: CourseAr инкапсулирует состояние, изменение через методы агрегата.
- [x] Task: Реализация CourseAr
    - [x] Реализовать класс `CourseAr` с приватным состоянием `Course`.
    - [x] Реализовать `CourseAr.create(command)` с валидацией через `CourseSchema`.
    - [x] Реализовать методы `changeTitle`, `changeDescription`.
    - [x] Добиться прохождения тестов.
- [x] Task: Conductor - User Manual Verification 'Phase 4: CourseAr' (Protocol in workflow.md)

## Phase 5: CoursePolicy, CourseRepository, CourseCreatingUc [checkpoint: e88ae6d]
- [x] Task: Тесты для CoursePolicy
    - [x] Тест: MENTOR и ADMIN могут создавать курсы.
    - [x] Тест: STUDENT не может создавать курсы.
- [x] Task: Реализация CoursePolicy
    - [x] Реализовать `CoursePolicy` с методами `canCreate`, `canRead`, `canEdit`.
    - [x] Добиться прохождения тестов.
- [x] Task: Тесты для CourseRepository (in-memory)
    - [x] Тест: сохранение и получение курса.
    - [x] Тест: дубликат uuid — ошибка.
- [x] Task: Реализация CourseRepository
    - [x] Определить интерфейс `CourseRepository`.
    - [x] Реализовать `InMemoryCourseRepository`.
    - [x] Добиться прохождения тестов.
- [x] Task: Тесты для CourseCreatingUc
    - [x] Тест: успешное создание курса ментором.
    - [x] Тест: создание курса студентом — отказ.
    - [x] Тест: автор не существует в UserRepository — ошибка.
- [x] Task: Реализация CourseCreatingUc
    - [x] Реализовать `CourseCreatingUc.execute(command, policy, courseRepo, userRepo)`.
    - [x] Проверка существования автора через `UserRepository`.
    - [x] Добиться прохождения тестов.
- [x] Task: Conductor - User Manual Verification 'Phase 5: CoursePolicy, CourseRepository, CourseCreatingUc' (Protocol in workflow.md)

## Phase 6: Модуль core — entry point и диспатчер команд [checkpoint: 488fe4d]
- [x] Task: Тесты для диспатчера команд
    - [x] Тест: команда `create-user` направляется в `UserCreatingUc`.
    - [x] Тест: команда `create-course` направляется в `CourseCreatingUc`.
    - [x] Тест: неизвестная команда — ошибка.
- [x] Task: Реализация диспатчера команд
    - [x] Определить структуру команд: `CreateUserCommand`, `CreateCourseCommand`.
    - [x] Реализовать диспатчер: принимает команду (plain object), передаёт в соответствующий UC.
    - [x] Добиться прохождения тестов.
- [x] Task: Entry point модуля
    - [x] Реализовать единый entry point модуля `core` — класс, принимающая команду и возвращающая результат.
    - [x] Связать entry point с диспатчером.
    - [x] Добиться прохождения тестов.
- [x] Task: Conductor - User Manual Verification 'Phase 6: Модуль core' (Protocol in workflow.md)

## Phase 7: Консольный интерфейс [checkpoint: e1ff22f]
- [x] Task: Консольная команда create-user
    - [x] Принимать аргументы: `--name`, `--telegram-id`, `--role`.
    - [x] Формировать `CreateUserCommand`, отправлять в entry point модуля `core`.
    - [x] Выводить результат (созданный пользователь или ошибка).
- [x] Task: Консольная команда create-course
    - [x] Принимать аргументы: `--title`, `--description`, `--author-id`.
    - [x] Формировать `CreateCourseCommand`, отправлять в entry point модуля `core`.
    - [x] Выводить результат.
- [x] Task: Conductor - User Manual Verification 'Phase 7: Консольный интерфейс' (Protocol in workflow.md)

## Phase 8: DI, интеграция и финализация [checkpoint: 00f46b7]
- [x] Task: Тесты для DI-контейнера
    - [x] Тест: регистрация и получение зависимости.
    - [x] Тест: перезапись зависимости (для тестовых моков).
    - [x] Тест: получение незарегистрированной зависимости — ошибка.
- [x] Task: Реализация DI-контейнера
    - [x] Реализовать легковесный контейнер (Map-based) с методами `register`/`resolve`.
    - [x] Добиться прохождения тестов.
- [x] Task: Интеграционные тесты полного сценария
    - [x] Тест: create-user (bootstrap) → create-course (с проверкой прав) — полный сквозной сценарий.
- [x] Task: Проверка покрытия и Biome
    - [x] Запустить `bun test --coverage`, убедиться в покрытии >80%.
    - [x] Запустить `bunx biome check --write .`, исправить ошибки.
- [x] Task: Conductor - User Manual Verification 'Phase 8: DI, интеграция и финализация' (Protocol in workflow.md)
