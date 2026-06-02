import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import {
  type CompleteStreamCmd,
  type CompleteStreamCmdMeta,
  CompleteStreamCmdSchema,
} from '#domain/stream/commands/complete-stream-cmd';
import { StreamPolicy } from '#domain/stream/policy';
import { StreamUseCase } from '../stream-uc';

export class CompleteStreamUc extends StreamUseCase<CompleteStreamCmdMeta> {
  protected readonly ucName = 'complete-stream' as const;
  protected readonly ucLabel = 'Завершить поток' as const;
  protected readonly arMeta = {
    arName: 'Stream' as const,
    arLabel: 'Поток' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CompleteStreamCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(command: CompleteStreamCmd, actorId: string): Promise<void> {
    const streamEntity = await this.getStream(command.streamId);

    // Проверка прав: ментор потока или админ
    const actor = await this.getActor(actorId);
    if (!StreamPolicy.canEdit(actor, streamEntity)) {
      this.throwAccessDenied();
    }

    const streamAr = new StreamAr(streamEntity);

    streamAr.complete();

    await this.resolve.streamRepo.save(streamAr.state);
  }
}
