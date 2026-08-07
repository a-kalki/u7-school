# Итоговый отчёт: Перенос AppController + CommunityStory

> **Трек:** `bot_ui_app_20260807`
> **Релиз:** 1 — Новый Bot UI
> **Зависимости:** `bot_ui_actions_20260807`

## Цель

Перенести `AppController` и `CommunityStory` из `packages/app/src/ui/` в `apps/u7-bot/src/app/`. Разорвать зависимость `packages/app → @u7-scl/bot`. Внедрить типизированные кросс-ссылки через `UiBotButton`.

## Выполненные задачи

### Перенос файлов
- `AppController` → `apps/u7-bot/src/app/app-controller.ts`
- `CommunityStory` → `apps/u7-bot/src/app/stories/community.story.ts`
- Тесты → `apps/u7-bot/tests/app/`
- Старые файлы удалены из `packages/app/src/ui/`

### Типизация кросс-ссылок
- `UiCallbackFactory` → возвращает `UiBotButton { text, code }` вместо строки
- `BotUserStory<TMeta, TUi>` — дженерик для `this.ui`
- `U7BotUserStory<TMeta>` — закрывает `TUi = UiRegistry`
- `AppController.publicActions` — фабрики готовых кнопок
- Стори stream/course: замена `'app:main-menu'` на `this.ui?.app?.app?.mainMenu?.() ?? fallback`

### Качество
- `tsc --noEmit` — 0 ошибок
- `biome check` — 0 ошибок
- Тесты: 1478 pass, 3 предсуществующих fail (не связаны)

## Файлы

Новые:
- `apps/u7-bot/src/app/app-controller.ts`
- `apps/u7-bot/src/app/stories/community.story.ts`
- `apps/u7-bot/tests/app/app-controller.test.ts`
- `apps/u7-bot/tests/app/community.story.test.ts`

Изменённые:
- `packages/core/src/ui/bot/ui-registry.ts` — `UiBotButton`, `UiCallbackFactory`
- `packages/core/src/ui/bot/bot-user-story.ts` — дженерик `TUi`
- `packages/core/src/ui/bot/controller/bot-controller.ts` — `UiBotButton` в `publicActions`
- `packages/core/src/ui/bot/controller/bot-controller.test.ts`
- `apps/u7-bot/src/u7-bot-user-story.ts` — `TUi = UiRegistry`
- `apps/u7-bot/src/api-app.ts` — импорт из нового пути
- `apps/u7-bot/src/ui-actions.test.ts`
- `apps/u7-bot/src/ui-actions.ts` — реэкспорт
- `tsconfig.json` — алиас `@u7-scl/bot/app/*`
- `packages/app/src/ui/index.ts`
- `packages/app/src/ui/ui-components.test.ts`
- `tests/bot/e2e/curious-showcase.e2e.test.ts`
- `tests/bot/e2e/main-menu.e2e.test.ts`
- `tests/bot/helpers/test-app.ts`
- `tests/bot/integration/app/community.integration.test.ts`
- ~4 файла stoри stream/course — кросс-ссылки

Удалены:
- `packages/app/src/ui/app-controller.ts`
- `packages/app/src/ui/app-controller.test.ts`
- `packages/app/src/ui/stories/community.story.ts`
- `packages/app/src/ui/stories/community.story.test.ts`

## Архитектурные решения

1. **`UiBotButton { text, code }`** — фабрики возвращают готовую кнопку. Клиент может переопределить `text`.

2. **Дженерик `TUi` в `BotUserStory`** — закрывается в `U7BotUserStory<TMeta>` как `UiRegistry`. `this.ui` типизирован без `as any`.

3. **Тройная вложенность `UiRegistry`** — `controller.story.action`. Для AppController: `this.ui.app.app.mainMenu()`. Возможная future-оптимизация: flatten для одноимённых контроллеров/стори.

4. **Защитный fallback** — `this.ui?.app?.app?.mainMenu?.() ?? { text: '↩️ Главное меню', code: 'app:main-menu' }` — обеспечивает обратную совместимость с тестами без `initUi()`.

## Известные ограничения

- 3 предсуществующих падающих теста не связаны с треком
- `test-app.ts` использует `// biome-ignore` для `any` в `createTestUiRouter` — допустимо для тестового хелпера
