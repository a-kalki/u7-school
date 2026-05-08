# План реализации: Рефакторинг auto-ui слоя

## Фаза 1: Абстрактный `AutoUiController` (core) [checkpoint: 0895148]

- [x] Task: Написать тесты для `AutoUiController` `2062c79`
    - [ ] Тест: `safeHandle` делегирует в `app.handleInput` и возвращает строку
    - [x] Тест: `safeHandle` форматирует AppException
    - [x] Тест: `safeHandle` форматирует Valibot ошибки
    - [x] Тест: конструктор принимает AutoUiApp
- [x] Task: Реализовать `AutoUiController` `2062c79`
    - [ ] Создать `packages/core/src/ui/auto-ui/controller/base.ts`
    - [ ] Абстрактный класс, принимает `app: AutoUiApp`
    - [x] `safeHandle(text: string): Promise<string>` — делегирование в `app.handleInput` + перехват ошибок
    - [x] `formatError(err: unknown): string` — форматирование AppException / Valibot (из текущего console-controller)
    - [x] Никакой логики register/login/session — чистая обработка ввода
- [x] Task: Conductor - User Manual Verification 'Фаза 1: AutoUiController' (Protocol in workflow.md)

## Фаза 2: `AutoUiCliController` (core)

- [ ] Task: Написать тесты для `AutoUiCliController`
    - [ ] Тест: расширяет `AutoUiController`
    - [ ] Тест: `run()` запускает REPL-цикл с построчным вводом
    - [ ] Тест: буферизация: `/module/agg/uc` + параметры + пустая строка → выполнение
    - [ ] Тест: навигационные команды выполняются мгновенно
    - [ ] Тест: `/quit` и `/exit` завершают цикл
    - [ ] Тест: `setActor(id)` устанавливает `app.currentActorId`
    - [ ] Тест: `clearActor()` сбрасывает `app.currentActorId`
    - [ ] Тест: `get actorId` читает `app.currentActorId`
    - [ ] Тест: `handleRegister()`, `handleLogin()`, `renderMenu()` — абстрактные
- [ ] Task: Реализовать `AutoUiCliController`
    - [ ] Создать `packages/core/src/ui/auto-ui/controller/cli.ts`
    - [ ] Расширяет `AutoUiController`
    - [ ] Управление сессией (на уровне CLI-контроллера):
        - `get actorId(): string | null`
        - `setActor(id: string): void`
        - `clearActor(): void`
    - [ ] Абстрактные методы для CLI-окружения:
        - `createReadline(): readline.Interface`
        - `writePrompt(): void`
        - `handleQuit(): void`
    - [ ] Абстрактные методы auth (реализация в дочерних):
        - `handleRegister(): Promise<string>`
        - `handleLogin(userId?: string): Promise<string>`
        - `renderMenu(): string`
    - [ ] REPL-цикл `run()` с буферизацией (из текущего `AutoUiConsoleController`)
    - [ ] При разборе `"register"` → `this.handleRegister()`, `"login"` → `this.handleLogin()`
    - [ ] При старте: `safeHandle("/app")` + `renderMenu()`
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: AutoUiCliController' (Protocol in workflow.md)

## Фаза 3: `UserCliController` (user)

- [ ] Task: Написать тесты для `UserCliController`
    - [ ] Тест: расширяет `AutoUiCliController`
    - [ ] Тест: `handleRegister()` — отправляет `app.handleInput("/user/user/create-user")` с action=prompt, возвращает отформатированный ответ
    - [ ] Тест: `handleRegister()` — форматирует экран "Регистрация первого администратора"
    - [ ] Тест: `handleLogin()` без аргументов — отправляет `app.handleInput("/user/user/list-users")`, форматирует список
    - [ ] Тест: `handleLogin(userId)` — вызывает `setActor(userId)`, возвращает "Вход выполнен. Активный пользователь: `<id>`"
    - [ ] Тест: `renderMenu()` — отправляет `list-users`, если пусто → меню с `/register`, иначе с `/login`
    - [ ] Тест: `renderMenu()` — при активной сессии показывает `actorId`
    - [ ] Тест: `createReadline()` возвращает readline.Interface
    - [ ] Тест: `writePrompt()` выводит `> `
    - [ ] Тест: `handleQuit()` выводит "До свидания!"
