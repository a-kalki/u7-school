import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import { StreamUseCase } from '../stream-uc';

export const ActivateStreamCmdSchema = v.object({
  streamId: v.pipe(v.string(), v.uuid('Некорректный UUID потока')),
});

export type ActivateStreamCmd = v.InferOutput<typeof ActivateStreamCmdSchema>;

export interface ActivateStreamCmdMeta {
  name: 'activate-stream';
  label: 'Активировать поток';
  input: ActivateStreamCmd;
}

export class ActivateStreamUc extends StreamUseCase<ActivateStreamCmdMeta> {
  protected readonly ucName = 'activate-stream' as const;
  protected readonly ucLabel = 'Активировать поток' as const;
  protected readonly arMeta = { arName: 'Stream', arLabel: 'Поток' };
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
