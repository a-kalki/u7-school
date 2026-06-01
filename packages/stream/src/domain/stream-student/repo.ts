import type { StreamStudent } from './entity';

export interface StreamStudentRepo {
  save(student: StreamStudent): Promise<void>;
  getByUuid(uuid: string): Promise<StreamStudent | undefined>;
  getByStream(streamId: string): Promise<StreamStudent[]>;
  getByUser(userId: string): Promise<StreamStudent[]>;
}
