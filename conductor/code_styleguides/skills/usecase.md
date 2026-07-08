# Сценарий использования (UseCase) — Styleguide

**Назначение:** файл `api/<entity>/<uc-name>-uc.ts` — класс UC, оркестратор одной бизнес-операции. Наследуется от `UseCase<UcMeta, Resolver>`. Опирается на каркас базового класса, концентрируясь на доменной логике.

---

## 1. Ключевые правила

1. Концентрируйтесь на положительном потоке; при прогнозируемой ошибке прерывайте поток предусмотренными хелперами (`this.throwAccessDenied()`, `this.throwError()`).
2. Разбивайте логику на небольшие методы.
3. **`UcMeta.errors` должен содержать ВСЕ ошибки**, которые UC может выбросить** — включая ошибки от `getActor()`, `throwAccessDenied()` и хелперов. Система типов это не проверяет.
4. **Проверка прав — инлайн в `execute()`** через `this.getActor()` + `Policy.canXxx()` + `this.throwAccessDenied()`.
5. Репозитории и фасады — через `this.resolve.<name>`; моки в тестах — `as unknown as <реальный тип>`, без `as any`.

Живой пример: [`packages/stream/src/api/stream-uc.ts`](../../../packages/stream/src/api/stream-uc.ts).

---

## 2. Поля UseCase

| Поле | Назначение | Пример |
|---|---|---|
| `ucName` | Уникальное имя (kebab-case) | `"create-stream"` |
| `ucLabel` | Человекочитаемая метка | `"Создать поток"` |
| `arMeta` | Метаданные агрегата | `{ arName: "Stream", arLabel: "Поток" }` |
| `type` | `"command"` или `"query"` | `"command"` |
| `requiresAuth` | Требуется ли авторизация | `true` |
| `inputSchema` / `outputSchema` | Valibot-схемы входа/выхода | `CreateStreamCmdSchema` |

> Поле меты называется **`ucName`** (не `commandName`). `commandName` в коде встречается только как метаданные в контексте ошибок.

### UcMeta (CmdMeta)

```typescript
export interface CreateStreamCmdMeta {
	ucName: "create-stream";
	arMeta: StreamArMeta;
	input: CreateStreamCmd;
	output: Stream;
	errors: CreateStreamCmdError;
	requiresAuth: true;
	type: "command";
}
```

### Хелперы базового UC модуля

Каждый модуль обычно предоставляет свой базовый UC (`StreamUseCase`) с хелперами: `getActor(actorId)` (бросает если не найден), `getStream(id)` (возвращает `undefined`), `throwAccessDenied(msg)`. См. `packages/stream/src/api/stream-uc.ts`.

---

## 3. Тестирование

- Считайте доменные объекты уже протестированными; тестируйте функционал UC.
- Покрывайте все ветки потока: успех (`SUCCESS`) и ошибки (`FAIL`).
- Мокайте все инфраструктурные объекты (репозитории, фасады) — не импортируйте их.
- Группируйте на втором уровне по `SUCCESS` / `FAIL`; тест — не более 10 строк, повторяющуюся логику в хелперы.

Живой пример теста: `packages/stream/src/api/stream-uc.test.ts`.

---

## Связанные файлы

- [Команда](./commands.md) — `CmdMeta`, `CmdSchema`, `CmdError`
- [Политика](./policy.md) — проверка прав в `execute()`
- [Ошибки](./errors.md) — `throwAccessDenied`, `throwError`, типизированные хелперы
- [Модуль](./module.md) — регистрация UC
