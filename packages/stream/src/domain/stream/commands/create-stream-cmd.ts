import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import type { Stream, StreamArMeta } from '../entity';
import { StreamSchema } from '../entity';

/** Схема валидации команды создания потока */
export const CreateStreamCmdSchema = v.object({
  title: StreamSchema.entries.title,
  description: StreamSchema.entries.description,
  mentorId: StreamSchema.entries.mentorId,
  moduleId: StreamSchema.entries.moduleId,
  startDate: StreamSchema.entries.startDate,
  telegramGroupId: StreamSchema.entries.telegramGroupId,
  telegramGroupInvite: StreamSchema.entries.telegramGroupInvite,
  goal: StreamSchema.entries.goal,
  result: StreamSchema.entries.result,
  rules: StreamSchema.entries.rules,
  additional: StreamSchema.entries.additional,
  targetAudience: StreamSchema.entries.targetAudience,
  enrollmentKey: StreamSchema.entries.enrollmentKey,
});

/** Команда создания потока */
export type CreateStreamCmd = v.InferOutput<typeof CreateStreamCmdSchema>;

export interface CreateStreamCmdMeta extends UcMeta {
  ucName: 'create-stream';
  arMeta: StreamArMeta;
  input: CreateStreamCmd;
  output: Stream;
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'command';
}
