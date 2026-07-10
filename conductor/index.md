# Контекст проекта

## Определение
- [Определение продукта](./product.md)
- [Руководства по продукту](./product-guidelines.md)
- [Технологический стек](./tech-stack.md)

## Процесс разработки (Workflow)
- [Рабочий процесс](./workflow.md)
- [Руководства по стилю кода](./code_styleguides/)
  - [DDD Domain](../.pi/skills/ddd-domain/SKILL.md) — Entity, Aggregate, Repo, Policy, Errors
  - [DDD API](../.pi/skills/ddd-api/SKILL.md) — UseCase, Command, Module, BotUserStory
  - [DDD Infra](../.pi/skills/ddd-infra/SKILL.md) — реализации репозиториев
  - [DDD Naming](../.pi/skills/ddd-naming/SKILL.md) — соглашения об именовании
  - [Границы доменной логики](./code_styleguides/domain-boundaries.md) — ⚠️ ВАЖНО: куда помещать логику, как не допустить утечек между модулями
  - [Тестирование](./code_styleguides/testing.md) — общие правила
  - [Тестирование Telegram-бота](./code_styleguides/bot-test.md) — unit, интеграционные, E2E
- [BotController](./code_styleguides/skills/bot-controller.md) — иерархия контроллеров бота (BotController → U7BotController → доменные/AppController)

## Гайды по контенту курса
- [Наполнение уроков шагами](./guides/lesson-design.md)

## Learning Skills (верификация понимания)
Навыки, которые проверяют, что разработчик понимает внесённые изменения, а не просто принимает диффы.
- [conductor-docs](../.pi/skills/conductor-docs/SKILL.md) — правила создания и ведения документации
- [post-task-debrief](../.pi/skills/post-task-debrief/SKILL.md) — разбор после значимой задачи (domain/api слои)
- [Реестр дебрифингов](../data/debrief/registry.md) — таблица всех разборов
- [Логи дебрифингов](../data/debrief/logs/) — подробные Q&A

## Архитектура эволюции
- [Архитектурная эволюция Stream](./architecture-evolution.md) — объединяющий документ треков Релизов 1–3 (Курс, ЖЦ студента, ContentPath, gating, навигация, витрина, мониторинг)

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
