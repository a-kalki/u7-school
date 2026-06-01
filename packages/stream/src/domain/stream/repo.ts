import type { Stream } from './entity';

export interface StreamRepo {
  save(stream: Stream): Promise<void>;
  getByUuid(uuid: string): Promise<Stream | undefined>;
  getAll(filter?: { status?: string; mentorId?: string }): Promise<Stream[]>;
}
