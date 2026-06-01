import { BaseJsonRepo } from '@u7-scl/core/infra';
import type { StreamStudent } from '#domain/stream-student/entity';
import type { StreamStudentRepo } from '#domain/stream-student/repo';

export class StreamStudentJsonRepo
  extends BaseJsonRepo<StreamStudent>
  implements StreamStudentRepo
{
  async getByUuid(uuid: string): Promise<StreamStudent | undefined> {
    return this.db.get<StreamStudent>(this.path, uuid);
  }

  async save(state: StreamStudent): Promise<void> {
    await this.db.save(this.path, state.uuid, state);
  }
}
