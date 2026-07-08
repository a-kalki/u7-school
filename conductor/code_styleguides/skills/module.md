# Модуль — Styleguide

**Назначение:** модуль агрегирует UseCase-ы одной предметной области. Три уровня: типы (`domain/module.ts`), диспетчер (`api/module.ts`), контроллеры UI.

---

## 1. Три уровня модуля

| Уровень | Класс/тип | Файл | Назначение |
|---|---|---|---|
| Domain | `<Name>ApiModuleMeta`, `<Name>ApiModuleResolver` | `domain/module.ts` | Типы: мета модуля и контракт зависимостей |
| API | `<Name>ApiModule` | `api/module.ts` | Диспетчер: регистрация UC, роутинг команд |
| UI | `<Name>Controller` | `ui/...` | Контроллер, вызывает UC через `ApiApp` |

Живые примеры: [`packages/stream/src/domain/module.ts`](../../../packages/stream/src/domain/module.ts), [`packages/stream/src/api/module.ts`](../../../packages/stream/src/api/module.ts).

---

## 2. Иерархия типов

```
AppMeta
  └─ ApiModuleMeta        // moduleMetas: A | B | ...
       └─ UcMeta          // ucMetas: CmdA | CmdB | ...
```

- `ApiModule` проверяет на уровне типов, что `useCases` соответствуют заявленным `UcMeta`.
- `ApiApp.execute(ucName, attrs, actorId)` — type-safe: модуль находится автоматически, типы `attrs` и результата выводятся из `UcMeta`.

---

## 3. Domain: module.ts

- `ApiModuleMeta` описывает контракт: `name`, `url`, `ucMetas` (union всех `UcMeta` модуля).
- `Resolver` — интерфейс зависимостей модуля (репозитории, фасады).

```typescript
export type StreamUcMetas = CreateStreamCmdMeta | GetStreamCmdMeta;

export interface StreamApiModuleMeta extends ApiModuleMeta {
	name: "stream";
	url: "/stream";
	ucMetas: StreamUcMetas;
}

export interface StreamApiModuleResolver {
	streamRepo: StreamRepo;
}
```

## 4. API: module.ts

- Модуль получает `Resolver` через `init({ streamRepo: ... })` и передаёт его UC.
- `useCases` строго соответствует `ApiModuleMeta`.

```typescript
export class StreamApiModule extends ApiModule<StreamApiModuleMeta, StreamApiModuleResolver> {
	readonly name = "stream" as const;
	readonly useCases = [new CreateStreamUc(), new GetStreamUc()];
}
```

## 5. Сборка ApiApp

```typescript
const app = new ApiApp<AppMeta>();
app.register(new StreamApiModule());
app.register(new CourseApiModule());
const result = await app.execute("create-stream", { ... });
```

---

## 6. Тестирование

- Один успешный (самый длинный) сценарий на каждый подключённый UC — проверить, что UC зарегистрирован и обрабатывает команды.
- **Реальные реализации** репозиториев/фасадов (не inMemory, не моки) — задача убедиться, что имплементации работают.
- Тест — не более 10 строк; повторяющуюся логику в хелперы.

Живой пример теста: `packages/stream/src/api/module.test.ts`.

---

## Связанные файлы

- [UseCase](./usecase.md) — UC регистрируются в модуле
- [Реализация репозитория](./repo-impl.md) — передаётся через `Resolver`
- [BotController](./bot-controller.md) — UI-уровень
- [DDD принципы](../ddd.md)
