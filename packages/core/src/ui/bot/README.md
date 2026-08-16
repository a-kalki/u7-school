# Правила навигации в Telegram-боте

## Когда добавлять кнопку «↩️ Главное меню»

Добавляется **последней строкой клавиатуры** — используй готовую кнопку
`buttons.mainMenu(text?)` (код `Routes.app.mainMenu` = `app:main-menu`) на экранах,
где пользователь находится в режиме навигации/просмотра:

- **CatalogStory** — `stream:catalog:list` (витрина потоков)
- **HubStory** — `learning:hub:my-study` (хаб «Моя учёба»)
- **StepViewStory** — после завершения урока/проекта/потока
- **ProgressStory** — `learning:progress:progress:<id>`

Канонический адрес живёт в реестре `Routes.app.mainMenu`, готовая кнопка —
`buttons.mainMenu(text?)` (`apps/u7-bot/src/controllers/shared/routes.ts`, `buttons.ts`).

## Когда добавлять кнопку «⬅️ Назад к {уровень}»

Добавляется на **тупиковых экранах**, где нет естественного перехода дальше:

| Story | Экран | Кнопка | Код |
|---|---|---|---|
| `view-stream` | `program`/`details`/`students` | `⬅️ Назад к списку` | `stream:catalog:list` |
| `progress` | `progress` | `⬅️ Назад к учёбе` | `learning:hub:my-study` |
| `nav-tree` | уровни дерева | `⬅️ Назад к …` | `learning:hub:my-study` |
| `monitor` | `students` | `⬅️ Назад к потоку` | `mentor:view-stream-mentor:view:<id>` |

## Когда НЕ добавлять кнопки «Назад»/«Главное меню»

**Пользователь в процессе** — акцент на текущем действии:

- **StepViewStory** — обычный шаг обучения
- **CreateStreamStory** — шаги wizard'а (свой поток с «Пропустить»/«Отмена»)
- **Onboarding** — все шаги анкеты (свой механизм навигации)
- Диалоги подтверждения (mark-abandoned, complete, выход из потока)

Пользователь всегда может использовать `/start` для возврата в главное меню.

## Как обрабатывается `Routes.app.mainMenu` (`app:main-menu`)

`Routes.app.mainMenu` — это `app:main-menu`: обычный callback, у которого первый сегмент (`app`) — имя
контроллера `AppController`:

1. `BotUiApp.handleCallback` маршрутизирует по `app` в `AppController`, остаток — `main-menu`.
2. `AppController.handleCallback('main-menu')` пересобирает главное меню через
   `collectAllMenuItems()` и возвращает `«Выберите действие:»` + клавиатуру.
3. `BotTransport.execute` отправляет/редактирует сообщение.

В отличие от `/start` (через `handleStart`), `Routes.app.mainMenu` **не** сбрасывает
`activeHandler`.

## Управление клавиатурой предыдущего сообщения

`BotTransport.execute` по умолчанию (когда `keepPrevKeyboard` не задан) удаляет
inline-клавиатуру у предыдущего сообщения бота (`lastBotMessage`) — через
`editMessageText` с `reply_markup: undefined`.

**Правило:** story сама решает, когда сохранять кнопки:

- `keepPrevKeyboard: true` — предыдущая клавиатура остаётся (если контекст её кнопок ещё актуален);
- не задано — клавиатура убирается.

См. [bot-architecture.md](../../../../../conductor/code_styleguides/bot-architecture.md).
