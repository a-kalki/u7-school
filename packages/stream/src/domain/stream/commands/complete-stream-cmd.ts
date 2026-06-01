import * as v from 'valibot';
import type { Stream, StreamArMeta } from '../entity';
import { StreamSchema } from '../entity';

export const CompleteStreamCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
});

export type CompleteStreamCmd = v.InferOutput<typeof CompleteStreamCmdSchema>;

export interface CompleteStreamCmdMeta {
  ucName: 'complete-stream';
  arMeta: StreamArMeta;
  input: CompleteStreamCmd;
  output: Stream;
  errors: never;
  requiresAuth: true;
  type: 'command';
}
