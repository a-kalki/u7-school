import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import { StreamUseCase } from '../stream-uc';

export const CompleteStreamCmdSchema = v.object({
  streamId: v.pipe(v.string(), v.uuid('Некорректный UUID потока')),
});

export type CompleteStreamCmd = v.InferOutput<typeof CompleteStreamCmdSchema>;

export interface CompleteStreamCmdMeta {
  name: 'complete-stream';
  label: 'Завершить поток';
  input: CompleteStreamCmd;
}

export class CompleteStreamUc extends StreamUseCase<CompleteStreamCmdMeta> {
  protected readonly ucName = 'complete-stream' as const;
  protected readonly ucLabel = 'Завершить поток' as const;
  protected readonly arMeta = { arName: 'Stream', arLabel: 'Поток' };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CompleteStreamCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(command: CompleteStreamCmd, _actorId: string): Promise<void> {
    const streamEntity = await this.getStream(command.streamId);
    const streamAr = new StreamAr(streamEntity);

    streamAr.complete();

    await this.resolve.streamRepo.save(streamAr.state);
  }
}
