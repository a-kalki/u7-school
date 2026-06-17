# Тестирование Telegram-бота (bot-test) — Styleguide

**Назначение:** правила и структура тестирования UI-слоя Telegram-бота на всех трёх уровнях: unit, интеграционном и сквозном (E2E).

---

## 1. Уровни тестирования

| Уровень | Расположение | Что проверяет | Моки |
|---------|-------------|---------------|:----:|
| **Unit** | `packages/<module>/src/ui/bot/stories/*.test.ts` | Логика одной стори или контроллера в изоляции | ✅ Мокаются `moduleApi` и `appApi` |
| **Интеграционный** | `tests/bot/integration/<module>/*.integration.test.ts` | Обработчик стори + реальные JSON-репозитории + межмодульные вызовы | ❌ Без моков |
| **E2E (сквозной)** | `tests/bot/e2e/<module>/*.e2e.test.ts` | Полные пользовательские цепочки: нажатие кнопки → извлечение `code` → следующее нажатие | ❌ Без моков |

---

## 2. Структура директорий

```
tests/bot/
├── helpers/
│   ├── test-app.ts            # createTestApp() — фабрика ApiApp с временными репозиториями
│   └── fixture-loader.ts      # loadFixtures() — копирует templates → /tmp, copy-on-write
├── fixtures/
│   └── templates/             # НЕИЗМЕНЯЕМЫЕ эталонные JSON-фикстуры (один набор на все тесты)
│       ├── users.json
│       ├── streams.json
│       ├── students.json
│       └── courses/
│           ├── modules.json
│           ├── lessons.json
│           └── steps.json
├── integration/
│   └── <module>/              # По одному каталогу на модуль (stream, ...)
│       └── <story>.integration.test.ts
└── e2e/
    └── <module>/
        └── user-flows.e2e.test.ts   # Один файл на модуль с цепочками сценариев
```

**Unit-тесты** лежат рядом с кодом: `packages/<module>/src/ui/bot/stories/<story>.test.ts`.

---

## 3. Unit-тесты (Story / Controller)

**Цель:** проверить логику одной стори или контроллера в полной изоляции от внешних модулей.

### 3.1 Правила

- **Все зависимости мокаются:** `moduleApi.execute` и `appApi.execute` заменяются `mock()` из bun:test.
- **Стори тестируется через прямой вызов:** `story.handleCallback(action, actor, session)` — без роутера.
- **Не проверяются `code` кнопок** — только текст ответа и наличие/отсутствие кнопок по тексту.
- **MarkdownV2-валидация обязательна:** `assertResponseMarkdownSafe(response)`.
- **Тесты handleStart:** проверяют, что кнопка появляется/не появляется для нужной роли.

### 3.2 Пример

```typescript
import { describe, expect, mock, test } from 'bun:test';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { CatalogStory } from './catalog.story';

describe('CatalogStory', () => {
  const session: SessionData = { activeHandler: null };
  const actor: User = { /* ... */ };

  test('handleCallback("list") показывает список потоков', async () => {
    const moduleApi = {
      execute: mock(async () => [
        { uuid: '...', title: 'Поток Набора', status: 'enrollment' },
      ]),
    };

    const story = new CatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback('list', actor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Потоки школы');
  });
});
```

---

## 4. Интеграционные тесты

**Цель:** проверить, что стори, роутер, контроллер, реальные модули и JSON-репозитории работают вместе без ошибок. Каждый обработчик тестируется изолированно — вызывается через `router.handleCallback()` с заранее известным callback_data.

### 4.1 Правила

- **Полный стек без моков:** создаётся реальный `ApiApp` через `createTestApp()`, реальные `JsonRepo`, реальные модули.
- **Прямой вызов роутера:** `router.handleCallback('stream:catalog:list', actor, session)` — с полным callback_data (префикс контроллера + стори + экшен).
- **Проверяется семантика ответа:** текст сообщений, наличие/отсутствие кнопок по тексту.
- **НЕ проверяются `code` кнопок** — это зона E2E-тестов.
- **Изоляция на уровне `describe`:** перед блоком создаётся отдельный `TestApp` со своим `BotRouter`.
- **Полная валидация обязательна:** `assertBotResponseValid(response)` — проверяет MarkdownV2 и длину callback_data (≤ 64 байта).

### 4.2 Формат callback_data

При вызове `router.handleCallback()` используется **полный** callback_data:

```
stream:catalog:list                   — CatalogStory
stream:view-stream:view:<uuid>        — ViewStreamStory
stream:enroll:enroll:<uuid>           — EnrollStory
stream:learning:my-study              — LearningStory
stream:progress:progress:<uuid>       — ProgressStory
stream:create-stream:start            — CreateStreamStory
stream:activate-stream:activate:<uuid> — ActivateStreamStory
stream:monitor:students:<uuid>        — MonitorStory
```

