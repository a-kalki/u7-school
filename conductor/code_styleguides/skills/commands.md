# Команда (Command)

## Назначение

Файл `domain/<entity>/commands/<command-name>-cmd.ts` содержит всё необходимое для описания одной команды модуля:
- **Схема валидации** (`<CommandName>CmdSchema`)
- **Тип команды** (`<CommandName>Cmd`)
- **Мета команды** (`<CommandName>CmdMeta`)
- **Ошибки команды** (`<CommandName>CmdError`)

## Правила

1. Каждая команда — отдельный файл. Имя файла: `<command-name>-cmd.ts`.
1. Схема наследует правила из `UserSchema.entries` — никакого дублирования валидации.
1. CmdMeta это тип контракт, позволяет разным частям приложения придерживаться единых правил.
1. `ucName` — kebab-case строка, формат приказа: `"create-user"`.
1. `CmdMeta.errors` содержит **только** те ошибки, которые этот UC реально может выкинуть.
1. `CmdError` — union атомарных типов из `errors.ts` для этого usecase.

## Пример

```typescript
import * as v from "valibot";
import type { AppError } from "@u7/core";
import { UserSchema } from "../entity";
import type { UserArMeta } from "../entity";
import type { User } from "../entity";
import type { TelegramIdTakenUcError } from "./errors";

export const CreateUserCmdSchema = v.object({
	name: UserSchema.entries.name,
	telegramId: UserSchema.entries.telegramId,
	roles: UserSchema.entries.roles,
});

export type CreateUserCmd = v.InferOutput<typeof CreateUserCmdSchema>;

export interface CreateUserCmdMeta {
	ucName: "create-user";
	description: "Создать пользователя";
	arMeta: UserArMeta;
	input: CreateUserCmd;
	output: User;
	errors: CreateUserCmdError;
	requiresAuth: false;
	type: "command";
}

export type CreateUserCmdError = TelegramIdTakenUcError | AppError;
```

## Тестирование

1. Можно обойтись без тестирования, тесты должны быть покрыты из тестирования схем валидации сущности.
1. Если тестирование все таки необходимо, то придерживайся правил приведенных в файле `./entity.md`.

## Регресс

**Недопустимо** ломать существующий функционал и тесты, не связанные с текущей задачей: меняй только то, что относится к задаче, не удаляй и не переписывай корректные тесты — только добавляй новые. Подробные правила — [testing.md, §«Защита от регресса и чистота правок»](../testing.md).
