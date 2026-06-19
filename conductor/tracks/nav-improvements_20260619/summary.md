# Итоговый отчёт трека: Навигация и очистка кнопок бота

## Цель
Улучшить UX навигации в Telegram-боте: кнопки «↩️ Главное меню» и «⬅️ Назад» на всех не-процессных экранах, удаление отработанных кнопок в CreateStreamStory, документация правил.

## Выполненные задачи

### Фаза 1: Инфраструктура `app:main-menu`
- `BotRouter.handleCallback` обрабатывает `app:main-menu` до поиска контроллера
- Пересобирает меню через `collectMainMenu()`, возвращает `mainMenu` в `BotResponse`
- `connectRouter` собирает клавиатуру из `mainMenu` и отправляет сообщение
- **НЕ** сбрасывает `activeHandler` — в отличие от `/start`

### Фаза 2: Кнопка «↩️ Главное меню» (UX-2)
- **CatalogStory** — кнопка последней строкой на `catalog:list`
- **LearningStory** — кнопка на `my-study`, `complete` (урок/проект/поток завершён)
- **Нет** кнопки на обычном шаге (пользователь в процессе)

### Фаза 3: Кнопка «⬅️ Назад» (UX-3)
- **ViewStreamStory** — `⬅️ Назад к списку` на `complete` и `archive`
- **ProgressStory** — `⬅️ Назад к обучению` на экране прогресса
- **MonitorStory** — `⬅️ Назад к потоку` на `students`
- **ActivateStreamStory** — `⬅️ Назад к потоку` на `activate`

### Фаза 4: removePrevKeyboard в CreateStreamStory (UX-5)
- Шаги 4–8: кнопки «Принять»/«Пропустить» удаляются после нажатия
- Шаг 9: кнопка «Пропустить» для группы удаляется
- Шаг 10 (превью): без удаления

### Фаза 5: Документация (UX-6, UX-7)
- Создан `packages/core/src/ui/bot/README.md` с правилами навигации
- Обновлён `packages/stream/src/user-stories.md`: убраны нереализованные кнопки, помечены запланированные фичи

### Фаза 6: Интеграционные и E2E тесты
- Обновлены 7 интеграционных тестов в `tests/bot/integration/stream/`
- Обновлены 2 E2E теста (`main-menu`, `user-flows`)

## Изменённые файлы

### Core
- `packages/core/src/ui/bot/types.ts` — поле `mainMenu` в `BotResponse`
- `packages/core/src/ui/bot/router/bot-router.ts` — обработка `app:main-menu`
- `packages/core/src/ui/bot/router/bot-router.test.ts` — тесты `app:main-menu`
- `packages/core/src/ui/bot/README.md` — документация правил навигации

### Stream
- `packages/stream/src/ui/bot/stories/catalog.story.ts` — кнопка «↩️ Главное меню»
- `packages/stream/src/ui/bot/stories/learning.story.ts` — кнопка «↩️ Главное меню»
- `packages/stream/src/ui/bot/stories/view-stream.story.ts` — кнопка «⬅️ Назад к списку»
- `packages/stream/src/ui/bot/stories/progress.story.ts` — кнопка «⬅️ Назад к обучению»
- `packages/stream/src/ui/bot/stories/monitor.story.ts` — кнопка «⬅️ Назад к потоку»
- `packages/stream/src/ui/bot/stories/activate-stream.story.ts` — кнопка «⬅️ Назад к потоку»
- `packages/stream/src/ui/bot/stories/create-stream.story.ts` — `removePrevKeyboard`
- Все соответствующие `.test.ts` файлы
- `packages/stream/src/user-stories.md` — актуализация

### U7-bot
- `apps/u7-bot/src/handlers/router.ts` — обработка `mainMenu` в connectRouter
- `apps/u7-bot/src/handlers/router.test.ts` — тест `app:main-menu`

### Интеграционные/E2E тесты
- `tests/bot/integration/stream/catalog.integration.test.ts`
- `tests/bot/integration/stream/view-stream.integration.test.ts`
- `tests/bot/integration/stream/learning.integration.test.ts`
- `tests/bot/integration/stream/progress.integration.test.ts`
- `tests/bot/integration/stream/monitor.integration.test.ts`
- `tests/bot/integration/stream/activate-stream.integration.test.ts`
- `tests/bot/integration/stream/create-stream.integration.test.ts`
- `tests/bot/e2e/main-menu.e2e.test.ts`
- `tests/bot/e2e/stream/user-flows.e2e.test.ts`

## Архитектурные решения
- `app:main-menu` обрабатывается на уровне `BotRouter` до поиска контроллера — не требует контроллера `app`
- `mainMenu` возвращается как отдельное поле `BotResponse`, а не как `sendMessage` — разделение ответственности
- Story сама решает об удалении кнопок (`removePrevKeyboard`), единого автоматизма нет
- Кнопки добавляются точечно в каждую Story, а не через общий механизм — гибкость

## Результаты тестирования
- 911 тестов проходят (core: 151, stream: 166, u7-bot: 32, course: 44, user: 19, onboarding: 14, app: 7, w3school: 7, интеграционные: 14 + E2E: 13)
- 0 ошибок
