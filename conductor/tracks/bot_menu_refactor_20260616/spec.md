# Спецификация: Рефакторинг главного меню бота

## Обзор

Рефакторинг архитектуры главного меню Telegram-бота: вынос всей логики системных сообщений (`/start`, `/help`, `app:main-menu`, `app:help`) из `connectRouter` и `BotRouter` в `AppController`. Введение интерфейса `MenuAggregator` для слабой связи между `AppController` и `BotRouter`.

## Функциональные требования

### FR1: Переменная SCHOOL_GROUP_URL обязательна
- `NEWS_GROUP_URL` переименован в `SCHOOL_GROUP_URL` в `.env.development` и `config.ts`
- Поле становится **обязательным** (не optional): приложение не стартует без него
- Значение `YOUR_BOT_TOKEN_HERE` и `YOUR_NEWS_GROUP_URL` заменены на реалистичные заглушки

### FR2: Кнопка «Сообщество школы»
- Кнопка «💬 Сообщество школы» — url-кнопка, priority 100 (внизу меню)
- Всегда отображается (SCHOOL_GROUP_URL обязателен)

### FR3: Кнопка «Помощь»
- Новая кнопка «❓ Помощь» в главном меню, priority 90 (внизу меню, над сообществом)
- Callback `app:help` — показывает инструкцию + список кнопок с описаниями

### FR4: Приветствие при /start
- Текст:
  > Привет, \<name\>! 👋
  >
  > Я бот-помощник школы «u7 schools» 🎓
  > Я проведу тебя от знакомства до обучения на курсах.
  >
  > Если ты здесь впервые — начни с кнопки «❓ Помощь», расскажу как всё устроено.
  > Если уже знаком — выбирай нужный раздел:

### FR5: Сообщение /help
- Заголовок-инструкция:
  > Как со мной работать? 🤔
  >
  > В основном ты будешь нажимать на кнопки — это быстро и удобно. Иногда я попрошу написать что-то самому (например, ответ на вопрос анкеты).
  >
  > 📌 После выбора кнопки я убираю клавиатуру и добавляю пометку «Вы выбрали: ...» — чтобы экран оставался чистым.
  > 📌 В некоторых сценариях (например, заполнение анкеты) работает команда /cancel — она вернёт тебя обратно к выбору.
  >
  > Вот что я умею:
- После заголовка — список кнопок с описаниями от всех контроллеров

### FR6: AppController — хозяин системных сообщений
- `handleWelcome(actor)` — возвращает BotResponse с приветствием и главным меню
- `handleHelpMessage(actor)` — возвращает BotResponse с инструкцией и списком описаний
- `handleCallback` — обрабатывает `main-menu` и `help` (через делегирование в `handleWelcome`/`handleHelpMessage`)
- Получает `MenuAggregator` при `init()` для сбора кнопок/описаний от других контроллеров

### FR7: MenuAggregator — интерфейс
```typescript
interface MenuAggregator {
  collectAllMenuItems(actor: User): Promise<MainMenuAction[]>;
  collectAllHelpDescriptions(actor: User): Promise<string[]>;
}
```
- Реализуется `BotRouter`-ом
- Передаётся в `AppController` при `init()`

### FR8: BotRouter — чистый роутинг
- `handleWelcome(actor)` — делегирует в `AppController.handleWelcome()`
- `handleHelp(actor)` — делегирует в `AppController.handleHelpMessage()`
- `handleCallback` — только маршрутизация по префиксу, без специальной обработки `app:main-menu`
- Реализует `MenuAggregator`

### FR9: connectRouter — чистый адаптер
- `/start` → `router.handleWelcome()` → `executeResponses()`
- `/help` → `router.handleHelp()` → `executeResponses()`
- `callback_query` → `router.handleCallback()` → `executeResponses()`
- Никаких пользовательских текстов, никакой сборки клавиатур, никакой обработки `response.mainMenu`

## Критерии приёмки

- [ ] `/start` показывает приветствие из FR4 + все кнопки меню
- [ ] `/help` показывает инструкцию из FR5 + описания всех кнопок
- [ ] Кнопка «❓ Помощь» видна в главном меню и работает
- [ ] Кнопка «💬 Сообщество школы» видна всегда и ведёт на URL
- [ ] `connectRouter` не содержит пользовательских текстов
- [ ] `BotRouter.handleCallback` не содержит специальной логики `app:main-menu`
- [ ] Приложение не стартует без `SCHOOL_GROUP_URL`
- [ ] Интеграционные/e2e тесты в `tests/bot` покрывают сценарии `/start`, `/help`, кнопок

## За рамками

- Изменение UI других контроллеров (Onboarding, Stream) — их `handleHelpStart` работают как есть
- Кнопка MonitorStory «📁 История шагов» — отдельный пункт в TODO
- `.env.production` — не трогаем, он на проде
