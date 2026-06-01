import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import type { CompletionResult } from '../../types';
import type { StudentArMeta } from '../entity';

export const CompleteStepCmdSchema = v.object({
  studentId: v.pipe(v.string(), v.uuid('Некорректный формат UUID студента')),
  streamId: v.pipe(v.string(), v.uuid('Некорректный формат UUID потока')),
  stepId: v.pipe(v.string(), v.uuid('Некорректный формат UUID шага')),
});

export type CompleteStepCmd = v.InferOutput<typeof CompleteStepCmdSchema>;

export interface CompleteStepCmdMeta extends UcMeta {
  ucName: 'complete-step';
  arMeta: StudentArMeta;
  input: CompleteStepCmd;
  output: CompletionResult;
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'command';
}
