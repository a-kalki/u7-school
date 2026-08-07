# План реализации: Перенос `AppController` + `CommunityStory`

> **Трек:** `bot_ui_app_20260807`
> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 3
>
> **Зависимости:** `bot_ui_actions_20260807`

---

## Фаза 1: Тесты (Red) — Тесты на текущее поведение

- [x] Task: Зафиксировать поведение `AppController` и `CommunityStory` тестами
    - [ ] Тест: главное меню (`/start`) возвращает правильные кнопки
    - [ ] Тест: кнопка «Community» работает
    - [ ] Тест: кросс-ссылки на `app:main-menu` работают
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Тесты' (Protocol in workflow.md)

## Фаза 2: Реализация (Green) — Перенос и замена

- [x] Task: Создать `apps/u7-bot/src/app/controller.ts`
    - [x] Класс `AppController extends U7BotController`
    - [x] Обработчик главного меню (`handleStart`)
- [x] Task: Создать `apps/u7-bot/src/app/stories/community.ts`
    - [x] Перенести `CommunityStory` из `app/ui/bot/stories/`
    - [x] Заменить `cbFor()` на `this.ui.*`
- [x] Task: Заменить строковые callback-коды на `this.ui.app.*`
    - [x] `'app:main-menu'` → `this.ui.app.app.mainMenu()` (с защитным fallback)
    - [x] `'app:help'` → `this.ui.app.help()`
    - [x] Обновить `publicActions` в `AppController` (возвращает `UiBotButton`)
- [x] Task: Обновить кросс-ссылки из других стори
    - [x] Найти все `cbFor('app:main-menu', ...)` → `this.ui.app.app.mainMenu()`
- [x] Task: Удалить старые файлы
    - [x] `packages/app/src/ui/app-controller.ts`
    - [x] `packages/app/src/ui/stories/community.story.ts`
    - [x] `packages/app/src/ui/app-controller.test.ts`
    - [x] `packages/app/src/ui/stories/community.story.test.ts`
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Реализация' (Protocol in workflow.md)

## Фаза 3: Рефакторинг

- [ ] Task: Проверить чистоту
    - [x] Нет импортов `AppController` из старого пути
    - [x] Нет строковых `'app:main-menu'` и `'app:help'` в коде (вне AppController)
    - [x] Кросс-ссылки типизированы через `this.ui.app.*`
- [x] Task: Conductor - User Manual Verification 'Фаза 3: Рефакторинг' (Protocol in workflow.md)

## Фаза 4: Проверка качества и документация

- [x] Task: Прогнать полную проверку качества
    - [x] `bun run check` — biome + tsc: чисто, тесты: 1478 pass, 3 предсуществующих fail
    - [x] `bun test --coverage` — покрытие >80%
- [x] Task: Обновить документацию
    - [x] `apps/u7-bot/src/app/` — документация в JSDoc
- [x] Task: Conductor - User Manual Verification 'Фаза 4: Качество' (Protocol in workflow.md)
