# BotController — Styleguide

**Назначение:** контроллер Telegram-бота — реестр сторис, диспетчер callback/message, владелец сжатия id и обработки ошибок. Базовый класс: `packages/core/src/ui/bot/controller/bot-controller.ts`.

---

## 1. Иерархия контроллеров

```
BotController<TAppMeta, TActor>                        (core, абстрактный)
  └─ U7BotController                                    (apps/u7-bot) — закрывает U7BotAppMeta + User
       ├─ StreamController                             (stream) — реестр доменных сторис
       ├─ CourseController                             (course) — реестр доменных сторис
       ├─ OnboardingController                         (onboarding) — логика без сторис
       └─ AppController                                (app) — системные сценарии (/start, /help, сообщество)
```

- **`BotController`** (`@u7-scl/core/ui`) — базовый класс. Общие механизмы: сжатие id, диспетчеризация в сторис, `handleError`, главное меню, `publicActions`-геттер.
- **`U7BotController`** (`@u7-scl/bot`) — специализация для U7-бота: фиксирует `TAppMeta = U7BotAppMeta`, `TActor = User`.
- **Доменные контроллеры** (`StreamController` и т.п.) — тонкий реестр: объявляют `name` и массив `stories`, делегируют всю логику в `U7BotUserStory`.
- **`OnboardingController`** — пример контроллера **без сторис**: вшивает логику анкеты напрямую, использует `this.cb()` для формирования callback.
- **`AppController`** (`apps/u7-bot/src/app/controller.ts`) — контроллер уровня приложения для сценариев, не привязанных к доменному модулю: приветствие `/start` (`handleWelcome`), помощь `/help` (`handleHelpMessage`), кнопка «Сообщество школы». Переопределяет `handleCallback` для `app:main-menu` и `app:help`.

---

## 2. Ключевые правила

1. **Контроллер тонкий.** Доменный контроллер — только `name` + `stories`. Вся логика сценария — в `BotUserStory`.
2. **Стори не знают ни имени контроллера, ни сжатия.** Стори оперируют реальными UUID; контроллер на выходе сжимает id и добавляет префикс, на входе разжимает обратно.
3. **Один контроллер = один модуль** (кроме `AppController` — уровень приложения).
4. **Необработанные ошибки стори** перехватываются в `handleCallback`/`handleMessage` и идут в `handleError`.

---

## 3. Конструктор и init

```typescript
init(appApi: ApiApp<TAppMeta>, uiApp: UiApp<TAppMeta, TActor>): void  // API приложения + UiApp; каскадно в стори
reset(): void                                                           // сброс shortIds и временного состояния стори
```

`init()` вызывается при создании `UiApp` (каскадно из `UiApp.init()`). `AppController` дополнительно получает `MenuAggregator` через `initMenuAggregator()`.

Контроллер сохраняет обе зависимости:
- `this.appApi` — для межмодульных вызовов (`appApi.execute(...)`)
- `this.uiApp` — для кросс-стори ссылок (`uiApp.getAction<T>(name)`)

---

## 4. Обработчики

| Метод | Назначение |
|---|---|
| `handleCallback(data, actor, session)` | Снимает префикс стори, разжимает id, делегирует в стори, сжимает ответ |
| `handleMessage(update, actor, session)` | Делегирует активной стори по `session.activeHandler.path` |
| `handleStart(actor)` | Агрегирует кнопки главного меню от всех стори, добавляет префикс `name:` |
| `handleWelcome` / `handleHelpMessage` | Системные сообщения (переопределяет `AppController`) |
| `handleCancel` / `handleTimeout` | Делегируют активной стори или освобождают ввод |

Диспетчеризация callback: ищет стори по префиксу `${story.name}:`. Если не найдено — `⚠️ Неизвестная команда`.

---

## 5. Сжатие id

UUID → первые 8 hex-символов через общую мапу `shortIds`. На входе разжимается обратно. Гарантирует `callback_data` ≤ 64 байт. При коллизии добавляется цифровой суффикс.

Если после разжатия остались неразрешённые 8-hex ключи (кнопка устарела после перезапуска) — возвращается сообщение «Кнопка устарела, нажмите /start».

---

## 6. `publicActions`

Контроллер предоставляет геттер `publicActions`, агрегирующий `publicActions` своих стори:

```typescript
get publicActions(): Record<string, Record<string, UiCallbackFactory>> {
  // { storyName: { actionName: factory } }
}
```

Используется `UiApp` при инициализации для построения глобального реестра. Сами стори объявляют `publicActions` как плоский объект `{ actionName: factory }`.

Для кросс-стори ссылок потребители используют `this.uiApp.getAction<T>(name)`.

---

## 7. handleError

Универсальный обработчик ошибок. Различает типы через `fromError()` из `domain/errors/error-helpers.ts`:

| kind | Действие |
|---|---|
| `validation` | Перечисляет поля из `payload.issues` |
| `not-found`, `conflict`, `access-denied`, `bad-request` | Текст ошибки |
| `internal`, `unauthorized`, default | Логирует через `logger.error` + общее сообщение |

Все сообщения — в MarkdownV2 с экранированием. См. [errors.md](./errors.md) для контракта `AppError`.

---

## 8. Тестирование

См. [bot-test.md](../bot-test.md) — уровни тестирования (unit сторис, интеграционные с реальным контроллером, E2E).

---

## Связанные файлы

- [BotUserStory](./bot-user-story.md) — стиль написания сторис
- [Ошибки](./errors.md) — `AppError`, `fromError()`
- [Тестирование бота](../bot-test.md)
