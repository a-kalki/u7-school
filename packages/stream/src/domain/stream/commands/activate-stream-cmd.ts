import * as v from 'valibot';
import type { StreamArMeta } from '../entity';
import { StreamSchema } from '../entity';

export const ActivateStreamCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
});

export type ActivateStreamCmd = v.InferOutput<typeof ActivateStreamCmdSchema>;

export interface ActivateStreamCmdMeta {
  ucName: 'activate-stream';
  arMeta: StreamArMeta;
  input: ActivateStreamCmd;
  output: undefined;
  errors: never;
  requiresAuth: true;
  type: 'command';
}
