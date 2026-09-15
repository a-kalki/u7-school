# Контекст проекта

## Определение
- [Определение продукта](./product.md)
- [Руководства по продукту](./product-guidelines.md)
- [Технологический стек](./tech-stack.md)

## Процесс разработки (Workflow)
- [Roadmap — порядок работ](./roadmap.md) — **текущая последовательность инициатив и статус**; детальные документы инициатив — в папке [roadmap/](./roadmap/)
- [Рабочий процесс](./workflow.md)
- [conductor-docs](../.pi/skills/conductor-docs/SKILL.md) — правила создания и ведения документации в conductor/
- [Руководства по стилю кода](./code_styleguides/)
  - [DDD Domain](../.pi/skills/ddd-domain/SKILL.md) — Entity, Aggregate, Repo, Policy, Errors
  - [DDD API](../.pi/skills/ddd-api/SKILL.md) — UseCase, Command, Module, BotUiStory
  - [DDD Infra](../.pi/skills/ddd-infra/SKILL.md) — реализации репозиториев
  - [DDD Naming](../.pi/skills/ddd-naming/SKILL.md) — соглашения об именовании
  - [EventReaction (ER)](./code_styleguides/skills/event-reaction.md) — реакция модуля на доменное событие
  - [Job (периодическое задание)](./code_styleguides/skills/job.md) — фоновая задача планировщика
  - [Границы доменной логики](./code_styleguides/domain-boundaries.md) — ⚠️ ВАЖНО: куда помещать логику, как не допустить утечек между модулями
  - [Тестирование](./code_styleguides/testing.md) — общие правила
  - [Тестирование Telegram-бота](./code_styleguides/bot-test.md) — unit, интеграционные, E2E
- [Архитектура Telegram-бота](./code_styleguides/bot-architecture.md) — слои, объекты, поток данных (Grammy → BotTransport → UiApp → Controller → Story)
- [BotController](./code_styleguides/skills/bot-controller.md) — иерархия контроллеров бота (BotController → U7BotController → доменные/AppController)

## Гайды по контенту курса
- [Наполнение уроков шагами](./guides/lesson-design.md)
- [Bot-UI «Диалог и Экран» — концепция и инструкция](./guides/bot-ui-concept.md) — краткая выжимка: адресация апдейтов (кнопка/ввод/команда), слои и ответственности, ответы стори, инструкция для новых стори

## Управление
- [Реестр треков](./tracks.md)
- [Архив треков](./archive/)

## Когда обновлять документацию?
Документация в папке `conductor/` является "живой". Её необходимо обновлять в следующих случаях:
- **[Определение продукта](./product.md)**: при изменении видения, целевой аудитории или ключевых функций.
- **[Технологический стек](./tech-stack.md)**: при добавлении новых библиотек, фреймворков или изменении версии основных инструментов.
- **[Рабочий процесс](./workflow.md)**: при изменении процедур разработки, тестирования или развертывания.
- **[Styleguides](./code_styleguides/)**: при введении новых архитектурных паттернов или соглашений по коду.
- **[Реестр треков](./tracks.md)**: при создании нового трека или изменении статуса существующего.
