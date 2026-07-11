---
name: arch-boundary-design
description: ЗАГРУЖАТЬ ПЕРВЫМ при создании или редактировании ЛЮБЫХ методов, классов, объектов, модулей или слоёв. Определяет, ГДЕ размещать логику. Приоритетнее ddd-* скиллов.
---

# Границы архитектуры — где размещать логику

> **Правило:** перед созданием или редактированием любого метода, класса, файла — сверься с таблицей. При необходимости прочитай указанный документ.

## Таблица принятия решений

| Объект | Куда | Документ |
|--------|------|----------|
| **Агрегат (Ar)** | `domain/<entity>/a-root.ts` | `conductor/code_styleguides/skills/aggregate.md` |
| **Политика (Policy)** | `domain/<entity>/policy.ts` | `conductor/code_styleguides/skills/policy.md` |
| **Доменный сервис (Ds)** | `domain/<entity>-ds.ts` | `conductor/code_styleguides/skills/domain-service.md` |
| **Фасад (Facade)** | `domain/facade.ts` | `conductor/code_styleguides/skills/facade.md` |
| **UseCase (UC)** | `api/<entity>/<name>-uc.ts` | `conductor/code_styleguides/skills/usecase.md` |
| **Story** | `ui/bot/stories/<name>.story.ts` | `conductor/code_styleguides/skills/bot-user-story.md` |

Общие документы:
- Границы между модулями: `conductor/code_styleguides/domain-boundaries.md`
- DDD-принципы: `conductor/code_styleguides/ddd.md`
- Слои и импорты: `conductor/code_styleguides/architecture.md`

## Правила

1. **Границы агрегатов:** агрегат не создаёт и не возвращает другой агрегат. Возвращает данные. Создание другого агрегата — в UC или Ds.
2. **Инварианты не обходимы:** не заменять метод экземпляра статикой ради тестов. Чинить тестовые данные.
3. **Policy ≠ навигация:** Policy отвечает на `can?`. Структурная навигация — в Ar.
4. **Фасады — объекты:** `getModule(id)`, не `getModuleTitle(id)`. Потребитель сам возьмёт нужное поле.
5. **Межмодульное:** зависимый модуль импортирует Policy/Ar/Facade вышестоящего, делегирует, передаёт минимум данных.
