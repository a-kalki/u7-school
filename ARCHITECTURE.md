# Архитектура контроллеров бота — рефакторинг

## Задача

Модуль `stream` содержит 8 пользовательских сценариев (US-1...US-8, см. `packages/stream/src/user-stories.md`). При текущей архитектуре все они попадают в один класс `StreamController`, что приведёт к его неконтролируемому раздуванию.

Параллельно, слой бота (`apps/u7-bot`) содержит бизнес-логику:
- сам решает, какие кнопки показывать на `/start` (включая проверки ролей)
- управляет состоянием сессии (`menu: 'main' | 'onboarding' | 'create_stream'`)
- вручную маршрутизирует callback'и по `if/else`

**Цель:** вынести ВСЮ логику из бота в контроллеры, а внутри сложных контроллеров — в легковесные классы `BotUserStory`. Бот становится тонкой прослойкой, которая только резолвит `telegramId → User` и форвардит обновления.

---

## Ключевые решения

### 1. `BotController` и `BotUserStory` — иерархия префиксов

Каждый уровень добавляет свой префикс в `callback_data`, при получении снимает его:

```
Story генерирует:         "catalog:view:uuid"
Контроллер оборачивает:   "stream:catalog:view:uuid"
Бот видит:                "stream:catalog:view:uuid"
```

- `controller.name` — уникально в рамках приложения (проверяется при регистрации)
- `story.name` — уникально в рамках контроллера

Бот не гадает — первый сегмент callback'а однозначно указывает на контроллер.

### 2. `/start` — контроллеры отдают кнопки, бот собирает

Метод `handleStart(actor: User): Promise<MainMenuAction[]>` на каждом контроллере. Стори переопределяет `handleStart` если хочет показать кнопку (возвращает `MainMenuAction`). Контроллер собирает со всех своих стори, оборачивает префиксом, бот агрегирует со всех контроллеров и строит клавиатуру.

Бот **не знает** о ролях, кнопках, меню. Только собирает.

### 3. Захват ввода (`captureInput`) для wizard-диалогов

Когда стори начинает многошаговый диалог (например, создание потока), она возвращает:

```typescript
BotResponse {
  sendMessage: { text: 'Введите название потока:' },
  captureInput: {
    path: 'stream:create-stream',          // controller:story
    context: { step: 1, moduleId: '...' },  // собранные данные
    ttlSeconds: 300,                        // таймаут
  }
}
```

Бот записывает в сессию `activeHandler.path = 'stream:create-stream'`. Все последующие сообщения (текст, callback, файлы) форвардятся этому обработчику — **минуя** обычную маршрутизацию по префиксам. Стори сама разбирается, что делать с каждым типом обновления.

`captureInput` хранится в Grammy-сессии, которая изолирована по `chat_id`. Многопользовательность из коробки.

### 4. Освобождение ввода (`releaseInput`)

Стори возвращает `{ releaseInput: true }` — бот сбрасывает `activeHandler = null`.

### 5. Делегирование

После выполнения действия одна стори может передать управление другой (без участия пользователя):

```typescript
BotResponse {
  sendMessage: { text: '🎉 Вы записаны!' },
  delegate: {
    path: 'stream:learning:my-study',  // controller:story:cb_data
  }
}
```

Бот выполняет `sendMessage`, затем форвардит делегату. Один уровень, без рекурсии.

### 6. `/cancel` — универсальный

Бот всегда перехватывает `/cancel`. Если есть `activeHandler` — форвардит контроллеру, тот — стори. Если нет — сообщение «Нечего отменять».

```typescript
// BotUserStory (с переопределением по умолчанию):
async handleCancel(actor: User, api: ApiApp, session: SessionData): Promise<BotResponse> {
  return {
    sendMessage: { text: 'Действие отменено.' },
    releaseInput: true,
  };
}
```

### 7. Таймаут сессии

Бот проверяет `activeHandler.expiresAt` при каждом обновлении. Если истекло — вызывает `controller.handleTimeout(user, session)`, который делегирует стори. Стори может переопределить:

```typescript
async handleTimeout(actor: User, api: ApiApp, session: SessionData): Promise<BotResponse> {
  return {
    sendMessage: { text: '⏰ Время вышло. Начните заново через /start.' },
    releaseInput: true,
  };
}
```

### 8. `menu` в сессии — удаляется

Текущее поле `menu: 'main' | 'onboarding' | 'create_stream'` заменяется на `activeHandler`. Если `activeHandler === null` — пользователь в главном меню. Onboarding тоже переводится на `captureInput`.

