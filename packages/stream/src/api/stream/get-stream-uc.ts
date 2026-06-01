import { StreamSchema } from '#domain/stream/entity';
import {
  type GetStreamCmd,
  type GetStreamCmdMeta,
  GetStreamCmdSchema,
} from '#domain/stream/commands/get-stream-cmd';
import { StreamUseCase } from '../stream-uc';

export class GetStreamUc extends StreamUseCase<GetStreamCmdMeta> {
  protected readonly ucName = 'get-stream' as const;
  protected readonly ucLabel = 'Получить поток' as const;
  protected readonly arMeta = {
    arName: 'Stream' as const,
    arLabel: 'Поток' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetStreamCmdSchema;
  protected readonly outputSchema = StreamSchema;

  async execute(command: GetStreamCmd): Promise<GetStreamCmdMeta['output']> {
    return this.getStream(command.streamId);
  }
}
