import * as v from "valibot";
import { RoleSchema } from "./roles";

/**
 * Схема пользователя платформы u7-school.
 * Содержит базовые поля: ID, имя, telegramId, роль.
 */
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty("ID не может быть пустым")),
  name: v.pipe(v.string(), v.nonEmpty("Имя не может быть пустым")),
  telegramId: v.pipe(
    v.number(),
    v.integer("telegramId должен быть целым числом"),
    v.minValue(1, "telegramId должен быть положительным"),
  ),
  role: RoleSchema,
});

/** Тип пользователя, выводимый из схемы Valibot */
export type User = v.InferOutput<typeof UserSchema>;
