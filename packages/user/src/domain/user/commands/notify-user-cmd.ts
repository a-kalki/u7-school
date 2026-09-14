import { NotifyKindSchema } from '@u7-scl/core/domain';
import * as v from 'valibot';
import type { UserArMeta } from '#domain/user/entity';
import { UserSchema } from '#domain/user/entity';

/** Схема валидации команды уведомления пользователя */
export const NotifyUserCmdSchema = v.object({
  userId: UserSchema.entries.uuid,
  text: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Текст уведомления не может быть пустым'),
    v.maxLength(3500, 'Текст уведомления слишком длинный'),
  ),
  kind: v.optional(NotifyKindSchema),
});

/**
 * Команда уведомления пользователя.
 * text — упрощённый markdown без экранирования: диалект канала
 * (MarkdownV2/HTML) — забота доставщика, а не отправителя.
 */
export type NotifyUserCmd = v.InferOutput<typeof NotifyUserCmdSchema>;

/** Мета команды уведомления пользователя */
export interface NotifyUserCmdMeta {
  ucName: 'notify-user';
  arMeta: UserArMeta;
  input: NotifyUserCmd;
  output: undefined;
  errors: never;
  requiresAuth: false;
  type: 'command';
}
