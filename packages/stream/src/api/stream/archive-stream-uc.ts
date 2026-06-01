import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import {
  type ArchiveStreamCmd,
  type ArchiveStreamCmdMeta,
  ArchiveStreamCmdSchema,
} from '#domain/stream/commands/archive-stream-cmd';
import { StreamUseCase } from '../stream-uc';

export class ArchiveStreamUc extends StreamUseCase<ArchiveStreamCmdMeta> {
  protected readonly ucName = 'archive-stream' as const;
  protected readonly ucLabel = 'Архивировать поток' as const;
  protected readonly arMeta = { arName: 'Stream' as const, arLabel: 'Поток' as const };
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
