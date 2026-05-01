import * as v from "valibot";

/**
 * Схема пользователя платформы u7-school.
 * Содержит поля: uuid, name, telegramId, role, createdAt, updatedAt.
 */
export const UserSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
  name: v.pipe(v.string(), v.nonEmpty("Имя не может быть пустым")),
  telegramId: v.pipe(
    v.number(),
    v.integer("telegramId должен быть целым числом"),
    v.minValue(1, "telegramId должен быть положительным"),
  ),
  role: v.pipe(
    v.string(),
    v.picklist(
      ["STUDENT", "MENTOR", "ADMIN"],
      "Недопустимая роль. Ожидается: STUDENT, MENTOR или ADMIN",
    ),
  ),
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
});

/** Тип пользователя, выводимый из схемы Valibot */
export type User = v.InferOutput<typeof UserSchema>;