### 9. Short ID — пока не нужен

UUID (36 символов) + префикс (~20 символов) = 56 символов. Telegram ограничивает `callback_data` 64 байтами (ASCII → 64 символа). Влазит.

Если в будущем потребуется длиннее — стори может хранить `Map<shortId, uuid>` в своём inMemory и передавать короткий ключ. При `/start` все стори получают `reset()` и очищают временные данные.

### 10. Типизация API-вызовов

Стори получает `ApiApp<TAppMeta>` через `init()`. Вызовы типизированы:

```typescript
const streams = await this.api.execute('list-streams', {});
//     ^ тип выводится автоматически из AppMeta
```

### 11. Все в `packages/core/src/ui/`

Базовые классы `BotController`, `BotUserStory`, типы `BotResponse`, `SessionData`, `MainMenuAction`, `ControllerRegistry` — в core. Контроллеры и стори модулей — в своих пакетах.

### 12. Не все контроллеры обязаны использовать UserStory

Если контроллер небольшой (например, Onboarding — один бизнес-процесс «анкета»), он может реализовать всю логику напрямую в методах `handleCallback`, `handleMessage`, `handleStart`, без разбиения на стори. `stories` в таком случае — пустой массив. UserStory — опциональная абстракция для сложных контроллеров (Stream).

---

## Типы и интерфейсы

### `BotUpdate` (расширенный)

```typescript
type BotUpdate =
  | { type: 'command'; command: string; telegramId: number }
  | { type: 'message'; text: string; telegramId: number }
  | { type: 'callback'; data: string; telegramId: number; messageId: number }
  | { type: 'document'; fileId: string; fileName: string; telegramId: number }
  | { type: 'photo'; fileId: string; telegramId: number }
  | { type: 'voice'; fileId: string; telegramId: number };
```

### `BotResponse` (расширенный)

```typescript
interface BotResponse {
  sendMessage?: SendMessageDescription;
  sendMessages?: SendMessageDescription[];
  editMessage?: EditMessageDescription;

  /** Захватить управление (wizard) */
  captureInput?: {
    path: string;              // "controller:story"
    context?: Record<string, unknown>;
    ttlSeconds?: number;       // default 300
  };

  /** Освободить управление */
  releaseInput?: boolean;

  /** Делегировать обработку другой стори */
  delegate?: {
    path: string;              // "controller:story:cb_data"
  };
}
```

### `SessionData` (новая)

```typescript
interface SessionData {
  activeHandler?: {
    path: string;              // "controller:story"
    context?: Record<string, unknown>;
    expiresAt: number;         // timestamp ms
  } | null;
}
```

### `MainMenuAction`

```typescript
interface MainMenuAction {
  text: string;       // "📚 Наши потоки"
  action: string;     // полный callback: "stream:catalog:list"
  priority: number;   // порядок в меню (меньше = выше)
}
```

### `BotController` (новая версия)

```typescript
abstract class BotController<TAppMeta extends AppMeta> {
  abstract readonly name: string;

  /** Стори, зарегистрированные в контроллере */
  protected abstract stories: BotUserStory<TAppMeta>[];

  /** Вызывается ботом при инициализации приложения */
  init(api: ApiApp<TAppMeta>): void;

  // ── Маршрутизация ──

  /** Обработать callback (data уже без префикса контроллера) */
  async handleCallback(data: string, actor: User, session: SessionData): Promise<BotResponse>;

  /** Обработать сообщение (когда контроллер активен через captureInput) */
  async handleMessage(update: BotUpdate, actor: User, session: SessionData): Promise<BotResponse>;

  // ── Жизненный цикл ──

  /** Кнопки для главного меню (/start) */
  async handleStart(actor: User): Promise<MainMenuAction[]>;

  /** Отмена текущего действия */
  async handleCancel(actor: User, session: SessionData): Promise<BotResponse>;

  /** Таймаут активного обработчика */
  async handleTimeout(actor: User, session: SessionData): Promise<BotResponse>;

  /** Сброс временных данных всех стори (вызывается при /start) */
  reset(): void;

  // ── Хелперы ──

  /** Оборачивает action в полный callback-путь: "controller:action" */
  protected cb(action: string): string;

  /** Снимает префикс контроллера: "controller:rest" → "rest" */
  protected stripPrefix(data: string): string;

  /** Найти стори по имени */
  protected findStory(name: string): BotUserStory<any> | undefined;
}
```

### `BotUserStory<TAppMeta>`

