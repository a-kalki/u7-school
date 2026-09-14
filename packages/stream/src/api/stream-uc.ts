import { U7UseCase } from '@u7-scl/app/domain';
import type { UcMeta } from '@u7-scl/core/api';
import { errAccessDenied, errNotFound } from '@u7-scl/core/domain';
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
export abstract class StreamUseCase<TMeta extends UcMeta> extends U7UseCase<
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
