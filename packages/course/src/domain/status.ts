import * as v from 'valibot';

/**
 * Статусы сущностей платформы u7-school.
 * - DRAFT: черновик, виден только автору
 * - PUBLISHED: опубликован, виден всем
 * - ARCHIVED: архивирован, виден только автору и администраторам
 */
export enum Status {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/** Valibot-схема для валидации статуса */
export const StatusSchema = v.picklist(
  [Status.DRAFT, Status.PUBLISHED, Status.ARCHIVED],
  `Недопустимый статус. Ожидается: ${Object.values(Status).join(', ')}`,
);
