import type { Stream } from './stream/entity';

/**
 * Фасад модуля потоков для внешних модулей.
 */
export interface StreamFacade {
  getStream(streamId: string, actorId?: string): Promise<Stream | undefined>;
}
