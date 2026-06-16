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

## 2. Доступ к API

### 2.1 `this.moduleApi` — API своего модуля
Для вызовов команд **своего** модуля (строгая типизация через `TModuleMeta`):

```typescript
// ✅ Правильно — тип выводится автоматически
const stream = await this.moduleApi.execute('get-stream', { streamId });
const students = await this.moduleApi.execute('list-stream-students', { streamId });
```

### 2.2 `this.appApi` — API приложения (межмодульные вызовы)
Для вызовов команд **других** модулей:

```typescript
// ✅ Правильно — получение пользователя через модуль user
const mentor = await this.appApi.execute('get-user', { uuid: stream.mentorId });
```

### 2.3 Категорически запрещено
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

## 3. Тип актора (Actor)

Актор всегда имеет тип `User` из `@u7-scl/app/domain` (реэкспорт из `@u7-scl/user/domain`):

```typescript
import type { User } from '@u7-scl/app/domain';

// В handleCallback / handleMessage:
async handleCallback(action: string, actor: unknown, session: SessionData): Promise<BotResponse> {
  const a = actor as User;
  // a.uuid, a.name, a.telegramId, a.roles, a.createdAt, a.updatedAt
}
```

---

## 4. Инициализация

`init(moduleApi, appApi)` — вызывается контроллером при старте. Принимает **два** аргумента:

```typescript
// В контроллере:
story.init(moduleApi, appApi);
```

---

## 5. Тестирование

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

## 6. Структура файла сторис

```
ui/bot/stories/
  <story-name>.story.ts       — реализация сценария
  <story-name>.story.test.ts  — тесты
```

---

## 7. Связанные styleguide-файлы

- [DDD API](../api.md) — UseCase, Command, Module
- [DDD Naming](../naming.md) — соглашения об именовании
- [DDD принципы](../ddd.md) — общая архитектура DDD
