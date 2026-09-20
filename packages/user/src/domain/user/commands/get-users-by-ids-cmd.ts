import * as v from 'valibot';
import type { User, UserArMeta } from '#domain/user/entity';
import { UserSchema } from '#domain/user/entity';

/** Максимум идентификаторов в одном пакетном запросе */
export const GET_USERS_BY_IDS_MAX = 100;

/** Схема валидации команды пакетного получения пользователей */
export const GetUsersByIdsCmdSchema = v.object({
  userIds: v.pipe(
    v.array(UserSchema.entries.uuid),
    v.maxLength(GET_USERS_BY_IDS_MAX),
  ),
});

/** Команда пакетного получения пользователей по UUID */
export type GetUsersByIdsCmd = v.InferOutput<typeof GetUsersByIdsCmdSchema>;

/** Мета команды пакетного получения пользователей */
export interface GetUsersByIdsCmdMeta {
  ucName: 'get-users-by-ids';
  arMeta: UserArMeta;
  input: GetUsersByIdsCmd;
  output: User[];
  errors: GetUsersByIdsCmdError;
  requiresAuth: true;
  type: 'query';
}

/** Ошибки команды пакетного получения пользователей */
export type GetUsersByIdsCmdError = never;
