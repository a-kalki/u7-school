---
name: ddd-naming
description: Соглашения об именовании файлов, папок, классов и типов. Используй при создании новых файлов/папок И при реорганизации существующей структуры директорий.
---

# DDD Naming Conventions — Styleguide

## Директива

Ты ДОЛЖЕН следовать этим соглашениям при:
- **Создании** новых файлов и папок.
- **Реорганизации** существующей структуры директорий (перемещение, переименование).

Полный документ: `conductor/code_styleguides/naming.md`.

---

## 1. Имена файлов и папок

**Всегда kebab-case:**
- ✅ Правильно: `user-ar.ts`, `create-user-uc.ts`, `domain/ar/`.
- ❌ Неправильно: `UserAr.ts`, `createUserUc.ts`, `create_user_cmd.ts`.

**Тесты:** `<имя_файла>.test.ts`.

---

## 2. Имена классов и типов — таблица шаблонов

| Концепт | Шаблон | Пример |
|---|---|---|
| Сущность (тип) | `<EntityName>` | `User` |
| Сущность (схема) | `<EntityName>Schema` | `UserSchema` |
| Агрегат (мета) | `<EntityName>ArMeta` | `UserArMeta` |
| Агрегат (класс) | `<EntityName>Ar` | `UserAr` |
| Репозиторий (интерфейс) | `<EntityName>Repo` | `UserRepo` |
| Репозиторий (реализация) | `<EntityName><Type>Repo` | `UserSqliteRepo` |
| Политика | `<EntityName>Policy` | `UserPolicy` |
| Ошибка агрегата | `<Name>ArError` | `UserArError` |
| Команда (тип) | `<CommandName>Cmd` | `CreateUserCmd` |
| Команда (схема) | `<CommandName>CmdSchema` | `CreateUserCmdSchema` |
| Команда (мета) | `<CommandName>CmdMeta` | `CreateUserCmdMeta` |
| Ошибки команды (union) | `<CommandName>CmdError` | `CreateUserCmdError` |
| Ошибка usecase (атомарная) | `<Name>UcError` | `UserNotFoundUcError` |
| Ошибки модуля (union) | `<ModuleName>ModuleError` | `UserModuleError` |
| UseCase | `<CommandName>Uc` | `CreateUserUc` |
| Модуль (мета) | `<Name><Type>ModuleMeta` | `UserApiModuleMeta` |
| Модуль (резолвер) | `<Name><Type>ModuleResolver` | `UserApiModuleResolver` |
| Модуль (класс) | `<Name><Type>Module` | `UserApiModule`, `UserAutoUiModule` |
| Domain Service | `<Module>Ds` | `CourseDs` |
| БД (интерфейс) | `<ModuleName>Db` | `UserDb` |
| БД (реализация) | `<ModuleName><Type>Db` | `UserSqliteDb` |
| Фасад (интерфейс) | `<ModuleName>Facade` | `UserFacade` |
| Фасад (реализация) | `<ModuleName><Type>Facade` | `UserRestFacade` |
| Пользовательский сценарий | `<StoryName>Story` | `CatalogStory` |
| Контроллер (бот) | `<ModuleName>Controller` | `StreamController` |

---

## 3. Структура папок доменного модуля

```
<module-name>/src
  - shared/          — общая логика для фронта и бэка
  - domain/          — доменные объекты и логика
    - <entity-name>/ — всё, что связано с агрегатом
      - entity.ts          — тип, схема и мета агрегата
      - a-root.ts          — класс Aggregate
      - policy.ts          — правила доступа
      - types.ts           — ID, вспомогательные типы
      - repo.ts            — интерфейс репозитория
      - roles.ts           — роли и перечисления
      - errors.ts          — доменные ошибки агрегата
      - commands/          — типы и схемы команд
        - <name>-cmd.ts    — command, schema, meta, cmd-error
        - errors.ts        — атомарные ошибки UC + union модуля
    - module.ts      — мета-тип модуля, резолвер
    - facade.ts      — интерфейс фасада (если нужно)
    - db.ts          — интерфейс БД (если нужно)
    - types.ts       — типы уровня модуля
  - api/             — логика и объекты бэка
    - shared/        — общая логика бэка модуля
    - <entity-name>/ — если агрегат один, можно опустить
      - <name>-uc.ts — сценарии использования
    - <module>-uc.ts — абстрактный класс UC модуля
    - module.ts      — модуль слоя API
  - infra/           — инфраструктурные объекты
    - db/            — реализации БД и репозиториев
      - <module>-<type>-db.ts
      - <entity>-<type>-repo.ts
    - <module>-facade.ts
    - <контроллер>.ts — точка входа (rest, bot, cli)
  - ui/              — логика и объекты фронта
    - bot/            — интерфейс Telegram-бота
      - controller/   — контроллеры
        - <module>-controller.ts
      - stories/      — пользовательские сценарии
        - <name>.story.ts
        - <name>.story.test.ts
    - auto-ui/       — автогенерация текстового UI
      - module.ts    — AutoUiModule
```

**Важно:** структура не жёсткая. При необходимости можно отойти, соблюдая здравый смысл. Используй её как концепцию.

---

## Предотвращение регресса

- **При реорганизации** — обновляй все импорты, не ломай существующие ссылки.
- **Не переименовывай без причины** — если файл уже существует и правильно назван, не трогай.
