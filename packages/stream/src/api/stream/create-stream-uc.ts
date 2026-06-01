import { StreamAr } from '#domain/stream/a-root';
import {
  type CreateStreamCmd,
  type CreateStreamCmdMeta,
  CreateStreamCmdSchema,
} from '#domain/stream/commands/create-stream-cmd';
import { type Stream, StreamSchema } from '#domain/stream/entity';
import { StreamPolicy } from '#domain/stream/policy';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case создания потока.
 */
export class CreateStreamUc extends StreamUseCase<CreateStreamCmdMeta> {
  protected readonly ucName = 'create-stream' as const;
  protected readonly ucLabel = 'Создать поток' as const;
  protected readonly arMeta = {
    arName: StreamAr.arName as "Stream",
    arLabel: StreamAr.arLabel as "Поток",
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CreateStreamCmdSchema;
  protected readonly outputSchema = StreamSchema;

  async execute(command: CreateStreamCmd, actorId: string): Promise<Stream> {
    const repo = this.resolve.streamRepo;
    const courseFacade = this.resolve.courseFacade;

    const actor = await this.getActor(actorId);
    if (!StreamPolicy.canCreate(actor)) {
      this.throwAccessDenied('Недостаточно прав для создания потока');
    }

    const snapshot = await courseFacade.getModuleSnapshot(command.moduleId);

    const ar = StreamAr.create(command, snapshot);
    await repo.save(ar.state);

    return ar.state;
  }
}
