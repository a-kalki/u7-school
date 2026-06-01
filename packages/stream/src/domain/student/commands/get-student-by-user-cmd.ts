import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import type { StudentSchema } from '../entity';

export const GetStudentByUserCmdSchema = v.object({
  userId: v.pipe(v.string(), v.uuid('Некорректный формат UUID пользователя')),
});

export type GetStudentByUserCmd = v.InferOutput<
  typeof GetStudentByUserCmdSchema
>;

export interface GetStudentByUserCmdMeta extends UcMeta {
  ucName: 'get-student-by-user';
  input: GetStudentByUserCmd;
  output: ReturnType<typeof StudentSchema>;
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'query';
}
