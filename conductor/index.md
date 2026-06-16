# Контекст проекта

## Определение
- [Определение продукта](./product.md)
- [Руководства по продукту](./product-guidelines.md)
- [Технологический стек](./tech-stack.md)

## Процесс разработки (Workflow)
- [Рабочий процесс](./workflow.md)
- [Руководства по стилю кода](./code_styleguides/)
  - [DDD Domain](../.pi/skills/ddd-domain/SKILL.md) — Entity, Aggregate, Repo, Policy, Errors
  - [DDD API](../.pi/skills/ddd-api/SKILL.md) — UseCase, Command, Module
  - [DDD Infra](../.pi/skills/ddd-infra/SKILL.md) — реализации репозиториев
  - [DDD Naming](../.pi/skills/ddd-naming/SKILL.md) — соглашения об именовании
  - [Тестирование](./code_styleguides/testing.md) — общие правила
  - [E2E-тестирование](./code_styleguides/skills/bot-e2e-testing.md) — архитектура e2e-тестов бота

## Гайды по контенту курса
- [Наполнение уроков шагами](./guides/lesson-design.md)

## Learning Skills (верификация понимания)
Навыки, которые проверяют, что разработчик понимает внесённые изменения, а не просто принимает диффы.
- [post-task-debrief](../.pi/skills/post-task-debrief/SKILL.md) — разбор после значимой задачи (domain/api слои)
- [arch-boundary-check](../.pi/skills/arch-boundary-check/SKILL.md) — проверка архитектурных границ при сквозных изменениях
- [content-integrity-check](../.pi/skills/content-integrity-check/SKILL.md) — проверка целостности учебного контента
- [Реестр дебрифингов](../data/debrief/registry.md) — таблица всех разборов
- [Логи дебрифингов](../data/debrief/logs/) — подробные Q&A

## Управление
- [Реестр треков](./tracks.md)
- [Директория треков](./tracks/)

## Когда обновлять документацию?
Документация в папке `conductor/` является "живой". Её необходимо обновлять в следующих случаях:
- **[Определение продукта](./product.md)**: при изменении видения, целевой аудитории или ключевых функций.
- **[Технологический стек](./tech-stack.md)**: при добавлении новых библиотек, фреймворков или изменении версии основных инструментов.
- **[Рабочий процесс](./workflow.md)**: при изменении процедур разработки, тестирования или развертывания.
- **[Styleguides](./code_styleguides/)**: при введении новых архитектурных паттернов или соглашений по коду.
- **[Реестр треков](./tracks.md)**: при создании нового трека или изменении статуса существующего.
