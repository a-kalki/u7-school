# Итоговый отчёт: Удаление кросс-контроллерных publicActions

## Цель трека

Устранить архитектурную дыру: `publicActions`/`getAction<T>()` позволяли сторис одного контроллера встраивать кнопки из сторис другого контроллера, но префикс контроллера и сжатие UUID (`shortIds`) привязаны к контроллеру-владельцу, а не к источнику кнопки.

**Решение:** `publicActions`/`getAction` оставлены только для внутриконтроллерного использования. Кросс-контроллерные вызовы удалены и заменены на константы или `cbFor`.

## Выполненные задачи

### Phase 1: Кнопка «↩️ Главное меню» — вынос в константу
- Создан общий модуль `apps/u7-bot/src/controllers/shared/constants.ts` с константой `MAIN_MENU_BUTTON`
- Заменены все `getAction<CommunityActions>('mainMenu')()` на `MAIN_MENU_BUTTON` в трёх файлах:
  - `stream-catalog.story.ts`
  - `course-catalog.story.ts`
  - `submenu.ts`
- Удалены `publicActions` и тип `CommunityActions` из `CommunityStory`
- Удалён неиспользуемый импорт `UiBotButton`

### Phase 2: Кнопка «👥 Студенты» — свой обработчик в ViewStreamStory
- Добавлен protected-метод `handleStudentsList` в `ViewStreamStory` с логикой из `MonitorStory.#handleStudents`
- Добавлена ветка `'students'` в `handleCallback`
- Кнопка в `buildKeyboard` заменена с `getAction<MonitorActions>('students')` на `cbFor('view-stream', 'students', stream.uuid)`
- Удалён импорт `MonitorActions` из ViewStreamStory
- `ViewStreamMentorStory` оставлен без изменений — использует внутриконтроллерный `cbFor('monitor', 'students', ...)`
- `MonitorStory.publicActions.students` оставлен для внутриконтроллерного использования

### Phase 3: Кнопка «📝 Записаться» — перенос в ViewStreamStory
- Логика `EnrollStory` полностью перенесена в `ViewStreamStory`:
  - `handleEnrollStart` — protected-метод для начала записи
  - `handleEnrollCancel` — protected-метод для отмены ввода
  - `#doEnroll` — приватный метод выполнения записи
  - `handleMessage` — переписан для обработки кодового слова
  - Интерфейс `EnrollKeyContext` перенесён
- Кнопка заменена с `getAction<EnrollActions>('enrollButton')` на `cbFor('view-stream', 'enroll', stream.uuid)`
- Удалён импорт `EnrollActions` из ViewStreamStory
- `EnrollStory` удалён из `LearningController.stories`
- Файлы `enroll.ts` и `enroll.test.ts` удалены

### Phase 4: Тесты и верификация
- Обновлены unit-тесты `view-stream.story.test.ts` — убраны моки `getAction`
- Обновлён тест `handleMessage` (сигнатура изменилась)
- Обновлены тесты `LearningController`: 6 → 5 стори, убран `enroll`
- Обновлён тест `AppController`: `publicActions` больше не содержит `community`
- Все проверки: `bun lint` ✅, `bun tslint` ✅, `bun test` ✅ (1322 pass, 0 fail)

### Phase 5: Документирование
- `bot-user-story.md` — добавлен явный запрет кросс-контроллерных `getAction`, примеры правильного и запрещённого использования
- `bot-controller.md` — уточнены границы `publicActions` (только внутри контроллера)
- `architecture.md` — упоминаний кросс-контроллерных publicActions не найдено

## Созданные файлы

| Файл | Действие |
|------|----------|
| `apps/u7-bot/src/controllers/shared/constants.ts` | Создан |

## Изменённые файлы

| Файл | Действие |
|------|----------|
| `apps/u7-bot/src/controllers/app/stories/community.story.ts` | Удалены publicActions и CommunityActions |
| `apps/u7-bot/src/controllers/streams/stories/view-stream.story.ts` | Добавлены handleStudentsList, handleEnrollStart/Cancel, #doEnroll, handleMessage |
| `apps/u7-bot/src/controllers/streams/stories/view-stream.story.test.ts` | Обновлены моки и тесты |
| `apps/u7-bot/src/controllers/streams/stories/stream-catalog.story.ts` | MAIN_MENU_BUTTON вместо getAction |
| `apps/u7-bot/src/controllers/courses/stories/course-catalog.story.ts` | MAIN_MENU_BUTTON вместо getAction |
| `apps/u7-bot/src/controllers/mentor/stories/submenu.ts` | MAIN_MENU_BUTTON вместо getAction |
| `apps/u7-bot/src/controllers/learning/controller.ts` | Удалён EnrollStory |
| `apps/u7-bot/src/controllers/learning/controller.test.ts` | 6→5 стори, убран enroll |
| `apps/u7-bot/src/controllers/app/app-controller.test.ts` | Обновлён тест publicActions |
| `conductor/code_styleguides/skills/bot-user-story.md` | Документирован запрет кросс-контроллерных вызовов |
| `conductor/code_styleguides/skills/bot-controller.md` | Уточнены границы publicActions |

## Удалённые файлы

| Файл | Действие |
|------|----------|
| `apps/u7-bot/src/controllers/learning/stories/enroll.ts` | Удалён |
| `apps/u7-bot/src/controllers/learning/stories/enroll.test.ts` | Удалён |

## Архитектурные решения

1. **Константа для фиксированных кнопок** — `MAIN_MENU_BUTTON` вынесен в общий модуль `shared/constants.ts`. Код `app:main-menu` жёстко задан и не зависит от контроллера, поэтому константа — правильное решение.

2. **cbFor для динамических кнопок** — кнопки «Студенты» и «Записаться» используют `cbFor` с указанием целевого контроллера. Это сохраняет корректную маршрутизацию callback'ов.

3. **Логика в правильном контроллере** — `handleStudentsList` и `handleEnrollStart` перенесены в `ViewStreamStory` (StreamsController), поскольку кнопки находятся на экране карточки потока, который принадлежит StreamsController.

## Отклонения от плана

- `MentorController` и `LearningController` оставлены в `beforeAll` интеграционных тестов — они нужны для кросс-контроллерных `cbFor` (например, `cbFor('monitor', 'detail', ...)`).
- `ViewStreamMentorStory` оставлен без изменений — использует внутриконтроллерный `cbFor('monitor', ...)`, что допустимо.

## Известные ограничения

- `publicActions` всё ещё поддерживается фреймворком (`BotController`) для обратной совместимости с `MonitorStory` (единственный оставшийся потребитель).
