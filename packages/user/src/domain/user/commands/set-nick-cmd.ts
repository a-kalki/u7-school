import * as v from 'valibot';
import type { UserArMeta } from '../../entity';
import type { AccessDeniedUcError, UserNotFoundUcError } from './errors';

/** Схема валидации команды установки ника */
export const SetNickCmdSchema = v.object({
  nick: v.optional(v.pipe(v.string(), v.trim())),
});

/** Команда установки ника */
export type SetNickCmd = v.InferOutput<typeof SetNickCmdSchema>;

/** Мета команды установки ника */
export interface SetNickCmdMeta {
  ucName: 'set-nick';
  arMeta: UserArMeta;
  input: SetNickCmd;
  output: undefined;
  errors: SetNickCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды установки ника */
export type SetNickCmdError = UserNotFoundUcError | AccessDeniedUcError;
