# План реализации: Запрет кросс-контроллерных publicActions

## Phase 1: Кнопка «↩️ Главное меню» — вынос в константу

- [ ] Task: Создать общий модуль с константой
  - [ ] Создать `apps/u7-bot/src/controllers/shared/constants.ts`
  - [ ] Экспортировать `MAIN_MENU_BUTTON = { text: '↩️ Главное меню', code: 'app:main-menu' }`
- [ ] Task: Заменить `getAction<CommunityActions>('mainMenu')()` на константу
  - [ ] `stream-catalog.story.ts:180`
  - [ ] `course-catalog.story.ts:470`
  - [ ] `submenu.ts:88`
- [ ] Task: Удалить publicActions из CommunityStory
  - [ ] Удалить поле `publicActions` и тип `CommunityActions`
  - [ ] Удалить импорт `UiBotButton` если больше не нужен

## Phase 2: Кнопка «👥 Студенты» — свой обработчик в ViewStreamStory

- [ ] Task: Добавить обработчик в ViewStreamStory
  - [ ] Перенести `MonitorStory.#handleStudents` как protected-метод `ViewStreamStory`
  - [ ] Добавить ветку `'students'` в `handleCallback`
  - [ ] Заменить `getAction<MonitorActions>('students')` на `cbFor('view-stream', 'students', stream.uuid)` в `buildKeyboard`
  - [ ] Удалить импорт `MonitorActions` из ViewStreamStory
- [ ] Task: Обновить ViewStreamMentorStory
  - [ ] Заменить `cbFor('monitor', 'students', ...)` на `cbFor('view-stream-mentor', 'students', ...)` — или оставить `cbFor('monitor', ...)` если это внутриконтроллерный вызов
  - [ ] Убедиться, что унаследованный обработчик работает для ментора

## Phase 3: Кнопка «📝 Записаться» — перенос в ViewStreamStory

- [ ] Task: Перенести логику EnrollStory в ViewStreamStory
  - [ ] Перенести `handleCallback` логику для `'enroll'` в `ViewStreamStory.handleCallback`
  - [ ] Перенести `handleMessage` логику (captureInput для кодового слова)
  - [ ] Перенести `#doEnroll` как protected-метод
  - [ ] Перенести `EnrollKeyContext` интерфейс
  - [ ] Заменить `getAction<EnrollActions>('enrollButton')` на `cbFor('view-stream', 'enroll', stream.uuid)` в `buildKeyboard`
  - [ ] Удалить импорт `EnrollActions` из ViewStreamStory
- [ ] Task: Удалить EnrollStory
  - [ ] Удалить `EnrollStory` из `LearningController.stories`
  - [ ] Удалить файл `enroll.ts`
  - [ ] Удалить файл `enroll.test.ts` (если есть)

## Phase 4: Тесты и верификация

- [ ] Task: Обновить E2E тесты
  - [ ] Заменить проверку наличия кнопки «Студенты» на проверку клика
  - [ ] Убрать тест клика через `getAction` (добавленный для диагностики)
- [ ] Task: Обновить интеграционные тесты
  - [ ] Убрать `MentorController` из `beforeAll` view-stream.integration.test.ts (если был только для getAction)
  - [ ] Убрать `MentorController` из `beforeAll` curious-showcase.e2e.test.ts (если был только для getAction)
- [ ] Task: Верификация
  - [ ] `bun lint` — чисто
  - [ ] `bun tslint` — чисто
  - [ ] `bun test` — все тесты проходят
  - [ ] `bun dev:fixtures` — бот запускается, все кнопки работают

## Phase 5: Документация

- [ ] Task: Обновить `bot-user-story.md` — добавить запрет кросс-контроллерных publicActions
- [ ] Task: Обновить `bot-controller.md` — уточнить границы использования
