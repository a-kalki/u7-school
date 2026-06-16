import * as v from 'valibot';
import { errNotFound } from '@u7-scl/core/domain';
import {
  type GetUserCmd,
  type GetUserCmdMeta,
  GetUserCmdSchema,
} from '#domain/stream/commands/get-user-cmd';
import type { StreamNotFoundUcError, StreamUcErrors } from '../errors';
import { StreamUseCase } from '../stream-uc';

/**
 * Получение информации о пользователе по UUID.
 * Проксирует вызов в UserFacade.
 */
export class GetUserUc extends StreamUseCase<GetUserCmdMeta> {
  protected readonly ucName = 'get-user' as const;
  protected readonly ucLabel = 'Получить пользователя' as const;
  protected readonly arMeta = {
    arName: 'User' as const,
    arLabel: 'Пользователь' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetUserCmdSchema;
  protected readonly outputSchema = v.object({
    uuid: v.string(),
    name: v.string(),
    roles: v.array(v.string()),
  });

  async execute(command: GetUserCmd): Promise<GetUserCmdMeta['output']> {
    const user = await this.resolve.userFacade.getUserByUuid(command.userId);

    if (!user) {
      this.throwError(
        errNotFound<StreamNotFoundUcError>(
          'STREAM_NOT_FOUND',
          'Пользователь не найден',
          { uuid: command.userId },
        ) as StreamUcErrors,
      );
    }

    return {
      uuid: user.uuid,
      name: user.name,
      roles: user.roles,
    };
  }
}
