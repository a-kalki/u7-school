# E2E-тестирование сторис бота (bot-e2e) — Styleguide

**Назначение:** сквозное тестирование пользовательских сценариев (User Stories) без моков, на реальных данных и реальных модулях.

---

## 1. Цели e2e-тестов

1. **Проверка сторис** — сервис (бот) ведёт себя так, как описано в `user-stories.md`.
2. **Никаких моков** — тесты работают с реальными репозиториями, модулями и ApiApp.
3. **Сквозные сценарии** — тест проходит полный путь пользователя: от callback до BotResponse, включая межмодульные вызовы (`appApi.execute`).

E2e-тесты **не** тестируют Grammy-слой (это внешняя библиотека). Они работают через `BotRouter` напрямую.

---

## 2. Расположение файлов

```
tests/bot-e2e/
  fixtures/
    templates/                 # НЕИЗМЕНЯЕМЫЕ эталонные фикстуры
      users.json
      streams.json
      students.json
      courses/
        modules.json
        lessons.json
        steps.json
  helpers/
    fixture-loader.ts          # Копирует templates → tmp, возвращает пути
    test-app.ts                # Фабрика: создаёт полноценный ApiApp с временными репозиториями
  stories/
    <module-name>/             # По одному каталогу на модуль (stream, onboarding, ...)
      <story-name>.e2e.test.ts
```

Фикстуры — **один набор на все модули**. Это гарантирует, что тесты разных модулей работают в одинаковых условиях и не конфликтуют.

---

## 3. Принцип работы с фикстурами

### 3.1 Неизменяемость шаблонов

Файлы в `fixtures/templates/` — **только для чтения**. Тесты никогда не пишут в них.

### 3.2 Copy-on-write

Перед каждым `describe`-блоком (группой тестов одной сторис) `fixture-loader`:
1. Создаёт уникальную временную директорию в `os.tmpdir()`.
2. Копирует **все** файлы из `templates/` в эту директорию.
3. Возвращает объект с путями к скопированным файлам.

```typescript
// fixture-loader.ts (упрощённо)
export async function loadFixtures(): Promise<FixturePaths> {
  const tmpDir = path.join(os.tmpdir(), `u7-e2e-${nanoid()}`);
  await copyDir(TEMPLATES_DIR, tmpDir);
  return {
    dbDir: tmpDir,
    users: path.join(tmpDir, 'users.json'),
    streams: path.join(tmpDir, 'streams.json'),
    students: path.join(tmpDir, 'students.json'),
    courses: {
      modules: path.join(tmpDir, 'courses', 'modules.json'),
      lessons: path.join(tmpDir, 'courses', 'lessons.json'),
      steps: path.join(tmpDir, 'courses', 'steps.json'),
    },
  };
}
```

### 3.3 Изоляция

**Уровень изоляции — `describe`-блок.** Все тесты внутри одного `describe` используют общую копию фикстур. Это даёт хороший баланс между скоростью (не копируем на каждый `test`) и изоляцией (разные сторис не мешают друг другу).

ВАЖНО: Если тест внутри `describe` изменяет данные (например, запись студента на поток), это влияет на последующие тесты в том же `describe`. Учитывай это при проектировании тестов — либо выстраивай сценарий последовательно, либо выноси в отдельный `describe`.

---

## 4. Test Harness

### 4.1 `createTestApp()`

Фабрика, создающая **полноценный ApiApp** с реальными модулями (user, course, stream) и временными репозиториями:

```typescript
export async function createTestApp() {
  const fixtures = await loadFixtures();
  // ... function code
  return { apiApp, streamModule, userFacade, courseFacade, fixtures };
}
```

### 4.2 Создание BotRouter и контроллеров

```typescript
const { apiApp, streamModule } = await createTestApp();
const streamController = new StreamController(streamModule);
streamController.init(apiApp);
const router = new BotRouter([streamController]);
```

---

## 5. Структура теста

Каждый тест следует одному сценарию из `user-stories.md`:

