import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import {
  type ActivateStreamCmd,
  type ActivateStreamCmdMeta,
  ActivateStreamCmdSchema,
} from '#domain/stream/commands/activate-stream-cmd';
import { StreamUseCase } from '../stream-uc';

export class ActivateStreamUc extends StreamUseCase<ActivateStreamCmdMeta> {
  protected readonly ucName = 'activate-stream' as const;
  protected readonly ucLabel = 'Активировать поток' as const;
  protected readonly arMeta = { arName: 'Stream' as const, arLabel: 'Поток' as const };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = ActivateStreamCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(command: ActivateStreamCmd, _actorId: string): Promise<void> {
    const streamEntity = await this.getStream(command.streamId);
    const streamAr = new StreamAr(streamEntity);

    streamAr.activate();

    await this.resolve.streamRepo.save(streamAr.state);
  }
}
