import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import { StreamSchema } from '../../stream/entity';
import type { StudentArMeta } from '../entity';
import { StudentSchema } from '../entity';

/** Схема команды завершения студента ментором (выбор исхода) */
export const CompleteStudentCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
  studentId: StudentSchema.entries.uuid,
  outcome: v.union([
    v.literal('advanced'),
    v.literal('not_advanced'),
    v.literal('abandoned'),
  ]),
});

/** Команда завершения студента ментором */
export type CompleteStudentCmd = v.InferOutput<typeof CompleteStudentCmdSchema>;

export interface CompleteStudentCmdMeta extends UcMeta {
  ucName: 'complete-student';
  arMeta: StudentArMeta;
  input: CompleteStudentCmd;
  output: undefined;
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'command';
}
