import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import { StreamSchema } from '../../stream/entity';
import type { StreamStudentArMeta } from '../entity';
import type { StreamUcErrors } from '../../../api/errors';

/** Схема валидации команды зачисления на поток */
export const EnrollStudentCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
  userId: v.string(), // UUID пользователя
});

/** Команда зачисления на поток */
export type EnrollStudentCmd = v.InferOutput<typeof EnrollStudentCmdSchema>;

export interface EnrollStudentCmdMeta extends UcMeta {
  ucName: 'enroll-student';
  input: EnrollStudentCmd;
  output: undefined;
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'command';
  arMeta: StreamStudentArMeta;
}
