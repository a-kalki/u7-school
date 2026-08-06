# Спецификация: Перенос `AppController` + `CommunityStory`

> **Родительский документ:** [bot-ui-refactoring.md](../../bot-ui-refactoring.md), Трек 3
> **Дорожная карта:** [development-roadmap.md](../../development-roadmap.md), Релиз 1
>
> **Зависимости:** Трек 2 (bot_ui_actions_20260807)

## Обзор

Первый контроллер в новом пакете. Системные сценарии — главное меню, помощь, community — не привязаны к конкретному домену.

## Функциональные требования

1. Создать `apps/u7-bot/src/app/controller.ts` — `AppController` (extends `U7BotController`).
2. Создать `apps/u7-bot/src/app/stories/community.ts` — `CommunityStory` (перенос из `app/ui/bot/stories/`).
3. Перенести логику главного меню (`handleStart`) в `AppController`.
4. Заменить все `'app:main-menu'`, `'app:help'` и подобные строковые callback-коды на вызовы `this.ui.app.*`.
5. Обновить кросс-ссылки из других стори: `this.ui.app.mainMenu()`, `this.ui.app.help()`.
6. Перенести тесты в `apps/u7-bot/tests/app/`.

## Нефункциональные требования

- Все тесты проходят
- `tsc --noEmit` и `biome check` проходят

## Критерии приёмки

- Главное меню (`/start`) работает как раньше
- Кнопка «Community» работает как раньше
- Кросс-ссылки других стори на `app:main-menu` заменены на `this.ui.app.mainMenu()`
- Старые файлы `AppController` и `CommunityStory` удалены из `app/ui/`

## За рамками

- Изменения в логике главного меню
- Новые системные сценарии
