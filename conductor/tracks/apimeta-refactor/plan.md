# План реализации: Рефакторинг типизации ApiModule и ApiApp

## Фаза 1: Базовые типы и абстракции (пакет `core`)
- [x] Task: Переименовать `ModuleMeta` в `ApiModuleMeta` в `packages/core/src/domain/module/types.ts`. (b088c25)
- [x] Task: Добавить generic-параметр (например, `TUcMetas extends UcMeta`) в `ApiModuleMeta` для строгой привязки списка `UcMeta` к модулю. (b088c25)
- [x] Task: Создать интерфейс `AppMeta` (например, `AppMeta<TModules extends ApiModuleMeta<any>>`), который будет регистрировать список модулей приложения. (b088c25)
- [x] Task: Обновить `ApiModule`, чтобы свойство `useCases` строго соответствовало переданному `ApiModuleMeta<TUcMetas>` (система типов должна требовать реализацию всех заявленных контрактов). (b088c25)
- [x] Task: Обновить `ApiApp` для поддержки `AppMeta`. Базовый `App` оставить без привязки к `AppMeta`. (b088c25)
- [x] Task: В `ApiApp` реализовать type-safe метод `execute` (или `handle`). Продумать DX: если возможно, передавать только `UcMeta` (или выводить из имени), чтобы минимизировать параметры (например, отказаться от явной передачи имени модуля) с типизацией `attrs` и выводимым `Output`. (b088c25)
- [x] Task: Conductor - User Manual Verification 'Фаза 1: Базовые типы и абстракции (пакет core)' (Protocol in workflow.md)

## Фаза 2: Миграция доменных модулей (`course`, `user`, `onboarding` и др.)
- [x] Task: Обновить `packages/user/src/api/module.ts`: переименовать `UserModuleMeta` в `UserApiModuleMeta`, добавить список `UcMeta` в её определение, и обновить `UserApiModule` для соответствия новому строгому контракту.
- [x] Task: Аналогично обновить модули `course` и `onboarding` (и любые другие), связав их с их `UcMeta`. (7ceb911)
- [x] Task: Запустить `bun run tslint` в пакетах `core`, `user`, `course`, `onboarding`, чтобы убедиться в отсутствии ошибок несоответствия типов внутри модулей. (7ceb911)
- [x] Task: Conductor - User Manual Verification 'Фаза 2: Миграция доменных модулей' (Protocol in workflow.md)

## Фаза 3: Адаптация контроллеров и сборка `ApiApp`
- [x] Task: Собрать `ApiApp` для `u7-cli`: создать экземпляр `AppMeta` и типизированного `ApiApp`, включающий все модули, **кроме** `onboarding`.
- [x] Task: Адаптировать CLI-контроллеры (например, в `apps/u7-cli` и `packages/*/src/ui/auto-ui/controller`) для вызова юзкейсов исключительно через type-safe метод `apiApp.execute(...)`. (папок auto-ui не существует)
- [x] Task: Собрать `ApiApp` для Telegram-бота в модуле `onboarding`: создать свой экземпляр `AppMeta` и `ApiApp`, включающий только модули `onboarding` и `user`.
- [x] Task: Заменить прямые вызовы `UseCase` в `onboarding` контроллерах/боте на вызовы через `ApiApp`.
- [x] Task: Conductor - User Manual Verification 'Фаза 3: Адаптация контроллеров и сборка ApiApp' (Protocol in workflow.md)

## Фаза 4: Документация и финальная проверка
- [x] Task: Обновить архитектурную документацию в `conductor/code_styleguides/skills/module.md` (и других связанных гайдах), описав новую парадигму `AppMeta` -> `ApiModuleMeta` -> `UcMeta` и использование `ApiApp`.
- [x] Task: Найти и удалить во всей документации (особенно в `conductor/`) упоминания устаревшего `auto-ui`, заменить на `cli-controller`.
- [x] Task: Выполнить полную проверку всего проекта (`bun run check`), чтобы гарантировать, что типизация работает идеально, и все тесты по-прежнему зеленые.
- [~] Task: Conductor - User Manual Verification 'Фаза 4: Документация и финальная проверка' (Protocol in workflow.md)