```typescript
abstract class BotUserStory<TAppMeta extends AppMeta> {
  abstract readonly name: string;

  /** Ссылка на ApiApp (устанавливается в init) */
  protected api!: ApiApp<TAppMeta>;

  /** Short ID → значение. Для сжатия длинных callback_data */
  protected shortIds: Map<string, string>;

  /** Вызывается контроллером при init */
  init(api: ApiApp<TAppMeta>): void;

  // ── Обработка обновлений ──

  /** Обработать callback (data уже без префикса стори) */
  async handleCallback(action: string, actor: User, session: SessionData): Promise<BotResponse>;

  /** Обработать сообщение (когда стори активна через captureInput) */
  async handleMessage(update: BotUpdate, actor: User, session: SessionData): Promise<BotResponse>;

  // ── Жизненный цикл ──

  /** Кнопка в главном меню. null → не показывать */
  async handleStart(actor: User): Promise<MainMenuAction | null>;

  /** Отмена (когда стори активна) */
  async handleCancel(actor: User, session: SessionData): Promise<BotResponse>;

  /** Таймаут (когда стори активна) */
  async handleTimeout(actor: User, session: SessionData): Promise<BotResponse>;

  /** Сброс временных данных (вызывается при /start) */
  reset(): void;

  // ── Хелперы ──

  /** Оборачивает action: "story:action" */
  protected cb(action: string): string;

  /** Снимает префикс стори: "story:rest" → "rest" */
  protected stripPrefix(data: string): string;

  /** Сократить значение для callback_data */
  protected shrink(key: string, value: string): string;

  /** Восстановить значение из short ID */
  protected expand(key: string): string | undefined;
}
```

### `ControllerRegistry`

```typescript
class ControllerRegistry {
  register(controller: BotController<AppMeta>): void;
  get(name: string): BotController<AppMeta> | undefined;
  getAll(): BotController<AppMeta>[];
}
```

---

## Поток обработки обновления ботом

```
Пользователь → Telegram
       │
       ▼
  ┌─────────────────────────────────────┐
  │  Бот (apps/u7-bot)                  │
  │                                      │
  │  1. Резолвит telegramId → User      │
  │     (через UserFacade)               │
  │                                      │
  │  2. Это команда?                     │
  │     /start → агрегирует handleStart  │
  │              всех контроллеров       │
  │     /cancel → handleCancel активного │
  │               контроллера (если есть)│
  │                                      │
  │  3. Есть activeHandler?              │
  │     ── ДА: форвардит обновление      │
  │            контроллеру из path       │
  │            (handleMessage)            │
  │     ── НЕТ: смотрит на тип:          │
  │        · callback → ищет контроллер  │
  │          по первому сегменту data,   │
  │          форвардит (handleCallback)   │
  │        · message → игнорирует или     │
  │          предлагает нажать /start     │
  │                                      │
  │  4. Применяет BotResponse:           │
  │     · sendMessage/editMessage        │
  │     · captureInput → сессия          │
  │     · releaseInput → сброс сессии    │
  │     · delegate → форвардит делегату  │
  └─────────────────────────────────────┘
```

---

## Этапы реализации

### Этап 1: Базовые классы в core

**Файлы:**
- `packages/core/src/ui/bot/controller/bot-controller.ts` — обновить
- `packages/core/src/ui/bot/story/bot-user-story.ts` — новый
- `packages/core/src/ui/bot/types.ts` — обновить (BotResponse, SessionData, MainMenuAction, BotUpdate)
- `packages/core/src/ui/bot/registry/controller-registry.ts` — новый
- `packages/core/src/ui/index.ts` — обновить экспорты

**Что делаем:**
- Создаём `BotUserStory<TAppMeta>` с методами: `handleCallback`, `handleMessage`, `handleStart`, `handleCancel`, `handleTimeout`, `reset`, `cb`, `stripPrefix`, `shrink`, `expand`
- Расширяем `BotResponse` полями `captureInput`, `releaseInput`, `delegate`
- Добавляем `SessionData` с `activeHandler`
- `ControllerRegistry` — Map-based реестр с проверкой уникальности имён

### Этап 2: Рефакторинг бота

**Файлы:**
- `apps/u7-bot/src/context.ts` — новая `SessionData`
- `apps/u7-bot/src/bot.ts` — без изменений (Grammy уже настроен)
- `apps/u7-bot/src/main.ts` — регистрация контроллеров в реестре
- `apps/u7-bot/src/handlers/dispatcher.ts` — **новый**: универсальный диспетчер
- `apps/u7-bot/src/handlers/top-menu-handler.ts` — удалить логику меню, оставить только диспетчеризацию
- `apps/u7-bot/src/handlers/onboarding-handler.ts` — удалить, заменить диспетчером
- `apps/u7-bot/src/handlers/stream-handler.ts` — удалить, заменить диспетчером

