import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import { StreamSchema } from '../../stream/entity';
import type { StudentArMeta } from '../entity';
import { StudentSchema } from '../entity';

/** Схема команды отчисления студента ментором */
export const MarkAbandonedCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
  studentId: StudentSchema.entries.uuid,
  cause: v.union([v.literal('inactivity'), v.literal('by_mentor')]),
});

/** Команда отчисления студента ментором */
export type MarkAbandonedCmd = v.InferOutput<typeof MarkAbandonedCmdSchema>;

export interface MarkAbandonedCmdMeta extends UcMeta {
  ucName: 'mark-abandoned';
  arMeta: StudentArMeta;
  input: MarkAbandonedCmd;
  output: undefined;
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'command';
}
