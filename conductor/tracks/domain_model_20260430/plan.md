# Implementation Plan: Разработка доменной модели платформы (модуль core)

## Phase 1: Инициализация модуля packages/core `[checkpoint: 3420733]`
- [x] Task: Создание структуры пакета `packages/core` `[9540497]`
    - [x] Инициализировать `package.json` с базовыми настройками.
    - [x] Настроить `tsconfig.json` (наследование от корня).
    - [x] Установить зависимость `valibot`.
- [x] Task: Настройка инфраструктуры тестирования
    - [x] Настроить тестовый скрипт в `package.json` (используя Bun test).
- [x] Task: Conductor - User Manual Verification 'Phase 1: Инициализация' (Protocol in workflow.md)

## Phase 2: Модель Пользователя (User) `[checkpoint: 321ad2a]`
- [x] Task: Определение ролей (Roles) `[d533795]`
    - [x] Написать тест для Enum/типа ролей (STUDENT, MENTOR, ADMIN).
    - [x] Реализовать Enum/тип ролей.
- [x] Task: Схема Пользователя (User Schema) `[514d8c8]`
    - [x] Написать падающие тесты для схемы User (валидация ID, email, ролей).
    - [x] Реализовать схему User с использованием Valibot.
    - [x] Добиться прохождения тестов.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Модель Пользователя' (Protocol in workflow.md)

## Phase 3: Базовая структура Курса и Модуля
- [x] Task: Схема Курса (Course Schema) `[34fa4e7]`
    - [x] Написать тесты для структуры курса (название, описание, связь с автором).
    - [x] Реализовать схему Course.
- [ ] Task: Схема Модуля (Module Schema)
    - [ ] Написать тесты для исключающей логики Модуля (либо проекты, либо уроки).
    - [ ] Реализовать схему Module с использованием `v.union` или аналогичного механизма Valibot.
- [ ] Task: Схема Проекта (Project Schema)
    - [ ] Написать базовые тесты для метаданных проекта.
    - [ ] Реализовать схему Project.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Структура Курса' (Protocol in workflow.md)

## Phase 4: Уроки и Шаги
- [ ] Task: Схема Файла (File Metadata)
    - [ ] Написать тесты для валидации метаданных файлов (URL, типы).
    - [ ] Реализовать схему File.
- [ ] Task: Схема Шага (Step Schema)
    - [ ] Написать тесты для типов контента (Text, Code).
    - [ ] Реализовать схему Step.
- [ ] Task: Схема Урока (Lesson Schema)
    - [ ] Написать тесты для композиции урока (шаги + файлы).
    - [ ] Реализовать схему Lesson.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Уроки и Шаги' (Protocol in workflow.md)

## Phase 5: Финализация и Экспорт
- [ ] Task: Индексный файл (Public API)
    - [ ] Написать тесты на корректность экспорта всех типов и схем.
    - [ ] Реализовать `src/index.ts` с экспортами.
- [ ] Task: Проверка линтинга и форматов
    - [ ] Запустить `biome check --write .`
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Финализация' (Protocol in workflow.md)
