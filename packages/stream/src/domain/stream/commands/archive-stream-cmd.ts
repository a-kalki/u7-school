import * as v from 'valibot';
import type { StreamArMeta } from '../entity';
import { StreamSchema } from '../entity';

export const ArchiveStreamCmdSchema = v.object({
  streamId: StreamSchema.entries.uuid,
});

export type ArchiveStreamCmd = v.InferOutput<typeof ArchiveStreamCmdSchema>;

export interface ArchiveStreamCmdMeta {
  ucName: 'archive-stream';
  arMeta: StreamArMeta;
  input: ArchiveStreamCmd;
  output: undefined;
  errors: never;
  requiresAuth: true;
  type: 'command';
}
