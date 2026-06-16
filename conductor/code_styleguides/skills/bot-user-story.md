# BotUserStory — Styleguide

**Назначение:** пользовательский сценарий внутри контроллера бота. Инкапсулирует логику одного сценария (каталог, карточка потока, запись и т.д.).

Файл в проекте: `ui/bot/stories/<story-name>.story.ts`.

---

## 1. Базовые классы

| Класс | Пакет | Назначение |
|---|---|---|
| `BotUserStory<TAppMeta, TModuleMeta, TActor>` | `@u7-scl/core/ui` | Абстрактный сценарий |
| `U7BotUserStory<TModuleMeta>` | `@u7-scl/app/ui` | Специализация для U7-бота: закрывает `TAppMeta = U7BotAppMeta`, `TActor = User` |

---

## 2. Парсинг callback data

Используй **деструктуризацию** `split(':')` вместо доступа по индексу `parts[0]`, `parts[1]!`.
Это делает код читаемым и убирает необходимость `!` (non-null assertion):

```typescript
// ✅ Правильно — деструктуризация с осмысленными именами
const [cmd, streamId] = action.split(':');
if (cmd !== 'enroll' || !streamId) {
  return { sendMessage: { text: '⚠️ Неизвестная команда' } };
}

// Для callback с тремя и более частями — пропускай префикс через запятую:
const [, studentId, streamId, stepId] = action.split(':');

// ❌ Неправильно
const parts = action.split(':');
const streamId = parts[1]!;
```

---

## 3. Доступ к API

### 3.1 `this.moduleApi` — API своего модуля
Для вызовов команд **своего** модуля (строгая типизация через `TModuleMeta`):

```typescript
// ✅ Правильно — тип выводится автоматически
const stream = await this.moduleApi.execute('get-stream', { streamId });
const students = await this.moduleApi.execute('list-stream-students', { streamId });
```

### 3.2 `this.appApi` — API приложения (межмодульные вызовы)
Для вызовов команд **других** модулей:

```typescript
// ✅ Правильно — получение пользователя через модуль user
const mentor = await this.appApi.execute('get-user', { uuid: stream.mentorId });
```

### 3.3 Категорически запрещено
- **НЕ используй `as unknown as`** для результатов `execute()`. Вызовы строго типизированы. Если TypeScript ругается — проблема в типах команд/меты, а не в сторис.
- **НЕ создавай локальные интерфейсы** для Actor (`{ uuid, roles }`). Используй `User` из `@u7-scl/app/domain`.
- **НЕ дублируй use-case'ы** в своём модуле для вызова фасадов других модулей. Используй `this.appApi.execute()`.

```typescript
// ❌ Неправильно — as unknown as
const streams = await this.moduleApi.execute('list-streams', {}) as unknown as StreamItem[];

// ❌ Неправильно — локальный интерфейс вместо User
interface Actor { uuid: string; roles: string[]; }
const a = actor as Actor;

// ❌ Неправильно — дублирование UC для вызова соседнего модуля
// (создавать GetUserUc в stream для вызова UserFacade)
// ✅ Вместо этого: this.appApi.execute('get-user', { uuid: ... })
```

---

## 4. Тип актора (Actor)

Актор всегда имеет тип `User` из `@u7-scl/app/domain` (реэкспорт из `@u7-scl/user/domain`).

**Всегда** указывай `actor: User` в сигнатурах `handleCallback`, `handleMessage`, `handleStart`.
Дженерик `U7BotUserStory` уже закрывает `TActor = User` — не нужно использовать `unknown` и каст:

```typescript
import type { User } from '@u7-scl/app/domain';

// ✅ Правильно — actor типизирован через дженерик
async handleCallback(action: string, actor: User, session: SessionData): Promise<BotResponse> {
  const student = await this.moduleApi.execute('get-student-by-user', {
    userId: actor.uuid,
  });
}

// ❌ Неправильно — unknown + ручной каст
async handleCallback(action: string, actor: unknown, session: SessionData): Promise<BotResponse> {
  const a = actor as User;
}
```

### 4.1 Проверка прав через Policy-объекты

