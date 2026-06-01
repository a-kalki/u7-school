import { type UcMeta, UseCase } from '@u7-scl/core/api';
import type { User } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import type { Stream } from '#domain/stream/entity';
import type { StreamUcErrors } from './errors';

/**
 * Базовый класс для всех use-case'ов модуля потоков.
 */
export abstract class StreamUseCase<TMeta extends UcMeta> extends UseCase<
  TMeta,
  StreamApiModuleResolver
> {
  protected async getStream(streamId: string): Promise<Stream> {
    const stream = await this.resolve.streamRepo.getByUuid(streamId);
    if (!stream) {
      this.throwError({
        name: 'STREAM_NOT_FOUND',
        level: 'domain',
        kind: 'not_found',
        message: 'Поток не найден',
        payload: { uuid: streamId },
      } as StreamUcErrors);
    }
    return stream;
  }

  protected async getActor(actorId: string): Promise<User> {
    const actor = await this.resolve.userFacade.getUserByUuid(actorId, actorId);
    if (!actor) {
      this.throwError({
        name: 'STREAM_ACCESS_DENIED',
        level: 'domain',
        kind: 'unauthorized',
        message: 'Пользователь не найден',
        payload: undefined,
      } as StreamUcErrors);
    }
    return actor;
  }

  protected throwAccessDenied(
    message = 'Недостаточно прав для выполнения действия',
  ): never {
    this.throwError({
      name: 'STREAM_ACCESS_DENIED',
      level: 'domain',
      kind: 'unauthorized',
      message,
      payload: undefined,
    } as StreamUcErrors);
  }
}
