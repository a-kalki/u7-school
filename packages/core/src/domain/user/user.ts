import * as v from "valibot";
import { RoleSchema } from "./roles";

/**
 * Схема пользователя платформы u7-school.
 * Содержит базовые поля: ID, имя, telegramId, роль.
 */
export const UserSchema = v.object({
  /** Уникальный идентификатор пользователя */
  id: v.pipe(v.string(), v.nonEmpty("ID не может быть пустым")),
  /** Отображаемое имя пользователя */
  name: v.pipe(v.string(), v.nonEmpty("Имя не может быть пустым")),
  /** ID пользователя в Telegram */
  telegramId: v.pipe(
    v.number(),
    v.integer("telegramId должен быть целым числом"),
    v.minValue(1, "telegramId должен быть положительным"),
  ),
  /** Роль пользователя в системе */
  role: RoleSchema,
});

/** Тип пользователя, выводимый из схемы Valibot */
export type User = v.InferOutput<typeof UserSchema>;
