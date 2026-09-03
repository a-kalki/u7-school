import type { Stream } from './stream/entity';

/**
 * Фасад модуля потоков для внешних модулей.
 *
 * Предоставляет чтение потока без раскрытия внутреннего устройства
 * модуля @u7-scl/stream. Потребители — например, ER invite-wishers
 * (модуль желаний) при составлении текста приглашения на открытый набор.
 */
export interface StreamFacade {
  /** Получить поток по uuid. undefined — поток не существует. */
  getStream(streamId: string, actorId?: string): Promise<Stream | undefined>;
}
