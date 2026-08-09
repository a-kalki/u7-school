# Спецификация: Запрет кросс-контроллерных publicActions

## Обзор

Механизм `publicActions` + `getAction<T>()` позволяет сторис одного контроллера
встраивать кнопки из сторис другого контроллера. Это создаёт архитектурную дыру:
префикс контроллера и сжатие UUID (`shortIds`) привязаны к контроллеру-владельцу,
а не к источнику кнопки.

**Решение:**
- `publicActions`/`getAction` остаются, но **только для внутриконтроллерного** использования
- Кросс-контроллерные вызовы запрещены и удаляются
- Документация явно описывает ограничение

## Текущее состояние

| Кнопка | Где | Контроллер-источник | Статус |
|--------|-----|---------------------|--------|
| «👥 Студенты» | ViewStreamStory (Потоки курсов) | MentorController | 🔴 удалить кросс-вызов |
| «👥 Студенты» | ViewStreamMentorStory (Инстр. ментора) | MentorController | 🟢 внутриконтроллерный |
| «📝 Записаться» | ViewStreamStory (Потоки курсов) | LearningController | 🔴 удалить кросс-вызов |
| «↩️ Главное меню» | StreamCatalogStory, CourseCatalogStory, SubmenuStory | AppController | 🔴 заменить на константу |

## Функциональные требования

### FR1: Кнопка «👥 Студенты» в ViewStreamStory

- Удалить `getAction<MonitorActions>('students')` из `buildKeyboard()`
- Добавить кнопку через `cbFor('view-stream', 'students', stream.uuid)`
- Добавить protected-метод `#handleStudentsButton(streamId, actor)` в `ViewStreamStory`
  с логикой из `MonitorStory.#handleStudents`
- `ViewStreamMentorStory` наследует этот метод автоматически
- `MonitorStory.publicActions.students` — **оставить** (для внутриконтроллерного
  использования в MentorController, например через `ViewStreamMentorStory`)
- `MonitorActions` тип и импорт `UiCallbackFactory` — **оставить**

### FR2: Кнопка «📝 Записаться» в ViewStreamStory

- Перенести логику `EnrollStory` (handleCallback + handleMessage + #doEnroll + EnrollKeyContext)
  в `ViewStreamStory` как protected-методы
- Добавить кнопку через `cbFor('view-stream', 'enroll', stream.uuid)`
- `EnrollStory` — **удалить целиком**
- Убрать `EnrollStory` из `LearningController.stories`
- Удалить `EnrollActions` тип

### FR3: Кнопка «↩️ Главное меню»

- Вынести константу `MAIN_MENU_BUTTON = { text: '↩️ Главное меню', code: 'app:main-menu' }`
  в общий модуль (например `apps/u7-bot/src/controllers/shared/constants.ts`)
- Заменить все `getAction<CommunityActions>('mainMenu')()` на константу:
  - `stream-catalog.story.ts`
  - `course-catalog.story.ts`
  - `submenu.ts`
- Удалить `CommunityStory.publicActions` и тип `CommunityActions`
- Удалить импорт `UiBotButton` из `CommunityStory` если больше не нужен
- Спец-обработка `app:` в `BotController.#compressAction` — **оставить**
  (callback `app:main-menu` должен маршрутизироваться в AppController)

### FR4: Документация

- В `conductor/code_styleguides/skills/bot-user-story.md` добавить явный запрет:
  > `publicActions` используется **только для внутриконтроллерных** кросс-стори вызовов.
  > Межконтроллерные вызовы запрещены — префиксы и сжатие UUID привязаны к контроллеру.
- Обновить `conductor/code_styleguides/skills/bot-controller.md`

### FR5: Тесты

- E2E: убрать проверку `expect(btns.some(t => t.includes('Студенты'))).toBe(true)` —
  заменить на проверку клика по своей кнопке
- Интеграционные: убрать `MentorController` из `beforeAll` где он был нужен только для `getAction`
  - `view-stream.integration.test.ts`
  - `curious-showcase.e2e.test.ts`

## Критерии приёмки
- [ ] `bun lint` — чисто
- [ ] `bun tslint` — чисто
- [ ] `bun test` — все тесты проходят
- [ ] В карточке потока (S02) кнопка «Студенты» работает (свой обработчик)
- [ ] В карточке потока (S02) кнопка «Записаться» работает (свой обработчик)
- [ ] В карточке потока (S02m) кнопка «Студенты» работает (унаследованный обработчик)
- [ ] Кнопка «↩️ Главное меню» работает во всех местах
- [ ] `EnrollStory` удалён
- [ ] Нигде нет кросс-контроллерных `getAction`

## За рамками
- Не трогаем `cbFor` (внутриконтроллерный — работает)
- Не трогаем confirm-диалоги
- Не трогаем delegate
- Не трогаем `MonitorStory` (остаётся для менторского меню)
