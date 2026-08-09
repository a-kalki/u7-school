# План реализации: Полное удаление publicActions/getAction

## Phase 1: Удаление из BotUserStory (core/ui)

- [ ] Task: Удалить publicActions из BotUserStory
  - [ ] Удалить дженерик-параметр `TPublicActions` из `BotUserStory`
  - [ ] Удалить поле `publicActions`
  - [ ] Проверить `U7BotUserStory` — убрать передачу дженерика если есть

## Phase 2: Удаление из BotController (core/ui)

- [ ] Task: Удалить publicActions из BotController
  - [ ] Удалить геттер `publicActions`
  - [ ] Удалить агрегацию `publicActions` из сторис в `init()`

## Phase 3: Удаление из UiApp (core/ui)

- [ ] Task: Удалить getAction из UiApp
  - [ ] Удалить метод `getAction<T>(name)`
  - [ ] Удалить связанные приватные поля/мапы
  - [ ] Удалить `collectPublicActions` если есть

## Phase 4: Удаление из прикладного кода

- [ ] Task: Очистить MonitorStory
  - [ ] Удалить поле `publicActions` и тип `MonitorActions`
  - [ ] Удалить импорт `UiCallbackFactory` из MonitorStory

## Phase 5: Обновление тестов

- [ ] Task: Обновить тесты core/ui
  - [ ] `bot-user-story.test.ts` — убрать проверки publicActions
  - [ ] `bot-controller.test.ts` — убрать тесты publicActions
  - [ ] `ui-app.test.ts` — убрать тесты getAction (если есть)
- [ ] Task: Обновить тесты прикладного кода
  - [ ] `monitor.test.ts` — убрать publicActions
  - [ ] `app-controller.test.ts` — проверить, что publicActions тест уже удалён
  - [ ] `learning/controller.test.ts` — проверить

## Phase 6: Документирование

- [ ] Task: Обновить styleguide'ы
  - [ ] `bot-user-story.md` — удалить правило 8, заменить пометкой «механизм удалён в Треке 10»
  - [ ] `bot-controller.md` — удалить секцию про publicActions

## Phase 7: Верификация

- [ ] Task: Верификация
  - [ ] `bun lint` — чисто
  - [ ] `bun tslint` — чисто
  - [ ] `bun test` — все тесты проходят
  - [ ] `grep -r "publicActions" packages/core --include="*.ts"` — пусто
  - [ ] `grep -r "getAction" packages/core --include="*.ts"` — пусто
  - [ ] `grep -r "MonitorActions" apps/ --include="*.ts"` — пусто
