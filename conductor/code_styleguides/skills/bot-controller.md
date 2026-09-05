# BotController — Styleguide

**Назначение:** контроллер Telegram-бота — реестр сторис, диспетчер callback/message, владелец префиксации кнопок и обработки ошибок. Базовый класс: `packages/core/src/ui/bot/controller/bot-controller.ts`.

> Сжатие/разжатие UUID живёт не здесь, а в `BotTransport`. Общий разрез слоёв —
> см. [bot-architecture.md](../bot-architecture.md).

---

## 1. Иерархия контроллеров

```
BotController<TAppMeta, TActor>                        (core, абстрактный)
  └─ U7BotController                                    (apps/u7-bot) — закрывает U7BotAppMeta + User
       ├─ StreamsController                            (apps/u7-bot) — реестр доменных сторис
       ├─ UserController                                (apps/u7-bot) — доставка уведомлений (сторя notify)
       ├─ CoursesController                            (apps/u7-bot) — реестр доменных сторис
       ├─ LearningController                           (apps/u7-bot) — реестр доменных сторис
       ├─ MentorController                             (apps/u7-bot) — реестр доменных сторис
       ├─ QuestionnaireController                      (apps/u7-bot) — реестр стори анкеты
       ├─ OnboardingController                         (apps/u7-bot) — логика без сторис
       └─ AppController                                (apps/u7-bot) — системные сценарии (/start, /help, сообщество)
```

- **`BotController`** (`@u7-scl/core/ui`) — базовый класс. Общие механизмы: префиксация кнопок, диспетчеризация в сторис, `handleError`.
- **`U7BotController`** (`@u7-scl/bot/u7-bot-controller`) — специализация для U7-бота: фиксирует `TAppMeta = U7BotAppMeta`, `TActor = User`, добавляет систему меню (`handleStart`, `handleWelcome`, `handleHelpMessage`, `uiApp`).
- **Доменные контроллеры** (`StreamsController` и т.п.) — тонкий реестр: объявляют `name` и массив `stories`, делегируют всю логику в `U7BotUiStory`.
- **`OnboardingController`** — пример контроллера **без сторис**: вшивает логику анкеты напрямую, использует `this.cb()` для формирования callback.
- **`AppController`** (`apps/u7-bot/src/controllers/app/app-controller.ts`) — контроллер уровня приложения для сценариев, не привязанных к доменному модулю: приветствие `/start` (`handleWelcome`), помощь `/help` (`handleHelpMessage`), кнопка «Сообщество школы». Переопределяет `handleCallback` для `main-menu` и `help`.

---

## 2. Ключевые правила

1. **Контроллер тонкий.** Доменный контроллер — только `name` + `stories`. Вся логика сценария — в `BotUiStory`.
2. **Стори не знают имени контроллера.** Стори возвращают коды без префикса (`story:action`); контроллер на выходе добавляет префикс `name:` через `#prefixResponse`/`#prefixCode`. Сжатие/разжатие UUID — зона `BotTransport`, не стори и не контроллера.
3. **Один контроллер = один модуль** (кроме `AppController` — уровень приложения).
4. **Необработанные ошибки стори** перехватываются в `handleCallback`/`handleMessage` и идут в `handleError`.
5. **Кросс-контроллерные коды.** Код с префиксом другого контроллера (`app:main-menu`) проходит префиксацию без изменений (`#prefixCode` видит, что первый сегмент — не стори текущего контроллера). Для кросс-контроллерных переходов используй реестр `Routes` (`apps/u7-bot/src/controllers/shared/routes.ts`) и готовые кнопки `buttons.mainMenu(text?)` (`apps/u7-bot/src/controllers/shared/buttons.ts`). `delegate.path` — всегда полный маршрут `controller:story:action:...`: стори пишет относительный путь через `this.cb`/`this.cbFor`, контроллер префиксует его в `#prefixResponse`.

---

## 3. Конструктор и init

```typescript
init(resolve: TResolve): void  // eventBus + appApi + actorResolver (+ uiApp в U7); каскадно в стори
reset(): void                  // сброс временного состояния стори
```

`init()` вызывается при создании `UiApp` (каскадно из `UiApp.init()`). `reset()` вызывает `reset()` у всех стори — сжатые id и `BotSession`-состояние здесь **не** сбрасываются (они в `BotTransport`).

Контроллер сохраняет зависимости:
- `this.appApi` — для межмодульных вызовов (`appApi.execute(...)`)
- `this.uiApp` — только в `U7BotController`: сбор меню и доступ к контроллерам (`uiApp.getController(name)`)

---

## 4. Обработчики

| Метод | Назначение |
|---|---|
| `handleCallback(data, actor, session)` | Снимает префикс стори, делегирует в стори, префиксирует коды ответа |
| `handleMessage(update, actor, session)` | Делегирует стори по `session.dialog.path`; `null` — стори отказалась |
| `handleCancel(actor, session)` | Делегирует стори по `dialog.path` |
| `handleStart(actor)` (U7) | Агрегирует кнопки главного меню от всех стори, добавляет префикс `name:` |
| `handleWelcome` / `handleHelpMessage` (U7) | `Promise<Screen \| null>` — экраны меню/справки (переопределяет `AppController`) |

Диспетчеризация callback: ищет стори по префиксу `${story.name}:`. Если не найдено —
ответ пустой (`null`), апдейт игнорируется молча. Все сигнатуры принимают `BotSession`.

---

## 5. Префиксация кнопок

`handleCallback`/`handleMessage`/`handleCancel` возвращают ответ стори
(`DialogResponse`) **с уже добавленным префиксом** `name:` (`#prefixResponse`):
префиксуются клавиатуры `screen`/`info` и `delegate.path`. Механику рендера
(edit/send/finalize/retire) контроллер не знает — это транспорт.

- `story:action` → `name:story:action` (стори текущего контроллера).
- `app:main-menu` → без изменений (кросс-контроллерный код).

Сжатие UUID до ≤ 64 байт происходит позже, в `BotTransport` (`compressCommand`/
`shrink` на отправке, `expandAction` на входе callback). См.
[bot-architecture.md](../bot-architecture.md), §4.

---

## 6. handleError

Универсальный обработчик ошибок. Различает типы через `fromError()` из `domain/errors/error-helpers.ts`:

| kind | Действие |
|---|---|
| `validation` | Перечисляет поля из `payload.issues[].path` |
| `not-found`, `conflict`, `access-denied`, `bad-request` | Текст ошибки |
| `internal`, `unauthorized`, default | Логирует через `logger.error` + общее сообщение |

`handleError` возвращает `DialogResponse`-экран; тексты — `MdText` через `md` (см. [bot-ui-story.md](./bot-ui-story.md), §4). См. [errors.md](./errors.md) для контракта `AppError`.

---

## 7. Тестирование

См. [bot-test.md](../bot-test.md) — уровни тестирования (unit сторис, интеграционные через BotTransport, E2E).

---

## Связанные файлы

- [BotUiStory](./bot-ui-story.md) — стиль написания сторис
- [Ошибки](./errors.md) — `AppError`, `fromError()`
- [Тестирование бота](../bot-test.md)
- [Архитектура bot-level](../bot-architecture.md)
