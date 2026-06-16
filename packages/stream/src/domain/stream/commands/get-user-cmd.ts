import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';

/** Схема команды получения пользователя по UUID */
export const GetUserCmdSchema = v.object({
  userId: v.pipe(v.string(), v.uuid('Некорректный формат UUID пользователя')),
});

export type GetUserCmd = v.InferOutput<typeof GetUserCmdSchema>;

export interface GetUserCmdMeta extends UcMeta {
  ucName: 'get-user';
  input: GetUserCmd;
  output: {
    uuid: string;
    name: string;
    roles: string[];
  };
  errors: StreamUcErrors;
  requiresAuth: false;
  type: 'query';
}
