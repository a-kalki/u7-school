import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import { StreamUseCase } from '../stream-uc';

export const ArchiveStreamCmdSchema = v.object({
  streamId: v.pipe(v.string(), v.uuid('Некорректный UUID потока')),
});

export type ArchiveStreamCmd = v.InferOutput<typeof ArchiveStreamCmdSchema>;

export interface ArchiveStreamCmdMeta {
  name: 'archive-stream';
  label: 'Архивировать поток';
  input: ArchiveStreamCmd;
}

export class ArchiveStreamUc extends StreamUseCase<ArchiveStreamCmdMeta> {
  protected readonly ucName = 'archive-stream' as const;
  protected readonly ucLabel = 'Архивировать поток' as const;
  protected readonly arMeta = { arName: 'Stream', arLabel: 'Поток' };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = ArchiveStreamCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(command: ArchiveStreamCmd, _actorId: string): Promise<void> {
    const streamEntity = await this.getStream(command.streamId);
    const streamAr = new StreamAr(streamEntity);

    streamAr.archive();

    await this.resolve.streamRepo.save(streamAr.state);
  }
}
