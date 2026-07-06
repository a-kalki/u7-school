import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import { StreamSchema } from '../../stream/entity';
import type { StudentArMeta } from '../entity';
import { StudentSchema } from '../entity';

/** Схема валидации команды отчисления студента */
export const ExpelStudentCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
  studentId: StudentSchema.entries.uuid,
});

/** Команда отчисления студента */
export type ExpelStudentCmd = v.InferOutput<typeof ExpelStudentCmdSchema>;

export interface ExpelStudentCmdMeta extends UcMeta {
  ucName: 'expel-student';
  arMeta: StudentArMeta;
  input: ExpelStudentCmd;
  output: undefined;
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'command';
}