Первая часть (`stream:`) — имя контроллера, вторая часть — имя сторис, третья — экшен.

### 4.3 Пример

```typescript
import { describe, expect, test, beforeAll, afterAll } from 'bun:test';
import { BotRouter, assertBotResponseValid } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import { createTestApp } from '../../helpers/test-app';

describe('CatalogStory integration', () => {
  let app: TestApp;
  let router: BotRouter;
  let guest: User;

  beforeAll(async () => {
    app = await createTestApp('catalog');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
  });

  afterAll(async () => { await app.cleanup(); });

  test('гость видит витрину — только enrollment и active', async () => {
    const response = await router.handleCallback(
      'stream:catalog:list', guest, { activeHandler: null }
    );
    assertBotResponseValid(response);

    const btnTexts = response.sendMessage?.keyboard?.rows
      .flat().map(b => b.text) ?? [];
    expect(btnTexts.some(t => t.includes('Набор'))).toBe(true);
    expect(btnTexts.some(t => t.includes('Активный'))).toBe(true);
    expect(btnTexts.some(t => t.includes('Завершён'))).toBe(false);
  });
});
```

---

## 5. E2E-тесты (сквозные)

**Цель:** проверить реальные пользовательские цепочки — каждый следующий шаг использует `code` из кнопки предыдущего ответа. Это единственный уровень, который ловит ошибки в формировании callback_data.

### 5.1 Ключевое отличие от интеграционных

| | Интеграционные | E2E |
|---|---|---|
| Вызов обработчика | `router.handleCallback('stream:catalog:list', ...)` — хардкод | Извлекается `btn.code` из предыдущего ответа |
| Проверяет правильность `code` в кнопках | ❌ | ✅ (тест упадёт на «Неизвестная команда») |
| Цепочки действий | Нет, каждый обработчик изолирован | Да, полный пользовательский сценарий |

### 5.2 Правила

- **Цепочки через `code` кнопок:** каждый шаг извлекает кнопку из ответа по тексту и передаёт её `code` в следующий `router.handleCallback()`.
- **Один файл на модуль:** `user-flows.e2e.test.ts` содержит все сквозные сценарии для модуля.
- **Каждый сценарий — отдельный `describe`:** у каждой роли свой `TestApp`, чтобы изменения состояния (например, запись на поток) не влияли на другие сценарии.
- **Проверяется отсутствие ошибок маршрутизации:** `expect(text).not.toContain('Неизвестная команда')` на каждом шаге.
- **Полная валидация обязательна:** `assertBotResponseValid(response)` на каждом шаге — проверяет MarkdownV2 и длину callback_data (≤ 64 байта).

### 5.3 Хелперы

```typescript
/** Находит кнопку в клавиатуре ответа по вхождению подстроки в текст */
function findButton(response: BotResponse, textContains: string): { text: string; code: string } {
  const btn = response.sendMessage?.keyboard?.rows
    .flat()
    .find(b => b.text.includes(textContains));
  if (!btn) throw new Error(`Кнопка «${textContains}» не найдена`);
  return btn;
}

/** Находит пункт главного меню по тексту */
function findMenuItem(
  items: { text: string; action: string }[],
  textContains: string,
): { text: string; action: string } {
  const item = items.find(i => i.text.includes(textContains));
  if (!item) throw new Error(`Пункт меню «${textContains}» не найден`);
  return item;
}
```

### 5.4 Какие сценарии покрывать

**Минимальный набор для модуля:**

| Роль | Цепочка |
|------|---------|
| Гость | Главное меню → каталог → карточка потока → программа → назад к потоку → назад к списку |
| Кандидат | Каталог → карточка → запись на поток → делегирование в «Моя учёба» |
| Студент | Главное меню → «Моя учёба» → видит текущий шаг и кнопки |
| Ментор | Главное меню → каталог → карточка → список студентов → детали студента → назад |

Каждая цепочка тестирует **все нажатия кнопок** в рамках одного пользовательского сценария.

### 5.5 Пример

```typescript
describe('Гость', () => {
  let app: TestApp;
  let router: BotRouter;
  let guest: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-guest');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
  });

  test('главное меню → каталог → карточка потока', async () => {
    // 1. Главное меню
    const menu = await router.collectMainMenu(guest);
    const catalogBtn = findMenuItem(menu, 'Наши потоки');

    // 2. Каталог
    const catalogResp = await router.handleCallback(
      catalogBtn.action, guest, NO_SESSION
    );

    // 3. Извлекаем code из кнопки и нажимаем
    const streamBtn = findButton(catalogResp, 'Набор');
    const viewResp = await router.handleCallback(
      streamBtn.code, guest, NO_SESSION   // ← реальный code из кнопки!
    );
    assertBotResponseValid(viewResp);

    expect(viewResp.sendMessage?.text).toContain('JS Core');
    expect(viewResp.sendMessage?.text).not.toContain('Неизвестная команда');
  });
});
```

---

