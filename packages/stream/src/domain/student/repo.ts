import type { Student } from './entity';

export interface StudentRepo {
  save(student: Student): Promise<void>;
  getByUuid(uuid: string): Promise<Student | undefined>;
  getByStream(streamId: string): Promise<Student[]>;
  getByUser(userId: string): Promise<Student[]>;
}
