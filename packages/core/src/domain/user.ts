import * as v from "valibot";
import { RoleSchema } from "./roles";

/**
 * Схема пользователя платформы u7-school.
 * Содержит базовые поля: ID, имя, email, роль.
 */
export const UserSchema = v.object({
  /** Уникальный идентификатор пользователя */
  id: v.pipe(v.string(), v.nonEmpty("ID не может быть пустым")),
  /** Отображаемое имя пользователя */
  name: v.pipe(v.string(), v.nonEmpty("Имя не может быть пустым")),
  /** Email пользователя, используется для входа */
  email: v.pipe(
    v.string(),
    v.nonEmpty("Email не может быть пустым"),
    v.email("Некорректный формат email"),
  ),
  /** Роль пользователя в системе */
  role: RoleSchema,
});

/** Тип пользователя, выводимый из схемы Valibot */
export type User = v.InferOutput<typeof UserSchema>;
