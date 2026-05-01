import * as v from "valibot";
import type { CreateUserCommand } from "../../api/commands/create_user_command";
import { CreateUserCommandSchema } from "../../api/commands/create_user_command";
import { DomainException } from "../shared/exceptions";
import { isoNow } from "../shared/iso_now";
import type { User } from "./user";
import { UserSchema } from "./user";

/**
 * Проверяет инварианты агрегата через схему валидации.
 * Выбрасывает DomainException.validation при нарушении.
 */
function validateInvariants(user: User): v.InferOutput<typeof UserSchema> {
  const result = v.safeParse(UserSchema, user);
  if (!result.success) {
    throw DomainException.validation(
      "Некорректные данные пользователя",
      "Нарушение инвариантов UserAr",
      v.flatten<typeof UserSchema>(result.issues),
    );
  }
  return result.output;
}

/**
 * Агрегат пользователя.
 * Инкапсулирует состояние User и логику его изменения.
 */
export class UserAr {
  #state: User;

  constructor(user: User) {
    this.#state = validateInvariants(user);
  }

  /** Состояние агрегата только для чтения */
  get state(): Readonly<User> {
    return structuredClone(this.#state);
  }

  /**
   * Фабричный метод создания нового пользователя из команды.
   * Генерирует UUID и временные метки, валидирует данные.
   */
  static create(command: CreateUserCommand): UserAr {
    // 1. Валидация входящей команды
    const cmdResult = v.safeParse(CreateUserCommandSchema, command);
    if (!cmdResult.success) {
      throw DomainException.validation(
        "Некорректная команда создания пользователя",
        "Ошибка валидации CreateUserCommand",
        v.flatten<typeof CreateUserCommandSchema>(cmdResult.issues),
      );
    }

    // 2. Формирование кандидата
    const candidate: User = {
      uuid: crypto.randomUUID(),
      name: cmdResult.output.name,
      telegramId: cmdResult.output.telegramId,
      role: cmdResult.output.role,
      createdAt: isoNow(),
    };

    // 3. Проверка инвариантов
    const result = validateInvariants(candidate);

    return new UserAr(result);
  }
}
