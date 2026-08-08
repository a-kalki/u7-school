# План реализации: Удаление кросс-контроллерных publicActions

## Phase 1: Удаление use-site (сторис + контроллеры)

- [ ] Task: Удалить publicActions из MonitorStory
  - [ ] Удалить поле `publicActions` и тип `MonitorActions`
  - [ ] Удалить импорт `UiCallbackFactory` если больше не нужен
- [ ] Task: Удалить publicActions из EnrollStory
  - [ ] Удалить поле `publicActions` и тип `EnrollActions`
  - [ ] Удалить импорт `UiCallbackFactory` если больше не нужен
- [ ] Task: Удалить getAction из ViewStreamStory.buildKeyboard
  - [ ] Удалить строку с `getAction<MonitorActions>('students')`
  - [ ] Удалить строку с `getAction<EnrollActions>('enrollButton')`
  - [ ] Удалить импорты `MonitorActions`, `EnrollActions`
- [ ] Task: Удалить BotController.publicActions getter
  - [ ] Удалить getter из `bot-controller.ts`
  - [ ] Удалить импорт `UiCallbackFactory` если больше не нужен

## Phase 2: Удаление инфраструктуры publicActions из core

- [ ] Task: Удалить из UiApp
  - [ ] Удалить метод `getAction()`
  - [ ] Удалить метод `#registerPublicActions()`
  - [ ] Удалить поле `publicActionsMap`
  - [ ] Удалить геттер `publicActionsSize`
  - [ ] Убрать вызов `#registerPublicActions` из `init()`
- [ ] Task: Удалить из BotUserStory
  - [ ] Удалить поле `publicActions` и дженерик `TActions`
  - [ ] Удалить импорт `StoryPublicActions`, `UiBotButton` если не нужны
- [ ] Task: Зачистить public-actions.ts
  - [ ] Удалить `StoryPublicActions` если больше нигде не используется
  - [ ] Оставить `UiBotButton` (используется в `action()`)
- [ ] Task: Удалить дублирующий `publicActions` из U7BotUserStory (если есть)

## Phase 3: Тесты и верификация

- [ ] Task: Обновить E2E тесты
  - [ ] Убрать проверку `expect(btns.some(t => t.includes('Студенты'))).toBe(true)`
  - [ ] Убрать тест клика по «Студенты» (добавленный для диагностики)
- [ ] Task: Обновить интеграционные тесты
  - [ ] Убрать `MentorController` из `beforeAll` view-stream.integration.test.ts
  - [ ] Убрать `MentorController` из `beforeAll` curious-showcase.e2e.test.ts
- [ ] Task: Обновить/удалить UiApp unit-тесты
  - [ ] Удалить тесты `getAction` и `publicActionsSize`
- [ ] Task: Верификация
  - [ ] `bun lint` — чисто
  - [ ] `bun tslint` — чисто
  - [ ] `bun test` — все тесты проходят
  - [ ] `bun dev:fixtures` — бот запускается, кнопка «Студенты» доступна через меню ментора

## Phase 4: Документация

- [ ] Task: Обновить bot-user-story.md
- [ ] Task: Обновить bot-controller.md (если упоминается publicActions)
