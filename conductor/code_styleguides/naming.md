# Соглашения об именовании

## Имена файлов и папок

Все файлы и директории в проекте (`packages/`, `apps/`) используют стиль **kebab-case**:
- Правильно: `user-ar.ts`, `create-user-uc.ts`, `domain/ar/`.
- Неправильно: `UserAr.ts`, `createUserUc.ts`, `create_user_cmd.ts`.

Тестовые файлы именуются как `<имя_файла>.test.ts`.

## Имена сущностей и классов

| Концепт | Шаблон имени | Пример | Файл |
|---|---|---|---|
| Сущность (тип) | `<EntityName>` | `User` | `domain/user/entity.ts` |
| Сущность (схема) | `<EntityName>Schema` | `UserSchema` | `domain/user/entity.ts` |
| Агрегат (мета) | `<EntityName>ArMeta` | `UserArMeta` | `domain/user/entity.ts` |
| Агрегат (реализация) | `<EntityName>Ar` | `UserAr` | `domain/user/a-root.ts` |
| Репозиторий (интерфейс) | `<EntityName>Repo` | `UserRepo` | `domain/user/repo.ts` |
| Репозиторий (реализация) | `<EntityName><Type>Repo` | `UserSqliteRepo` | `infra/db/user-sqlite-repo.ts` |
| Политика прав | `<EntityName>Policy` | `UserPolicy` | `domain/user/policy.ts` |
| Ошибка (aggregate) | `<Name>ArError` | `UserArError` | `domain/user/errors.ts` |
| Команда (тип) | `<CommandName>Cmd` | `CreateUserCmd` | `domain/user/commands/create-user-cmd.ts` |
| Команда (схема) | `<CommandName>CmdSchema` | `CreateUserCmdSchema` | `domain/user/commands/create-user-cmd.ts` |
| Команда (мета) | `<CommandName>CmdMeta` | `CreateUserCmdMeta` | `domain/user/commands/create-user-cmd.ts` |
| Ошибки команды | `<CommandName>CmdError` | `CreateUserCmdError` | `domain/user/commands/create-user-cmd.ts` |
| Ошибка (usecase, атомарная) | `<Name>UcError` | `UserNotFoundUcError` | `domain/user/commands/errors.ts` |
| Ошибки модуля (union) | `<ModuleName>UcError` | `UserUcError` | `domain/user/commands/errors.ts` |
| Сценарий использования | `<CommandName>Uc` | `CreateUserUc` | `api/user/create-user-uc.ts` |
| Модуль (мета) | `<Name><Type>ModuleMeta` | `UserApiModuleMeta` | `domain/module.ts` |
| Модуль (резолвер) | `<Name><Type>ModuleResolver` | `UserApiModuleResolver` | `domain/module.ts` |
| Модуль (реализация) | `<Name><Type>Module` | `UserApiModule` | `api/module.ts` |
| БД (интерфейс) | `<ModuleName>Db` | `UserDb` | `domain/db.ts` |
| БД (реализация) | `<ModuleName><Type>Db` | `UserSqliteDb` | `infra/db/user-db.ts` |
| Фасад (интерфейс) | `<ModuleName>Facade` | `UserFacade` | `domain/facade.ts` |
| Фасад (реализация) | `<ModuleName><Type>Facade` | `UserRestFacade` | `infra/user-rest-facade.ts` |
| Приложение (мета) | `AppMeta` | `CliAppMeta` | `apps/u7-cli/src/main.ts` |
| Приложение (реализация) | `ApiApp` | `ApiApp<CliAppMeta>` | `apps/u7-cli/src/main.ts` |
| Пользовательский сценарий | `<StoryName>Story` | `CatalogStory` | `ui/bot/stories/catalog.story.ts` |
| Контроллер (бот) | `<ModuleName>Controller` | `StreamController` | `ui/bot/controller/stream-controller.ts` |

## Структура папок доменного модуля

```
<module-name>/src
  - shared/: общая логика и объекты для фронта и бэка;
  - domain/: доменные объекты и логика;
    - <entity-name>/: все что связано с агрегатом;
      - entity.ts: тип, схема и мета агрегата сущности;
      - a-root.ts: класс агрегата (Aggregate);
      - policy.ts: правила прав доступа;
      - types.ts: различные типы не вошедшие в другие файлы сущности (ID, вспомогательные);
      - repo.ts: интерфейс репозитория;
      - roles.ts: роли и перечисления, относящиеся к сущности;
      - commands/: типы и схемы команд для usecase;
        - <command-name>-cmd.ts: command, schema, meta, cmd-error;
        - errors.ts: атомарные ошибки uc и union ошибок модуля;
    - module.ts: мета тип модуля, резолвер модуля и другие типы уровня модуля;
    - facade.ts: интерфейс фасада (если нужно);
    - db.ts: интерфейс БД (если нужно);
    - types.ts: различные типы не вошедшие в другие файлы модуля
  - api/: логика и объекты для бэка;
    - shared/: общая логика для бэка модуля;
    - <entity-name>/: если агрегат в модуле один, то можно опустить;
      - <command-name>-uc.ts: сценарии использования (usecase);
    - <module-name>-uc.ts: абстрактный класс usecase для модуля;
    - module.ts: объект модуля слоя api;
  - infra/: инфраструктурные объекты;
    - db/ имплементации БД и репозиториев;
      - <module-name>-<type>-db.ts: если нужно реализация БД;
      - <entity-name>-<type>-repo.ts: реализация repo;
    - <module-name>-facade.ts: реализация facade;
    - <(rest,bot,cli)-controller.ts>: точка входа извне;
  - ui: логика и объекты для интерфейса;
    - bot/controller/: контроллер для Telegram-бота;
    - cli-controller.ts: контроллер для CLI;
```

Данная структура не обязывает, при необходимости можно отойти от этого стандарта соблюдая здравый смысл. В таком случае используйте ее как концепцию.
