# Спецификация: Рефакторинг auto-ui слоя — разделение консоли и общего кода

## Обзор

Текущий слой `auto-ui` в `@u7/core` смешивает общую логику текстового UI 
и консольно-специфичную реализацию. Команды `/register` и `/login` захардкожены 
в `AutoUiApp`, хотя относятся к домену пользователей.

**Цель:** Разделить общий каркас и консольную реализацию, вынести 
auth-логику из `AutoUiApp` на уровень контроллеров, сделать слой 
пригодным для консоли и бота.

## Иерархия контроллеров

```
AutoUiController (core, абстрактный)        ← общее: error formatting, safeHandle
  ├── AutoUiCliController (core, абстрактный) ← REPL + сессия + абстрактные register/login/menu
  │     └── UserCliController (user)          ← конкретный UX /register, /login
  └── AutoUiBotController (будущий трек)      ← многострочный ввод бота
```

## Функциональные требования

### FR1: Абстрактный `AutoUiController` (core)
- Файл: `@u7/core/ui/auto-ui/controller/base.ts`
- **НЕ привязан к REPL** — общий для консоли и бота
- Принимает ссылку на `AutoUiApp`
- Метод `safeHandle(text: string): Promise<string>` — форматирование ошибок 
  (Valibot, AppException) и делегирование в `app.handleInput()`
- Никакой логики register/login/session — чистая обработка ввода

### FR2: `AutoUiCliController` (core)
- Файл: `@u7/core/ui/auto-ui/controller/cli.ts`
- Расширяет `AutoUiController`
- Управление сессией: `actorId`, `setActor(id)`, `clearActor()`
- Абстрактные методы CLI-окружения: `createReadline()`, `writePrompt()`, `handleQuit()`
- Абстрактные методы auth: `handleRegister()`, `handleLogin(userId?)`, `renderMenu()`
- REPL-цикл `run()` с буферизацией (из текущего `AutoUiConsoleController`)
- Маршрутизация `"register"` → `handleRegister()`, `"login"` → `handleLogin()`

### FR3: `UserCliController` (user)
- Файл: `@u7/user/ui/auto-ui/controller/cli.ts`
- Расширяет `AutoUiCliController`
- **Явно знает структуру модуля `user`**: пути к `create-user`, `list-users`
- `handleRegister()`: прямой вызов `create-user` prompt, форматирование экрана
- `handleLogin(userId?)`: список пользователей / установка actorId, форматирование
- `renderMenu()`: условное меню (register/login/actorId) в зависимости от состояния
- Реализует `createReadline()`, `writePrompt()`, `handleQuit()`

### FR4: Очистка `AutoUiApp` от auth-логики
- Удалить: `handleRegister()`, `handleLogin()`, `checkHasUsers()`, `renderAboutAsync()`
- Удалить обработку `"register"` и `"login"` из `handleInput()`
- `currentActorId` — оставить
- `handleInput()` обрабатывает только: `"app"` (about/modules), `"module"`, `"usecase"`

### FR5: Удаление `actor-session.ts` из u7-cli
- Удалить файл `apps/u7-cli/src/actor-session.ts` и его тест
- Логика сессии внутри `AutoUiCliController`

### FR6: Обновление экспортов и переименование
- Удалить экспорт `AutoUiConsoleController`
- Экспортировать: `AutoUiController`, `AutoUiCliController`
- Удалить файл `console-controller.ts` и его тест
- `@u7/user/ui` экспортирует `UserCliController`

### FR7: Обновление `apps/u7-cli/src/main.ts`
- Использовать `UserCliController` вместо `AutoUiConsoleController`

## Нефункциональные требования

- **NFR1:** Все существующие тесты проходят после рефакторинга
- **NFR2:** Новый код следует правилам именования (kebab-case, суффиксы)
- **NFR3:** Покрытие тестами >80% для нового/изменённого кода

## Критерии приёмки

- [ ] `AutoUiApp.handleInput()` не содержит `register`, `login`, `checkHasUsers`
- [ ] `AutoUiController` — абстрактный, не зависит от REPL, не содержит auth
- [ ] `AutoUiCliController` — абстрактный, содержит REPL + сессию + каркас auth
- [ ] `UserCliController` — конкретный UX register/login, явно знает модуль user
- [ ] `apps/u7-cli` запускается, `/register` и `/login` работают как прежде
- [ ] Файл `actor-session.ts` удалён из `apps/u7-cli`
- [ ] Все тесты проходят: `bun test`
- [ ] Нет ошибок линтинга: `bunx biome check`
- [ ] Типы: `bun run typecheck`

## За рамками

- `AutoUiBotController` (отдельный трек)
- Изменения в `apps/u7-bot`
- Изменения в доменной логике `@u7/user`