**Что делаем:**
- `dispatcher.ts` — единый обработчик, реализующий схему из раздела «Поток обработки»
- Резолв `telegramId → User` через `UserFacade` (один раз на входе)
- `/start` собирает `handleStart` со всех контроллеров, строит клавиатуру
- Все callback'и маршрутизируются по префиксу
- `captureInput`/`releaseInput` управляют `session.activeHandler`
- Удаляем `menu` из `SessionData`

### Этап 3: Миграция StreamController на BotUserStory

**Файлы:**
- `packages/stream/src/ui/bot/stories/catalog.story.ts` — новый (US-1: список потоков)
- `packages/stream/src/ui/bot/stories/view-stream.story.ts` — новый (US-2: карточка потока)
- `packages/stream/src/ui/bot/stories/enroll.story.ts` — новый (US-3: запись на поток)
- `packages/stream/src/ui/bot/stories/learning.story.ts` — новый (US-4: прохождение шагов)
- `packages/stream/src/ui/bot/stories/progress.story.ts` — новый (US-5: прогресс)
- `packages/stream/src/ui/bot/stories/create-stream.story.ts` — новый (US-6: создание потока, wizard)
- `packages/stream/src/ui/bot/stories/activate-stream.story.ts` — новый (US-7: запуск потока)
- `packages/stream/src/ui/bot/stories/monitor.story.ts` — новый (US-8: мониторинг студентов)
- `packages/stream/src/ui/bot/controller/stream-controller.ts` — переписать как тонкий реестр

**Что делаем:**
- Каждая стори — отдельный файл, наследует `BotUserStory<StreamAppMeta>`
- `StreamController` — только список стори + делегирование
- `handleStart` собирает кнопки от стори: «Наши потоки», «Моя учёба» (если STUDENT), «Панель ментора» (если MENTOR/ADMIN)
- US-6 (создание потока) использует `captureInput` для пошагового wizard'а
- Проверка: все тесты `stream-controller.test.ts` должны проходить

### Этап 4: Миграция OnboardingController (без UserStory)

**Файлы:**
- `packages/onboarding/src/ui/bot/controller/onboarding-controller.ts` — переписать под новый `BotController`

**Что делаем:**
- `OnboardingController` наследует `BotController<OnboardingBotAppMeta>`, `stories = []`
- Вся логика анкеты — напрямую в `handleCallback`, `handleMessage`, `handleStart`
- Кнопка «Заполнить анкету» — из `handleStart`
- Состояние анкеты — через `captureInput`, вместо `menu: 'onboarding'`
- Проверка: существующие тесты `onboarding-controller.test.ts` проходят

### Этап 5: Чистка и финализация

**Файлы:**
- `apps/u7-bot/src/handlers/top-menu-handler.ts` — удалить
- `apps/u7-bot/src/handlers/onboarding-handler.ts` — удалить
- `apps/u7-bot/src/handlers/stream-handler.ts` — удалить
- Тесты на диспетчер

**Что делаем:**
- Удаляем старые handler'ы, бот использует только `dispatcher.ts`
- Финальное тестирование: все тесты проходят, приложение запускается и работает идентично текущему поведению

---

## Риски и открытые вопросы

1. **Обратная совместимость в core.** Изменение `BotController` сломает `OnboardingController` и `StreamController`. Миграцию нужно делать атомарно (все этапы в одной ветке).

2. **Grammy сессия.** `activeHandler` требует, чтобы Grammy-сессия работала и сохранялась между запросами. Сейчас это in-memory (дефолт). Для продакшена нужен адаптер (Redis, файл). Но это за рамками данной задачи.

3. **Типизация `ApiApp` в стори.** `BotUserStory<TAppMeta>` требует, чтобы `AppMeta` модуля был известен на уровне стори. Для `stream` это `StreamAppMeta`. Нужно будет определить `StreamAppMeta` как объединение `StreamApiModuleMeta` и `UserApiModuleMeta` (аналогично `OnboardingBotAppMeta`).

4. **Порядок кнопок в `/start`.** Приоритет через `priority: number`. Нужно договориться о значениях: например, 10 = публичные, 20 = студент, 30 = ментор, 100 = системные.

5. **Несколько ботов.** Если в будущем появятся другие боты (не только Telegram), то `BotUserStory` специфичен для бота. Для CLI будут свои `CliUserStory`. Это учтено в naming.
