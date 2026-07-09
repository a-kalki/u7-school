import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import { StreamSchema } from '../../stream/entity';
import type { StudentArMeta } from '../entity';
import { StudentSchema } from '../entity';

/** Схема команды самостоятельного выхода студента из потока */
export const DropStudentCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
  studentId: StudentSchema.entries.uuid,
});

/** Команда самостоятельного выхода студента из потока */
export type DropStudentCmd = v.InferOutput<typeof DropStudentCmdSchema>;

export interface DropStudentCmdMeta extends UcMeta {
  ucName: 'drop-student';
  arMeta: StudentArMeta;
  input: DropStudentCmd;
  output: undefined;
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'command';
}
