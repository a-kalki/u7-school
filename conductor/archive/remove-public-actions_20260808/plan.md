# План реализации: Запрет кросс-контроллерных publicActions

## Phase 1: Кнопка «↩️ Главное меню» — вынос в константу

- [x] Task: Создать общий модуль с константой
  - [x] Создать `apps/u7-bot/src/controllers/shared/constants.ts`
  - [x] Экспортировать `MAIN_MENU_BUTTON = { text: '↩️ Главное меню', code: 'app:main-menu' }`
- [x] Task: Заменить `getAction<CommunityActions>('mainMenu')()` на константу
  - [x] `stream-catalog.story.ts:180`
  - [x] `course-catalog.story.ts:470`
  - [x] `submenu.ts:88`
- [x] Task: Удалить publicActions из CommunityStory
  - [x] Удалить поле `publicActions` и тип `CommunityActions`
  - [x] Удалить импорт `UiBotButton` если больше не нужен

## Phase 2: Кнопка «👥 Студенты» — свой обработчик в ViewStreamStory

- [x] Task: Добавить обработчик в ViewStreamStory
  - [x] Перенести `MonitorStory.#handleStudents` как protected-метод `ViewStreamStory`
  - [x] Добавить ветку `'students'` в `handleCallback`
  - [x] Заменить `getAction<MonitorActions>('students')` на `cbFor('view-stream', 'students', stream.uuid)` в `buildKeyboard`
  - [x] Удалить импорт `MonitorActions` из ViewStreamStory
- [x] Task: Обновить ViewStreamMentorStory
  - [x] Оставить `cbFor('monitor', ...)` — внутриконтроллерный вызов
  - [x] Унаследованный обработчик доступен (protected-метод)

## Phase 3: Кнопка «📝 Записаться» — перенос в ViewStreamStory

- [x] Task: Перенести логику EnrollStory в ViewStreamStory
  - [x] Перенести `handleCallback` логику для `'enroll'` в `ViewStreamStory.handleCallback`
  - [x] Перенести `handleMessage` логику (captureInput для кодового слова)
  - [x] Перенести `#doEnroll` как protected-метод
  - [x] Перенести `EnrollKeyContext` интерфейс
  - [x] Заменить `getAction<EnrollActions>('enrollButton')` на `cbFor('view-stream', 'enroll', stream.uuid)` в `buildKeyboard`
  - [x] Удалить импорт `EnrollActions` из ViewStreamStory
- [x] Task: Удалить EnrollStory
  - [x] Удалить `EnrollStory` из `LearningController.stories`
  - [x] Удалить файл `enroll.ts`
  - [x] Удалить файл `enroll.test.ts` (если есть)

## Phase 4: Тесты и верификация

- [x] Task: Обновить E2E тесты
  - [x] Проверка клика по кнопке «Студенты» уже есть и работает
  - [x] getAction больше не используется
- [x] Task: Обновить интеграционные тесты
  - [x] MentorController оставлен — нужен для кросс-контроллерных cbFor
  - [x] LearningController оставлен — нужен для делегата hub:my-study
- [x] Task: Верификация
  - [x] `bun lint` — чисто
  - [x] `bun tslint` — чисто
  - [x] `bun test` — 1322 тестов проходят

## Phase 5: Документирование фичи и ограничений

- [x] Task: `bot-user-story.md` — документировать publicActions
  - [x] Описать фичу: `publicActions` + `getAction<T>()` для внутриконтроллерных кросс-стори кнопок
  - [x] Явный запрет: межконтроллерные вызовы запрещены — причина (префиксы, shortIds)
  - [x] Пример правильного использования (внутри контроллера)
  - [x] Пример запрещённого (между контроллерами) с пояснением почему
- [x] Task: `bot-controller.md` — уточнить границы
  - [x] `publicActions` геттер на уровне контроллера — только для внутриконтроллерного использования
  - [x] `getAction()` — только в сторис того же контроллера
- [x] Task: Проверить `architecture.md` — нет ли упоминаний кросс-контроллерных publicActions
  - [x] Упоминаний не найдено — обновление не требуется
