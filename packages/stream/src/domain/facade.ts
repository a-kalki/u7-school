import type { User } from '@u7-scl/app/domain';
import type { Stream } from './stream/entity';

/**
 * Фасад модуля потоков для внешних модулей.
 */
export interface StreamFacade {
  getStream(streamId: string, actor?: User): Promise<Stream | undefined>;
}
