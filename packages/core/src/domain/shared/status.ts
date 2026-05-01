import * as v from "valibot";

/**
 * Статусы жизненного цикла образовательного контента.
 * - draft: черновик, виден только автору
 * - published: опубликован, доступен студентам
 * - archived: архивирован, скрыт из активных списков
 */
export enum Status {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

/** Valibot-схема для валидации статуса */
export const StatusSchema = v.picklist(
  [Status.DRAFT, Status.PUBLISHED, Status.ARCHIVED],
  "Недопустимый статус. Ожидается: draft, published или archived",
);
