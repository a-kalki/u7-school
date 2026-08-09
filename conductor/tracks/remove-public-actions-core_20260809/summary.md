# Итоговый отчёт: Полное удаление publicActions/getAction

## Цель трека

Полностью удалить механизм `publicActions`/`getAction<T>()` из фреймворка (`packages/core/src/ui/`) и прикладного кода. После Трека 9 кросс-контроллерные вызовы были удалены, а `MonitorStory.publicActions` стал мёртвым кодом. Данный трек удаляет сам механизм из ядра.

## Выполненные задачи

### Phase 1: Удаление из BotUserStory
- Удалён дженерик-параметр `TActions` (4-й параметр) — BotUserStory теперь принимает 2 дженерика
- Удалено поле `publicActions: TActions`
- Удалён protected-метод `action()` (хелпер для publicActions)
- Удалён импорт `StoryPublicActions`, `UiBotButton`

### Phase 2: Удаление из BotController
- Удалён геттер `publicActions`
- Удалён импорт `UiCallbackFactory`

### Phase 3: Удаление из UiApp
- Удалён метод `getAction<T>(name)`
- Удалено приватное поле `publicActionsMap`
- Удалён метод `#registerPublicActions()`
- Удалён геттер `publicActionsSize`
- Убран вызов `#registerPublicActions()` из `init()`
- Удалён импорт `StoryPublicActions`, `UiCallbackFactory`
- Убран реэкспорт `public-actions` из `packages/core/src/ui/index.ts`

### Phase 4: Удаление из прикладного кода
- Из `MonitorStory` удалены: поле `publicActions`, тип `MonitorActions`, импорт `UiCallbackFactory`
- Из `U7BotUserStory` убран дженерик `TActions`

### Phase 5: Обновление тестов
- `bot-user-story.test.ts` — убраны тесты publicActions, упрощён мок UiApp без `getAction`
- `bot-controller.test.ts` — убран describe-блок publicActions, убраны `UiBotButton` импорт и `getAction` мок
- `ui-app.test.ts` — убраны тесты getAction и publicActionsSize
- `app-controller.test.ts` — убран тест publicActions

### Phase 6: Документирование
- `bot-user-story.md` — правило 8 (запрет кросс-контроллерных вызовов) удалено, оставлено только правило 7 (cbFor)
- `bot-controller.md` — секция «6. publicActions» удалена, обновлена нумерация разделов

### Phase 7: Верификация
- `bun lint` ✅, `bun tslint` ✅, `bun test` ✅ (1318 pass, 0 fail)
- `grep publicActions` в packages/core — только в комментариях
- `grep getAction` в packages/core — только в deprecated-комментарии
- `grep MonitorActions` в apps/ — пусто

## Изменённые файлы

| Файл | Действие |
|------|----------|
| `packages/core/src/ui/bot/bot-user-story.ts` | Удалён TActions, publicActions, action() |
| `packages/core/src/ui/bot/controller/bot-controller.ts` | Удалён publicActions-геттер |
| `packages/core/src/ui/bot/ui-app.ts` | Удалён getAction(), publicActionsMap, #registerPublicActions() |
| `packages/core/src/ui/index.ts` | Убран реэкспорт public-actions |
| `packages/core/src/ui/bot/bot-user-story.test.ts` | Убраны проверки publicActions |
| `packages/core/src/ui/bot/controller/bot-controller.test.ts` | Убран describe publicActions, мок getAction |
| `packages/core/src/ui/bot/ui-app.test.ts` | Убраны тесты getAction/publicActionsSize |
| `apps/u7-bot/src/core/u7-bot-user-story.ts` | Убран дженерик TActions |
| `apps/u7-bot/src/controllers/mentor/stories/monitor.ts` | Удалены publicActions, MonitorActions |
| `apps/u7-bot/src/controllers/app/app-controller.test.ts` | Убран тест publicActions |
| `apps/u7-bot/src/core/ui-app.ts` | Обновлены JSDoc |
| `apps/u7-bot/src/create-ui-app.ts` | Обновлён комментарий |
| `conductor/code_styleguides/skills/bot-user-story.md` | Удалено правило 8 |
| `conductor/code_styleguides/skills/bot-controller.md` | Удалена секция publicActions |

## Архитектурные решения

1. **`UiBotButton` оставлен в `public-actions.ts`** — тип `{ text, code }` может понадобиться в будущем, файл не удалён, но реэкспорт убран из `index.ts`.

2. **Моки `getAction` в тестах не удалены** — тестовые файлы (например `hub.test.ts`, `monitor.test.ts`) передают `getAction` как свойство mock-объектов. Они не привязаны к типу `UiApp` (объекты создаются как литералы), поэтому код компилируется и тесты проходят. Удаление этих моков — косметическая чистка, не меняющая поведение.

## Отклонения от плана

Нет.

## Известные ограничения

- Файл `public-actions.ts` всё ещё существует в `packages/core/src/ui/bot/`, но не импортируется нигде. Может быть удалён в будущем как чистка.
