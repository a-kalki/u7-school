import { type UcMeta, UseCase } from '@u7-scl/core/api';
import {
  errAccessDenied,
  errNotFound,
} from '@u7-scl/core/domain';
import type { User } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import type { Stream } from '#domain/stream/entity';
import type {
  StreamAccessDeniedUcError,
  StreamNotFoundUcError,
  StreamUcErrors,
} from './errors';

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
      this.throwError(
        errNotFound<StreamNotFoundUcError>(
          'STREAM_NOT_FOUND',
          'Поток не найден',
          { uuid: streamId },
        ) as StreamUcErrors,
      );
    }
    return stream;
  }

  protected async getActor(actorId: string): Promise<User> {
    const actor = await this.resolve.userFacade.getUserByUuid(actorId, actorId);
    if (!actor) {
      this.throwError(
        errNotFound<StreamNotFoundUcError>(
          'STREAM_NOT_FOUND',
          'Пользователь не найден',
          { uuid: actorId },
        ) as StreamUcErrors,
      );
    }
    return actor;
  }

  protected throwAccessDenied(
    message = 'Недостаточно прав для выполнения действия',
  ): never {
    this.throwError(
      errAccessDenied<StreamAccessDeniedUcError>(
        'STREAM_ACCESS_DENIED',
        message,
        undefined,
      ) as StreamUcErrors,
    );
  }
}