## 6. Формирование callback_data в продакшен-коде

Это критически важный аспект, который проверяют E2E-тесты.

### 6.1 Архитектура: Story — реальные данные, Controller — сжатие

```
Story (реальные данные)              Controller (префикс + сжатие)
──────────────────────────          ──────────────────────────────
cb('list') → "catalog:list"   ──→  handleStart добавляет "stream:"
cbFor('view','view',uuid) →        #compressResponse сжимает id
  "view-stream:view:realUUID"  ──→  "stream:view-stream:view:shortId"
        ↑                                   ↓
  handleCallback получает          #expandData восстанавливает
  реальный UUID обратно            realUUID из shortId
```

- **Story не знает** ни имени контроллера, ни механизма сжатия.
- **Story оперирует только реальными данными** (UUID, ключи).
- **Controller владеет** общей мапой `shortIds` и добавляет префикс имени.

### 6.2 Методы формирования callback в BotUserStory

```typescript
// Для СВОЕЙ стори: storyName:action[:id...]
protected cb(action: string, ...ids: string[]): string

// Для ЧУЖОЙ стори того же контроллера: targetStory:action[:id...]
protected cbFor(storyName: string, action: string, ...ids: string[]): string
```

Примеры:

```typescript
// CatalogStory — кнопка перехода в карточку потока (кросс-стори)
code: this.cbFor('view-stream', 'view', s.uuid),

// ViewStreamStory — менторская кнопка «Запустить»
code: this.cbFor('activate-stream', 'activate', stream.uuid),

// LearningStory — кнопка «Выполнено» (своя стори, несколько id)
code: this.cb('complete', student.uuid, student.streamId, student.currentStepId),

// LearningStory — кнопка «Мой прогресс» (кросс-стори)
code: this.cbFor('progress', 'progress', student.streamId),

// CatalogStory — кнопка главного меню (своя стори, без id)
return { text: '📚 Наши потоки', action: this.cb('list'), priority: 10 };
```

### 6.3 Сжатие id в Controller

Controller автоматически сжимает все id в callback_data перед отправкой:
- UUID `e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0` → `e0e0e0e0` (первые 8 символов)
- На входе разжимает обратно — стори получает реальный UUID
- Мапа `shortIds` общая для всех стори контроллера → кросс-стори колбэки работают

Это гарантирует, что callback_data всегда ≤ 64 байта:

| Кнопка | Без сжатия | Со сжатием |
|--------|:---:|:---:|
| 🚀 Запустить | 68 ❌ | 40 ✅ |
| 🛠️ Панель ментора | 67 ❌ | 39 ✅ |
| ✅ Завершить | 64 ⚠️ | 40 ✅ |

### 6.4 Главное меню

Кнопки главного меню формируются через `story.handleStart()` → `this.cb('list')`.
Контроллер в `handleStart()` добавляет префикс: `\`${this.name}:${item.action}\``.

```typescript
// Story
async handleStart(actor: User): Promise<MainMenuAction | null> {
  return { text: '📚 Наши потоки', action: this.cb('list'), priority: 10 };
}
// → action = "catalog:list"

// Controller в handleStart():
items.push({ ...item, action: \`${this.name}:${item.action}\` });
// → action = "stream:catalog:list"
```

---

## 7. Валидация BotResponse

В тестах используются две функции из `@u7-scl/core/ui`:

| Функция | Проверяет | Где использовать |
|---------|-----------|-----------------|
| `assertResponseMarkdownSafe` | Только MarkdownV2 | Unit-тесты (стори без контроллера — callback_data несжатые, длина не проверяется) |
| `assertBotResponseValid` | MarkdownV2 **+** длина `code` ≤ 64 байт | Integration, E2E (контроллер уже сжал id, проверяется финальный результат) |

```typescript
import { assertBotResponseValid } from '@u7-scl/core/ui';

const response = await router.handleCallback(...);
assertBotResponseValid(response);
// Если callback_data > 64 байт → тест упадёт с понятной ошибкой
```

## 8. Запуск

```bash
# Unit-тесты модуля stream
bun test packages/stream/src/ui/bot/

# Интеграционные тесты
bun test tests/bot/integration/

# E2E-тесты
bun test tests/bot/e2e/

# Все тесты бота
bun test packages/stream/src/ui/bot/ tests/bot/
```

---

## 9. Отладка

Если тест падает и нужно посмотреть состояние данных:

```bash
KEEP_FIXTURES=1 bun test tests/bot/integration/stream/catalog.integration.test.ts
```

Временная директория с JSON-фикстурами не будет удалена.

---

## 10. Связанные документы

- [Общие правила тестирования](../testing.md)
- [BotUserStory Styleguide](skills/bot-user-story.md) — стиль написания сторис
- [MarkdownV2 в Telegram-боте](../markdown-bot.md) — валидация разметки
- [DDD принципы](../ddd.md) — архитектура слоёв
