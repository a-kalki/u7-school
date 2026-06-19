# План реализации: Навигация и очистка кнопок бота

## Фаза 1: Инфраструктура — callback `app:main-menu`

- [x] Task: Написать тест: `BotRouter.handleCallback('app:main-menu')` пересобирает меню | `72847c6`
  - [ ] Вызывает `collectMainMenu()` и возвращает клавиатуру с пунктами меню
  - [ ] НЕ сбрасывает `activeHandler`
  - [ ] Работает без зарегистрированного контроллера `app`

- [x] Task: Реализовать обработку `app:main-menu` в BotRouter | `72847c6`
  - [ ] В `handleCallback` добавить ветку для `app:main-menu` до поиска контроллера
  - [ ] Собрать меню через `collectMainMenu()`, вернуть как `BotResponse`

- [ ] Task: Conductor - Ручная верификация 'app:main-menu'

## Фаза 2: Кнопка «↩️ Главное меню» (UX-2)

- [x] Task: Написать тест: CatalogStory добавляет «↩️ Главное меню» | `6f0a17a`
  - [x] Кнопка последней строкой клавиатуры
  - [x] code = `app:main-menu`

- [x] Task: Написать тест: LearningStory добавляет «↩️ Главное меню» | `33f84b9`
  - [ ] На `my-study` — кнопка есть
  - [ ] На `complete` → урок/проект завершён — кнопка есть
  - [ ] На `complete` → поток завершён — кнопка есть
  - [x] На `complete` → обычный шаг — кнопки НЕТ (пользователь в процессе)

- [x] Task: Добавить кнопку «↩️ Главное меню» в CatalogStory | `6f0a17a`
- [x] Task: Добавить кнопку «↩️ Главное меню» в LearningStory (my-study, level transitions, stream completed) | `33f84b9`

- [ ] Task: Conductor - Ручная верификация 'Главное меню'

## Фаза 3: Кнопка «⬅️ Назад» на тупиковых экранах (UX-3)

- [x] Task: Написать тест: ViewStreamStory complete/archive добавляют «⬅️ Назад к списку» | `c1c0c4f`
- [x] Task: Написать тест: ProgressStory добавляет «⬅️ Назад к обучению» | `c1c0c4f`
- [x] Task: Написать тест: MonitorStory students добавляет «⬅️ Назад к потоку» | `c1c0c4f`
- [x] Task: Написать тест: ActivateStreamStory добавляет «⬅️ Назад к потоку» | `c1c0c4f`

- [x] Task: Реализовать кнопки «⬅️ Назад» в ViewStreamStory (complete, archive) | `c1c0c4f`
- [x] Task: Реализовать кнопку «⬅️ Назад к обучению» в ProgressStory | `c1c0c4f`
- [x] Task: Реализовать кнопку «⬅️ Назад к потоку» в MonitorStory (students) | `c1c0c4f`
- [x] Task: Реализовать кнопку «⬅️ Назад к потоку» в ActivateStreamStory | `c1c0c4f`

- [ ] Task: Conductor - Ручная верификация 'Кнопки Назад'

## Фаза 4: Удаление отработанных кнопок в CreateStreamStory (UX-5)

- [x] Task: Написать тест: CreateStreamStory удаляет кнопки на шагах accept/skip | `80eeab6`
  - [x] Нажатие «Принять» / «Пропустить» → `removePrevKeyboard: true`
  - [x] Нажатие «Пропустить» для группы → `removePrevKeyboard: true`
  - [x] На шаге 10 (превью) — без изменений

- [x] Task: Добавить `removePrevKeyboard: true` в CreateStreamStory | `80eeab6`
  - [ ] В `#handleAcceptField`, `#handleSkipField`, `#handleSkipGroup`
  - [ ] В `#handleOptionalFieldInput` при переходе к следующему полю или группе

- [ ] Task: Conductor - Ручная верификация 'Очистка кнопок в wizard'

## Фаза 5: Документация и user-stories (UX-6, UX-7)

- [x] Task: Создать `packages/core/src/ui/bot/README.md` | `dbcb4a2`
  - [x] Правила добавления кнопок «Назад»/«Главное меню»
  - [x] Когда НЕ добавлять (процесс vs навигация)
  - [x] Как использовать `app:main-menu`
  - [x] Как story управляет `removePrevKeyboard`

- [x] Task: Обновить `packages/stream/src/user-stories.md` | `dbcb4a2`
  - [ ] US-4 п.5: убрать кнопку `[ ◀️ Назад ]`
  - [ ] US-4 п.9: пометить как «запланировано»
  - [ ] US-7 broadcast: пометить как «запланировано»
  - [ ] US-8 «Отстает»: пометить как «запланировано»
  - [ ] Добавить информацию о кнопке «↩️ Главное меню»

- [ ] Task: Conductor - Ручная верификация 'Документация'

## Фаза 6: Интеграционные и E2E тесты

- [x] Task: Обновить интеграционный тест Catalog (IT-1) | `f0c0c2a`
  - [x] Проверить кнопку «↩️ Главное меню» на catalog:list

- [x] Task: Обновить интеграционный тест ViewStream (IT-2) | `f0c0c2a`
  - [x] Проверить кнопку «⬅️ Назад к списку» на complete
  - [x] Проверить кнопку «⬅️ Назад к списку» на archive

- [x] Task: Обновить интеграционный тест Learning (IT-3) | `f0c0c2a`
  - [x] Проверить кнопку «↩️ Главное меню» на my-study

- [x] Task: Обновить интеграционный тест Progress (IT-4) | `f0c0c2a`
  - [x] Проверить кнопку «⬅️ Назад к обучению»

- [x] Task: Обновить интеграционный тест Monitor (IT-5) | `f0c0c2a`
  - [x] Проверить кнопку «⬅️ Назад к потоку» на students

- [x] Task: Обновить интеграционный тест ActivateStream (IT-6) | `f0c0c2a`
  - [x] Проверить кнопку «⬅️ Назад к потоку» на activate

- [x] Task: Обновить интеграционный тест CreateStream — removePrevKeyboard (IT-7) | `f0c0c2a`
  - [x] Проверить удаление кнопок после «Принять»

- [x] Task: Обновить E2E тест main-menu (E2E-1) | `f0c0c2a`
  - [x] Проверить `app:main-menu` пересобирает меню без сброса activeHandler

- [x] Task: Обновить E2E тест user-flows (E2E-2) | `f0c0c2a`
  - [x] Проверить кнопки в каталоге и прогрессе через E2E

- [ ] Task: Conductor - Ручная верификация 'Интеграционные/E2E тесты'
