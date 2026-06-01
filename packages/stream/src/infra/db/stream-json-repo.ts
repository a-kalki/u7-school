import { BaseJsonRepo } from '@u7-scl/core/infra';
import type { CreateStreamCmd } from '#domain/stream/commands/create-stream-cmd';
import type { Stream } from '#domain/stream/entity';
import type { StreamRepo } from '#domain/stream/repo';

export class StreamJsonRepo extends BaseJsonRepo<Stream> implements StreamRepo {
  async getByUuid(uuid: string): Promise<Stream | undefined> {
    return this.db.get<Stream>(this.path, uuid);
  }

  async save(state: Stream): Promise<void> {
    await this.db.save(this.path, state.uuid, state);
  }

  async list(filter: {
    status?: string;
    mentorId?: string;
  }): Promise<Stream[]> {
    const all = await this.db.getAll<Stream>(this.path);
    return all.filter((s) => {
      if (filter.status && s.status !== filter.status) return false;
      if (filter.mentorId && s.mentorId !== filter.mentorId) return false;
      return true;
    });
  }
}