**Всегда** используй Policy-объекты вместо ручной проверки ролей или полей.
Policy централизует бизнес-правила и гарантирует консистентность.

#### UserPolicy (`@u7-scl/user/domain`)

```typescript
import { UserPolicy } from '@u7-scl/user/domain';

// ✅ Правильно
if (UserPolicy.isStudent(actor)) { ... }
if (UserPolicy.isMentor(actor) || UserPolicy.isAdmin(actor)) { ... }

// ❌ Неправильно — ручная проверка
if (actor.roles.includes('STUDENT')) { ... }
if (actor.roles.includes('MENTOR') || actor.roles.includes('ADMIN')) { ... }
```

#### StreamPolicy (внутри пакета stream)

```typescript
import { StreamPolicy } from '../../../domain/stream/policy';

// ✅ Правильно — использовать готовые методы
if (StreamPolicy.canEnroll(actor)) { /* показать кнопку «Записаться» */ }
if (StreamPolicy.isMentor(actor, stream)) { /* менторские кнопки */ }

// ❌ Неправильно — дублировать логику политики
const isGuestCandidate = UserPolicy.isGuest(actor) || UserPolicy.isCandidate(actor);
```

Доступные Policy-объекты:
- **UserPolicy** — `isGuest`, `isCandidate`, `isStudent`, `isMentor`, `isAdmin`, `canCreate`, `canAddRole`
- **StreamPolicy** — `canCreate`, `canRead`, `canEnroll`, `isMentor`, `isActive`, `isComplete`
- **StudentPolicy** — `canViewProgress`, `canCompleteStep`

---

## 5. Инициализация

`init(moduleApi, appApi)` — вызывается контроллером при старте. Принимает **два** аргумента:

```typescript
// В контроллере:
story.init(moduleApi, appApi);
```

---

## 6. Тестирование

В тестах используй полный объект `User` для актора:

```typescript
import type { User } from '@u7-scl/app/domain';

const guestActor: User = {
  uuid: 'user-1',
  name: 'Гость',
  telegramId: 123,
  roles: ['GUEST'],
  createdAt: '2026-01-01T00:00:00.000Z',
};
```

Моки для `moduleApi` и `appApi` передаются в `init` отдельно:

```typescript
const story = new ViewStreamStory();
story.init(moduleApi as any, appApi as any);
```

---

## 7. Структура файла сторис

```
ui/bot/stories/
  <story-name>.story.ts       — реализация сценария
  <story-name>.story.test.ts  — тесты
```

---

## 8. Форматирование текста (MarkdownV2)

### 8.1 Унаследованные protected-методы

`BotUserStory` предоставляет protected-методы, доступные во всех сторис.
**НЕ дублируй** их — используй унаследованные.

#### `this.escapeMarkdown(text)`
Экранирует спецсимволы MarkdownV2: `_ * [ ] ( ) ~ \` > # + - = | { } . !`

```typescript
lines.push(`📋 ${this.escapeMarkdown(stream.title)}`);
```

#### `this.formatDate(iso)`
Форматирует ISO-дату в `дд.мм.гггг`. При ошибке возвращает исходную строку.

```typescript
const dateStr = this.formatDate(stream.startDate); // '01.07.2026'
```

```typescript
// ❌ Неправильно — дублирование в каждой сторис
#formatDate(iso: string): string { ... }
private escapeMarkdown(text: string): string { ... }
```

### 8.2 Пакет `markdown-to-telegram`

В проекте установлен пакет [`markdown-to-telegram`](https://www.npmjs.com/package/markdown-to-telegram) (v0.0.7) —
конвертирует стандартный Markdown в Telegram MarkdownV2.

**Пока не используется** в проекте. При необходимости форматирования больших блоков текста
(например, контента уроков) — используй `convert()` из этого пакета вместо ручной вставки `*жирный*`, `_курсив_`.

---

## 9. Связанные styleguide-файлы

- [DDD API](../api.md) — UseCase, Command, Module
- [DDD Naming](../naming.md) — соглашения об именовании
- [DDD принципы](../ddd.md) — общая архитектура DDD
