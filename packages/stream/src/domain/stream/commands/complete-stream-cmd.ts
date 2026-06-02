import * as v from 'valibot';
import type { StreamArMeta } from '../entity';
import { StreamSchema } from '../entity';

export const CompleteStreamCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
});

export type CompleteStreamCmd = v.InferOutput<typeof CompleteStreamCmdSchema>;

export interface CompleteStreamCmdMeta {
  ucName: 'complete-stream';
  arMeta: StreamArMeta;
  input: CompleteStreamCmd;
  output: undefined;
  errors: never;
  requiresAuth: true;
  type: 'command';
}
