import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import { StreamSchema } from '../../stream/entity';
import type { StudentArMeta } from '../entity';
import { StudentSchema } from '../entity';

/** Схема команды выбора предпочтения (хочет дальше / повторить) */
export const SetNextPreferenceCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
  studentId: StudentSchema.entries.uuid,
  preference: v.union([
    v.literal('wants_next'),
    v.literal('wants_repeat'),
    v.literal('undecided'),
  ]),
});

/** Команда выбора предпочтения студентом */
export type SetNextPreferenceCmd = v.InferOutput<
  typeof SetNextPreferenceCmdSchema
>;

export interface SetNextPreferenceCmdMeta extends UcMeta {
  ucName: 'set-next-preference';
  arMeta: StudentArMeta;
  input: SetNextPreferenceCmd;
  output: undefined;
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'command';
}
