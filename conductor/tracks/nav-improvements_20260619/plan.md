# План реализации: Навигация и очистка кнопок бота

## Фаза 1: Инфраструктура — callback `app:main-menu`

- [ ] Task: Написать тест: `BotRouter.handleCallback('app:main-menu')` пересобирает меню
  - [ ] Вызывает `collectMainMenu()` и возвращает клавиатуру с пунктами меню
  - [ ] НЕ сбрасывает `activeHandler`
  - [ ] Работает без зарегистрированного контроллера `app`

- [ ] Task: Реализовать обработку `app:main-menu` в BotRouter
  - [ ] В `handleCallback` добавить ветку для `app:main-menu` до поиска контроллера
  - [ ] Собрать меню через `collectMainMenu()`, вернуть как `BotResponse`

- [ ] Task: Conductor - Ручная верификация 'app:main-menu'

## Фаза 2: Кнопка «↩️ Главное меню» (UX-2)

- [ ] Task: Написать тест: CatalogStory добавляет «↩️ Главное меню»
  - [ ] Кнопка последней строкой клавиатуры
  - [ ] code = `app:main-menu`

- [ ] Task: Написать тест: LearningStory добавляет «↩️ Главное меню»
  - [ ] На `my-study` — кнопка есть
  - [ ] На `complete` → урок/проект завершён — кнопка есть
  - [ ] На `complete` → поток завершён — кнопка есть
  - [ ] На `complete` → обычный шаг — кнопки НЕТ (пользователь в процессе)

- [ ] Task: Добавить кнопку «↩️ Главное меню» в CatalogStory
- [ ] Task: Добавить кнопку «↩️ Главное меню» в LearningStory (my-study, level transitions, stream completed)

- [ ] Task: Conductor - Ручная верификация 'Главное меню'

## Фаза 3: Кнопка «⬅️ Назад» на тупиковых экранах (UX-3)

- [ ] Task: Написать тест: ViewStreamStory complete/archive добавляют «⬅️ Назад к списку»
- [ ] Task: Написать тест: ProgressStory добавляет «⬅️ Назад к обучению»
- [ ] Task: Написать тест: MonitorStory students добавляет «⬅️ Назад к потоку»
- [ ] Task: Написать тест: ActivateStreamStory добавляет «⬅️ Назад к потоку»

- [ ] Task: Реализовать кнопки «⬅️ Назад» в ViewStreamStory (complete, archive)
- [ ] Task: Реализовать кнопку «⬅️ Назад к обучению» в ProgressStory
- [ ] Task: Реализовать кнопку «⬅️ Назад к потоку» в MonitorStory (students)
- [ ] Task: Реализовать кнопку «⬅️ Назад к потоку» в ActivateStreamStory

- [ ] Task: Conductor - Ручная верификация 'Кнопки Назад'

## Фаза 4: Удаление отработанных кнопок в CreateStreamStory (UX-5)

- [ ] Task: Написать тест: CreateStreamStory удаляет кнопки на шагах accept/skip
  - [ ] Нажатие «Принять» / «Пропустить» → `removePrevKeyboard: true`
  - [ ] Нажатие «Пропустить» для группы → `removePrevKeyboard: true`
  - [ ] На шаге 10 (превью) — без изменений

- [ ] Task: Добавить `removePrevKeyboard: true` в CreateStreamStory
  - [ ] В `#handleAcceptField`, `#handleSkipField`, `#handleSkipGroup`
  - [ ] В `#handleOptionalFieldInput` при переходе к следующему полю или группе

- [ ] Task: Conductor - Ручная верификация 'Очистка кнопок в wizard'

## Фаза 5: Документация и user-stories (UX-6, UX-7)

- [ ] Task: Создать `packages/core/src/ui/bot/README.md`
  - [ ] Правила добавления кнопок «Назад»/«Главное меню»
  - [ ] Когда НЕ добавлять (процесс vs навигация)
  - [ ] Как использовать `app:main-menu`
  - [ ] Как story управляет `removePrevKeyboard`

- [ ] Task: Обновить `packages/stream/src/user-stories.md`
  - [ ] US-4 п.5: убрать кнопку `[ ◀️ Назад ]`
  - [ ] US-4 п.9: пометить как «запланировано»
  - [ ] US-7 broadcast: пометить как «запланировано»
  - [ ] US-8 «Отстает»: пометить как «запланировано»
  - [ ] Добавить информацию о кнопке «↩️ Главное меню»

- [ ] Task: Conductor - Ручная верификация 'Документация'
