# u7-school

Образовательная платформа, направленная на подготовку специалистов через курсы и личное менторство.

## О проекте

Проект представляет собой универсальную платформу для обучения предоставляющую необходимую инфраструктуру для менторов и студентов.

## Структура проекта

Проект организован в виде монорепозитория:

### Приложения (`apps/`)
- **[u7-bot](./apps/u7-bot/)**: Основной Telegram-бот образовательной платформы. Обеспечивает интерфейс взаимодействия со студентами, управление обучением и доступ к учебным материалам.

### Пакеты (`packages/`)
- **[core](./packages/core/)**: Фреймворк-ядро (DDD-абстракции: Aggregate, UseCase, Module, Auto-UI).
- **[user](./packages/user/)**: Модуль пользователей. Агрегат `User`, репозиторий, UseCase (user.create, user.get, user.list, user.get-by-telegram-id) с автоматическим бутстрапом первого админа.
- **[course](./packages/course/)**: Домен курсов (Course, Module, Lesson, Project) и сценарии их создания.
- **[w3school](./packages/w3school/)**: Инструментарий для обработки контента W3Schools. Отвечает за парсинг HTML-исходников в Markdown, генерацию `syllabus.json` и ИИ-обогащение уроков (генерация кратких сводок через Gemini API).

## Инструменты разработки

Для управления жизненным циклом проекта, планирования и реализации задач используется методология [Conductor](https://github.com/epm-dev-kalki/conductor). С полной документацией проекта можно ознакомиться в папке `./conductor/`.

## Документация и руководства

Основные архитектурные принципы и соглашения по разработке:
- [Общая архитектура](./conductor/code_styleguides/architecture.md)
- [Принципы DDD (Aggregate, Schema, Policy)](./conductor/code_styleguides/ddd.md)
- [Backend-слой (UseCase, Module)](./conductor/code_styleguides/api.md)
- [Обработка ошибок и исключений](./conductor/code_styleguides/errors.md)
- [Соглашения по именованию](./conductor/code_styleguides/naming.md)
- [Правила тестирования (TDD, пирамида тестов)](./conductor/code_styleguides/testing.md)
- [Межмодульное взаимодействие и DI](./conductor/code_styleguides/integration.md)
- [TypeScript Styleguide](./conductor/code_styleguides/typescript.md)

## Установка и запуск

Для установки зависимостей:

```bash
bun install
```

Для запуска проекта: `bun run index.ts`.

