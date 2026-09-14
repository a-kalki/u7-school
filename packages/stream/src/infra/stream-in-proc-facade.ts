import type { User } from '@u7-scl/app/domain';
import { AppException } from '@u7-scl/core/domain';
import type { StreamApiModule } from '#api/module';
import type { StreamFacade } from '#domain/facade';
import type { Stream } from '#domain/stream/entity';

/**
 * In-process реализация фасада потоков.
 * Принимает StreamApiModule и делегирует вызовы его API.
 */
export class StreamInProcFacade implements StreamFacade {
  readonly #streamApi: StreamApiModule;

  constructor(streamApi: StreamApiModule) {
    this.#streamApi = streamApi;
  }

  async getStream(streamId: string, actor?: User): Promise<Stream | undefined> {
    try {
      const result = await this.#streamApi.execute(
        'get-stream',
        { streamId },
        actor,
      );
      return result as Stream;
    } catch (err) {
      if (err instanceof AppException && err.error.kind === 'not-found') {
        return undefined;
      }
      throw err;
    }
  }
}
