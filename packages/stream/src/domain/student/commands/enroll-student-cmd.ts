import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import { StreamSchema } from '../../stream/entity';
import type { StudentArMeta } from '../entity';

/** Схема валидации команды зачисления на поток */
export const EnrollStudentCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
  userId: v.string(), // UUID пользователя
});

/** Команда зачисления на поток */
export type EnrollStudentCmd = v.InferOutput<typeof EnrollStudentCmdSchema>;

export interface EnrollStudentCmdMeta extends UcMeta {
  ucName: 'enroll-student';
  arMeta: StudentArMeta;
  input: EnrollStudentCmd;
  output: void;
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'command';
}
