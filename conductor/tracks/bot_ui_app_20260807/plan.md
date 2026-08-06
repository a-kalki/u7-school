# План реализации: Перенос `AppController` + `CommunityStory`

> **Трек:** `bot_ui_app_20260807`
> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 3
>
> **Зависимости:** `bot_ui_actions_20260807`

---

## Фаза 1: Тесты (Red) — Тесты на текущее поведение

- [ ] Task: Зафиксировать поведение `AppController` и `CommunityStory` тестами
    - [ ] Тест: главное меню (`/start`) возвращает правильные кнопки
    - [ ] Тест: кнопка «Community» работает
    - [ ] Тест: кросс-ссылки на `app:main-menu` работают
- [ ] Task: Conductor - User Manual Verification 'Фаза 1: Тесты' (Protocol in workflow.md)

## Фаза 2: Реализация (Green) — Перенос и замена

- [ ] Task: Создать `apps/u7-bot/src/app/controller.ts`
    - [ ] Класс `AppController extends U7BotController`
    - [ ] Обработчик главного меню (`handleStart`)
- [ ] Task: Создать `apps/u7-bot/src/app/stories/community.ts`
    - [ ] Перенести `CommunityStory` из `app/ui/bot/stories/`
    - [ ] Заменить `cbFor()` на `this.ui.*`
- [ ] Task: Заменить строковые callback-коды на `this.ui.app.*`
    - [ ] `'app:main-menu'` → `this.ui.app.mainMenu()`
    - [ ] `'app:help'` → `this.ui.app.help()`
    - [ ] Обновить `publicActions` в `AppController`
- [ ] Task: Обновить кросс-ссылки из других стори
    - [ ] Найти все `cbFor('app:main-menu', ...)` → `this.ui.app.mainMenu()`
- [ ] Task: Удалить старые файлы
    - [ ] `app/ui/bot/app-controller.ts`
    - [ ] `app/ui/bot/stories/community.ts`
- [ ] Task: Conductor - User Manual Verification 'Фаза 2: Реализация' (Protocol in workflow.md)

## Фаза 3: Рефакторинг

- [ ] Task: Проверить чистоту
    - [ ] Нет импортов `AppController` из старого пути
    - [ ] Нет строковых `'app:main-menu'` и `'app:help'` в коде
    - [ ] Кросс-ссылки типизированы через `this.ui.app.*`
- [ ] Task: Conductor - User Manual Verification 'Фаза 3: Рефакторинг' (Protocol in workflow.md)

## Фаза 4: Проверка качества и документация

- [ ] Task: Прогнать полную проверку качества
    - [ ] `bun run check` — biome + tsc + тесты
    - [ ] `bun test --coverage` — покрытие >80%
- [ ] Task: Обновить документацию
    - [ ] Создать `apps/u7-bot/src/app/ui-spec.md`
- [ ] Task: Conductor - User Manual Verification 'Фаза 4: Качество' (Protocol in workflow.md)