- [ ] Task: Реализовать `UserCliController`
    - [ ] Создать `packages/user/src/ui/auto-ui/controller/cli.ts`
    - [ ] Расширяет `AutoUiCliController`
    - [ ] Явно знает структуру модуля `user`:
        - Путь к `create-user`: `/user/user/create-user`
        - Путь к `list-users`: `/user/user/list-users`
    - [ ] `handleRegister()`:
        - Вызывает `app.handleInput("/user/user/create-user")` с типом `usecase` и `action: prompt`
        - Обрамляет ответ заголовком "Регистрация первого администратора"
    - [ ] `handleLogin(userId?)`:
        - Без аргументов: через `app.handleInput` вызывает `list-users`, парсит JSON, форматирует список `- name: /login <uuid>`
        - С аргументом: `setActor(userId)`, сообщение об успехе
    - [ ] `renderMenu()`:
        - Вызывает `list-users` для проверки наличия пользователей
        - Нет пользователей → пункт `/register`
        - Есть, без сессии → пункт `/login`
        - Есть сессия → `Активный пользователь: <actorId>`
    - [ ] `createReadline()`: `readline.createInterface({ input: process.stdin, output: process.stdout })`
    - [ ] `writePrompt()`: `process.stdout.write("\n> ")`
    - [ ] `handleQuit()`: `console.log("До свидания!")`
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: UserCliController' (Protocol in workflow.md)

## Фаза 4: Очистка `AutoUiApp`

- [ ] Task: Написать тесты для очищенного `AutoUiApp`
    - [ ] Тест: `handleInput("/app")` рендерит about через `render()`
    - [ ] Тест: `handleInput("/app/modules")` рендерит список модулей
    - [ ] Тест: `handleInput` НЕ содержит обработку `"register"` и `"login"`
    - [ ] Тест: `currentActorId` сохраняется и читается
- [ ] Task: Очистить `AutoUiApp`
    - [ ] Удалить методы: `handleRegister()`, `handleLogin()`, `checkHasUsers()`, `renderAboutAsync()`
    - [ ] Удалить case `"register"` и `"login"` из `handleInput()`
    - [ ] В `handleInput` для `"app"` оставить только `"about"` → `render()`, `"modules"` → `renderModulesList()`
- [ ] Task: Conductor - User Manual Verification 'Фаза 4: Очистка AutoUiApp' (Protocol in workflow.md)

## Фаза 5: Обновление `apps/u7-cli` и удаление `actor-session`

- [ ] Task: Написать тесты для main.ts с UserCliController
    - [ ] Тест: `UserCliController` инициализируется с `AutoUiApp`
    - [ ] Тест: полная интеграция UserApiModule → UserAutoUiModule → AutoUiApp → UserCliController
- [ ] Task: Обновить `main.ts`
    - [ ] Импортировать `UserCliController` из `@u7/user/ui`
    - [ ] Заменить `new AutoUiConsoleController(app)` на `new UserCliController(app)`
- [ ] Task: Удалить `apps/u7-cli/src/actor-session.ts` и `actor-session.test.ts`
- [ ] Task: Conductor - User Manual Verification 'Фаза 5: Обновление u7-cli' (Protocol in workflow.md)

## Фаза 6: Очистка экспортов и удаление старого кода

- [ ] Task: Обновить экспорты `@u7/core/ui`
    - [ ] Экспортировать `AutoUiController` из `base.ts`
    - [ ] Экспортировать `AutoUiCliController` из `cli.ts`
    - [ ] Удалить экспорт `AutoUiConsoleController`
- [ ] Task: Удалить `console-controller.ts` и `console-controller.test.ts`
- [ ] Task: Обновить экспорты `@u7/user/ui`
    - [ ] Экспортировать `UserCliController` из `controller/cli.ts`
- [ ] Task: Запустить полную проверку
    - [ ] `bun test` — все тесты проходят
    - [ ] `bunx biome check` — нет ошибок
    - [ ] `bun run typecheck` — типы проходят
- [ ] Task: Conductor - User Manual Verification 'Фаза 6: Очистка и финальная проверка' (Protocol in workflow.md)
