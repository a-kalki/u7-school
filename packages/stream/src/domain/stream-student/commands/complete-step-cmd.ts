import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';

export const CompleteStepCmdSchema = v.object({
  studentId: v.pipe(v.string(), v.uuid('Некорректный формат UUID студента')),
  streamId: v.pipe(v.string(), v.uuid('Некорректный формат UUID потока')),
  stepId: v.pipe(v.string(), v.uuid('Некорректный формат UUID шага')),
});

export type CompleteStepCmd = v.InferOutput<typeof CompleteStepCmdSchema>;

export interface CompleteStepCmdMeta extends UcMeta {
  name: 'complete-step';
  label: 'Завершить шаг';
  input: CompleteStepCmd;
}
