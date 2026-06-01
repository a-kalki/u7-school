import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import type { StreamSchema } from '../entity';
import { StreamSchema } from '../entity';

export const GetStreamCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
});

export type GetStreamCmd = v.InferOutput<typeof GetStreamCmdSchema>;

export interface GetStreamCmdMeta extends UcMeta {
  ucName: 'get-stream';
  input: GetStreamCmd;
  output: ReturnType<typeof StreamSchema>;
  errors: StreamUcErrors;
  requiresAuth: false;
  type: 'query';
}
