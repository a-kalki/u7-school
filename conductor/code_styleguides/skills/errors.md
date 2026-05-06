# Ошибки

## Два уровня ошибок

В модуле существуют два уровня ошибок:
1. **Доменные ошибки агрегата** (`domain/<entity>/errors.ts`) — ошибки которые выкидываются в агрегате.
2. **Ошибки UseCase** (`domain/<entity>/commands/errors.ts`) — бизнес-ошибки сценариев.

## Атомарные vs Union

- **Атомарные** (`<Name>UcError`) — один конкретный тип ошибки с фиксированным `name`, `kind`, `level`.
- **ModuleError** (`<ModuleName>ModuleError`) — объединение всех атомарных ошибок модуля для удобства импорта.
- **CmdError** — union только тех атомарных ошибок, которые конкретная команда может выкинуть.

## Правила

1. Каждый `name` уникален в рамках модуля.
2. `kind` определяет HTTP-статус: `not-found` → 404, `conflict` → 409, `validation` → 422.
3. `message` — человекочитаемое описание.
4. `payload` — опциональные данные для отладки (UUID, telegramId и т.д.).

## Инструкция по предотвращению регресса

### При дополнении или рефакторинге кода/тестов:
- **Не допускай регресса** — не ломай существующее корректное поведение
- **Меняй только то, что относится к текущей задаче** — не трогай несвязанные модули и тесты
- **Не удаляй и не переписывай существующие тесты** — только добавляй новые

### При обнаружении критических ошибок вне текущей задачи:
- **Запроси изменения** — опиши проблему и предложи исправление, дождись разрешения
- **Либо задокументируй в отчёте** — укажи ошибку по окончанию задачи
- **Не исправляй без согласования** — ошибка не должна быть исправлена как часть текущей задачи если на нее нет очевидных причин

## Пример атомарных ошибок

```typescript
export type UserNotFoundUcError = {
	name: "USER_NOT_FOUND";
	level: "domain";
	kind: "not-found";
	message: string;
	payload?: { uuid?: string; telegramId?: number };
};

export type TelegramIdTakenUcError = {
	name: "TELEGRAM_ID_TAKEN";
	level: "domain";
	kind: "conflict";
	message: string;
	payload?: { telegramId: number };
};
```

## Пример ModuleError

```typescript
export type UserModuleError =
	| UserNotFoundUcError
	| TelegramIdTakenUcError;
```

## Пример CmdError (в файле команды)

```typescript
export type CreateUserCmdError = TelegramIdTakenUcError;
```

## Тестирование

Ошибки тестируются косвенно — через тесты UC, которые их выбрасывают. Не нужен отдельный unit-тест на тип TypeScript.