```typescript
import { describe, expect, test, beforeAll } from 'bun:test';

describe('CatalogStory e2e', () => {
  let router: BotRouter;
  let fixtures: FixturePaths;
  let guest: User;

  beforeAll(async () => {
    const { apiApp, streamModule, userFacade, fixtures: f } = await createTestApp();
    fixtures = f;
    const streamController = new StreamController(streamModule);
    streamController.init(apiApp);
    router = new BotRouter([streamController]);
    guest = (await userFacade.getUserByTelegramId(1001))!;
  });

  test('US-1: гость видит витрину только с enrollment и active потоками', async () => {
    const response = await router.handleCallback(
      'stream:catalog:list',
      guest,
      { activeHandler: null },
    );

    // Проверяем текст
    expect(response.sendMessage?.text).toContain('Потоки школы');

    // Проверяем кнопки
    const btnTexts = response.sendMessage?.keyboard?.rows.flat().map(b => b.text) ?? [];
    expect(btnTexts).toContainEqual(expect.stringContaining('🟢'));
    expect(btnTexts).toContainEqual(expect.stringContaining('🔵'));
    expect(btnTexts).not.toContainEqual(expect.stringContaining('⚪'));
  });
});
```

---

## 6. Формат callback_data

При вызове `router.handleCallback()` используется **полный** callback_data — с префиксом контроллера:

```
stream:catalog:list        — CatalogStory
stream:view-stream:view:<uuid>  — ViewStreamStory
stream:enroll:enroll:<uuid>    — EnrollStory
stream:learning:my-study       — LearningStory
stream:progress:progress:<uuid> — ProgressStory
stream:create-stream:start     — CreateStreamStory
stream:activate-stream:activate:<uuid> — ActivateStreamStory
stream:monitor:students:<uuid> — MonitorStory
```

Первая часть (`stream:`) — имя контроллера, отрезается `BotRouter`-ом. Вторая часть — имя сторис и экшен.

---

## 7. Сообщения о прогрессе

E2e-тесты проверяют **смысловое содержание** сообщений, а не точный текст. Используй:

```typescript
// ✅ Правильно — семантическая проверка
expect(response.sendMessage?.text).toContain('Потоки школы');
expect(btnTexts.some(t => t.includes('Записаться'))).toBe(true);

// ❌ Избегай — точное совпадение хрупкое
expect(response.sendMessage?.text).toBe('📚 *Потоки школы*\n\n...');
```

---

## 8. Валидация MarkdownV2

Каждый `BotResponse` в e2e-тесте **обязан** проходить проверку на
неэкранированные символы MarkdownV2. После получения ответа от роутера
или контроллера добавляй:

```typescript
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';

const response = await router.handleCallback(...);
assertResponseMarkdownSafe(response);
```

Это ловит ошибки вида «текст с точкой + parseMode: MarkdownV2»,
которые приводят к `400 Bad Request: can't parse entities` от Telegram.
Подробнее: [MarkdownV2 в Telegram-боте](../markdown-bot.md).

---

## 9. Запуск

```bash
# Все e2e-тесты
bun test tests/bot-e2e/

# Конкретный модуль
bun test tests/bot-e2e/stories/stream/

# Конкретный тест
bun test tests/bot-e2e/stories/stream/catalog.e2e.test.ts
```

---

## 10. Отладка

Если тест падает и нужно посмотреть состояние данных — установи переменную окружения:

```bash
KEEP_FIXTURES=1 bun test tests/bot-e2e/stories/stream/catalog.e2e.test.ts
```

Временная директория не будет удалена, и ты сможешь посмотреть JSON-файлы. Путь к директории выводится в консоль при старте теста.

---

## 11. Связанные документы

- [Правила тестирования](../testing.md) — общие принципы
- [BotUserStory Styleguide](bot-user-story.md) — стиль написания сторис
- [DDD принципы](../ddd.md) — архитектура слоёв
- [user-stories.md](../../../packages/stream/src/user-stories.md) — источник истины для сценариев

## 12. Ограничение длины callback_data

Telegram ограничивает callback_data **64 байтами**. UUID (36 символов) + префикс контроллера/сторис часто превышают этот лимит.

Для длинных значений используй встроенный механизм `shrink`/`expand` из `BotUserStory`:

```typescript
// В сторис: при формировании кнопки
const key = this.shrink(streamId);
return { text: 'Запустить', code: this.cb(`activate:${key}`) };

// При обработке callback
const shortKey = action.split(':')[1];
const streamId = this.expand(shortKey);
```

E2e-тесты используют те же callback-форматы, что и продакшен-код. Если в тесте callback превышает 64 байта — это сигнал, что и в реальном боте будет проблема.
