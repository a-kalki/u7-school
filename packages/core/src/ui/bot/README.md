# Правила навигации в Telegram-боте

## Когда добавлять кнопку «↩️ Главное меню»

Добавляется **последней строкой клавиатуры** с кодом `app:main-menu` на экранах,
где пользователь находится в режиме навигации/просмотра:

- **CatalogStory** — `catalog:list` (витрина потоков)
- **LearningStory**:
  - `my-study` (текущий шаг)
  - `complete` → урок завершён
  - `complete` → проект завершён
  - `complete` → поток завершён

## Когда добавлять кнопку «⬅️ Назад к {уровень}»

Добавляется на **тупиковых экранах**, где нет естественного перехода дальше:

| Story | Экран | Кнопка | Код |
|---|---|---|---|
| `view-stream` | `complete` | `⬅️ Назад к списку` | `catalog:list` |
| `view-stream` | `archive` | `⬅️ Назад к списку` | `catalog:list` |
| `progress` | `progress` | `⬅️ Назад к обучению` | `learning:my-study` |
| `monitor` | `students` | `⬅️ Назад к потоку` | `view-stream:view:{id}` |
| `activate-stream` | `activate` | `⬅️ Назад к потоку` | `view-stream:view:{id}` |

## Когда НЕ добавлять кнопки «Назад»/«Главное меню»

**Пользователь в процессе** — акцент на текущем действии:

- **LearningStory** — `complete` → обычный шаг (студент в процессе обучения)
- **CreateStreamStory** — шаги 0–10 (пользователь в wizard-процессе)
- **Onboarding** — все шаги (свой механизм навигации)
- **EnrollStory** — `enroll` (делегирует в `learning:my-study`)

Пользователь всегда может использовать `/start` для возврата в главное меню.

## Как использовать `app:main-menu`

Специальный callback `app:main-menu` обрабатывается в `BotRouter.handleCallback`:
- Пересобирает главное меню через `collectMainMenu()`
- Возвращает `{ mainMenu: { actions: [...] } }` в `BotResponse`
- `connectRouter` (GrammY-адаптер) собирает клавиатуру и отправляет сообщение
- **НЕ** сбрасывает `activeHandler` — в отличие от `/start`

## Как story управляет `removePrevKeyboard`

`removePrevKeyboard: true` в `BotResponse` указывает `executeResponses` удалить
inline-клавиатуру у предыдущего сообщения бота (через `editMessageText` с `reply_markup: undefined`).

**Правило:** story сама решает, когда удалять кнопки. Единого автоматизма нет.

Текущее использование:
- **CreateStreamStory** — шаги 4–9: при нажатии «Принять»/«Пропустить» кнопки удаляются
- Шаг 10 (превью) — без удаления (новый экран с кнопками «Подтвердить»/«Отмена»)
