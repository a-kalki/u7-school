# План реализации: Полное удаление publicActions/getAction

## Phase 1: Удаление из BotUserStory (core/ui)

- [x] Task: Удалить publicActions из BotUserStory
  - [x] Удалить дженерик-параметр `TActions` из `BotUserStory`
  - [x] Удалить поле `publicActions`
  - [x] Удалить хелпер-метод `action()`
  - [x] Проверить `U7BotUserStory` — убрать передачу дженерика

## Phase 2: Удаление из BotController (core/ui)

- [x] Task: Удалить publicActions из BotController
  - [x] Удалить геттер `publicActions`
  - [x] Удалить импорт `UiCallbackFactory`

## Phase 3: Удаление из UiApp (core/ui)

- [x] Task: Удалить getAction из UiApp
  - [x] Удалить метод `getAction<T>(name)`
  - [x] Удалить `publicActionsMap`, `publicActionsSize`
  - [x] Удалить `#registerPublicActions()`
  - [x] Убрать вызов `#registerPublicActions()` из `init()`
  - [x] Удалить импорты `StoryPublicActions`, `UiCallbackFactory`
  - [x] Убрать реэкспорт `public-actions` из `ui/index.ts`

## Phase 4: Удаление из прикладного кода

- [x] Task: Очистить MonitorStory
  - [x] Удалить поле `publicActions` и тип `MonitorActions`
  - [x] Удалить импорт `UiCallbackFactory` из MonitorStory
- [x] Task: Обновить U7BotUserStory
  - [x] Убрать дженерик `TActions`

## Phase 5: Обновление тестов

- [x] Task: Обновить тесты core/ui
  - [x] `bot-user-story.test.ts` — убрать проверки publicActions
  - [x] `bot-controller.test.ts` — убрать тесты publicActions
  - [x] `ui-app.test.ts` — убрать тесты getAction
- [x] Task: Обновить тесты прикладного кода
  - [x] `app-controller.test.ts` — убрать тест publicActions

## Phase 6: Документирование

- [x] Task: Обновить styleguide'ы
  - [x] `bot-user-story.md` — удалить правило 8 (запрет кросс-контроллерных вызовов), оставить только правило 7 (cbFor)
  - [x] `bot-controller.md` — удалить секцию про `publicActions`, обновить нумерацию разделов

## Phase 7: Верификация

- [x] Task: Верификация
  - [x] `bun lint` — чисто
  - [x] `bun tslint` — чисто
  - [x] `bun test` — все тесты проходят (1318 pass, 0 fail)
  - [x] `grep -r "publicActions" packages/core --include="*.ts"` — только в комментариях
  - [x] `grep -r "getAction" packages/core --include="*.ts"` — только в deprecated-комментарии
  - [x] `grep -r "MonitorActions" apps/ --include="*.ts"` — пусто
