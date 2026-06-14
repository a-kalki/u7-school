# Итоговый отчёт: Рефакторинг ядра и интеграция модулей через пакет `@u7-scl/app`

## Цель трека
Устранение архитектурной связанности между UI-контроллерами доменных модулей и общим классом приложения `ApiApp`. Перевод UI-слоя на взаимодействие с локальными `ApiModule` при сохранении строгой типизации.

## Выполненные задачи

### Фаза 1: Создание пакета `@u7-scl/app`
- Инициализирован пакет с `package.json`, `tsconfig.json`, путями в корневом `tsconfig.json`
- `domain/`: `User`, `Role`, `UserSchema`, `RoleSchema`, `U7BotAppMeta`, `U7AppResolver`
- `ui/`: `U7BotController<TMeta>`, `U7BotUserStory<TMeta>`
- 36 тестов (валидация схем, импорты, мета-типы)

### Фаза 2: Рефакторинг ядра `@u7-scl/core`
- `domain/types.ts`: `AppEnvMode`, `AppResolver`, `ModuleResolver`, `GetUcNamesFromMeta`, `ExtractUcMetaFromMeta`, `ApiExecutor<TMeta>`
- `ApiModule`: реализует `ApiExecutor`, `execute()` с полной типизацией, `logger`/`mode` из `resolve.appResolver`, замер времени в `execute()`
- `ApiApp`: реализует `ApiExecutor`, делегирует `module.execute()`, без дублирующего логирования
- `BotController`: 3 дженерика `<TAppMeta, TModuleMeta, TActor>`, конструктор с `moduleApi`, `init` с `appApi`
- `BotUserStory`: 3 дженерика, `moduleApi` + `appApi`, обновлённый `init`
- `BotRouter`: 3 дженерика

### Фаза 3: Адаптация доменных модулей
- Все резолверы (`UserApiModuleResolver`, `OnboardingApiModuleResolver`, `StreamApiModuleResolver`, `CourseApiModuleResolver`) расширяют `ModuleResolver`
- Исправлена опечатка `initResolve` → `init` в `CourseApiModule`
- `U7BotController`/`U7BotUserStory` с правильными дженериками: `BotController<U7BotAppMeta, TMeta, User>`

### Фаза 4: Сборка приложения
- `apps/u7-bot/src/api-app.ts`: `appResolver` передаётся во все модули, `StreamController(streamModule)`
- `apps/u7-cli/src/main.ts`: `appResolver` в конструкторах модулей

## Архитектурные решения
1. **`ApiExecutor<TMeta>`** — универсальный интерфейс, работающий и с `AppMeta`, и с `ApiModuleMeta`
2. **`AppResolver`/`ModuleResolver`** — разделение глобальных и локальных зависимостей
3. **Логирование в `ApiModule.execute()`** — единая точка для всех вызовов
4. **`@u7-scl/app`** — пакет уровня приложения с `User`, `U7BotAppMeta`, `U7BotController`

## Результаты тестов
- `packages/core`: 153 pass / 0 fail
- `packages/app`: 36 pass / 0 fail
- Всего: 175+ тестов (core + app)

## Известные ограничения
- Тесты доменных модулей (course, stream, onboarding, user) требуют адаптации: `handle()` → `execute()`, `appResolver` в моках
- Контроллеры onboarding и stream требуют обновления конструкторов и `init` в `main.ts`
