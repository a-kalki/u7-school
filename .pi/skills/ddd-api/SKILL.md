---
name: ddd-api
description: Правила и шаблоны для API-слоя — UseCase, Command, Module. Используй при создании или изменении файлов в src/api/ и src/domain/<entity>/commands/.
---

# DDD API Layer — Styleguide

## Директива

Ты ДОЛЖЕН следовать этим правилам при создании или изменении файлов API-слоя (`src/api/`) и команд (`src/domain/<entity>/commands/`).

Тесты гарантируют корректную работу вариантов потока выполнения всех частей приложения.

## Карта файлов

Ниже — соответствие паттернов, файлов в проекте и полных styleguide-файлов с примерами кода.
Если нужен полный пример — прочитай указанный styleguide-файл.

| Паттерн | Файл в проекте | Полный styleguide |
|---|---|---|
| UseCase | `api/<enitity>/<command-name>-uc.ts` | `conductor/code_styleguides/skills/usecase.md` |
| Command | `domain/<entity>/commands/<name>-cmd.ts` | `conductor/code_styleguides/skills/commands.md` |
| Module (domain meta) | `domain/module.ts` | `conductor/code_styleguides/skills/module.md` |
| Module (api impl) | `api/module.ts` | `conductor/code_styleguides/skills/module.md` |

---

## 1. UseCase — `api/<command-name>-uc.ts`

**Назначение:** оркестратор одной бизнес-операции. Наследуется от `UseCase<CmdMeta, Resolver>`.

### Ключевые правила
1. Опирается на каркас и поток, определённый родителем — концентрируйся на доменной логике.
2. Разбивай логику на логические шаги, делай методы небольшими (разумно).
3. Концентрируйся на **положительном потоке**. Если происходит прогнозируемая ошибка — прерывай поток, передав ошибку предусмотренными методами.
4. Валидация входящей команды — через `inputSchema`.
5. Проверка авторизации и политик доступа.
6. Вызов агрегатов домена.
7. Взаимодействие с репозиториями через `resolve`.
8. Выброс типизированных ошибок (`throwNotFound`, `throwValidation` и т.д.).
9. Тестируются все возможные потоки выполнения. Все зависимости слоя `infra` мокируются.

### Структура
```typescript
export class <CommandName>Uc extends UseCase<<CommandName>CmdMeta, Resolver> {
  // inputSchema — схема команды
  // accessPolicy — проверка прав
  // execute() — основная логика (разбита на шаги-методы)
}
```

---

## 2. Command — `domain/<entity>/commands/<command-name>-cmd.ts`

**Назначение:** всё для описания одной команды модуля.

### Содержимое файла
- **Схема валидации** (`<CommandName>CmdSchema`)
- **Тип команды** (`<CommandName>Cmd`)
- **Мета команды** (`<CommandName>CmdMeta`)
- **Ошибки команды** (`<CommandName>CmdError`)

### Ключевые правила
1. Каждая команда — **отдельный файл**. Имя: `<command-name>-cmd.ts`.
2. Схема **наследует** правила из `EntitySchema.entries` — без дублирования валидации.
3. `commandName` — kebab-case, формат приказа: `"create-user"`.
4. `CmdMeta.errors` — **только** ошибки, которые этот UC реально выбрасывает.
5. `CmdError` — union атомарных типов из `errors.ts`.
6. Валидация как правило не тестируетсяа, так как валидация протестирована на уровне сущности `entity`.

---

## 3. Module

### Три уровня модуля

| Уровень | Класс/тип | Файл | Назначение |
|---|---|---|---|
| Domain | `<Name>ModuleMeta`, `<Name>ApiModuleResolver` | `domain/module.ts` | Типы: мета и контракт зависимостей |
| API | `<Name>ApiModule` | `api/module.ts` | Диспетчер: регистрация UC, роутинг команд |
| UI | `<Name>AutoUiModule` | `ui/auto-ui/module.ts` | Модули интерфейса |

### Ключевые правила
1. `ModuleMeta` описывает контракт для модулей слоёв API, UI.
2. Каждый модуль описывает свой тип `Resolver` для DI.
3. API-модуль получает `Resolver` в конструкторе.
4. В `ApiModule` регистрируются все `UseCase` модуля.
5. Выполняется один тест на каждый usecase чтобы гарантировать что команды доходят.

---

## Предотвращение регресса

- **Не ломай существующее** — меняй только то, что относится к задаче.
- **Не удаляй и не переписывай тесты** — только добавляй новые.
- **Критические ошибки вне задачи** — задокументируй в отчёте, не исправляй без согласования.
