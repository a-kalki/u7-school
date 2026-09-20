import type { User } from '@u7-scl/app/domain';
import type { Stream } from './stream/entity';
import type { Student } from './student/entity';

/**
 * Студент в составе потока (read-API): сырой статус без склейки
 * «прошёл»/«не прошёл» — проекцию исходов делают потребители
 * (ER peer-review, ФР-2).
 */
export interface StreamMember {
  userId: string;
  status: Student['status'];
  neverStarted: boolean;
}

/**
 * Состав потока: ментор + студенты со статусами.
 */
export interface StreamMembers {
  mentorId: string;
  students: StreamMember[];
}

/**
 * Фасад модуля потоков для внешних модулей.
 */
export interface StreamFacade {
  getStream(streamId: string, actor?: User): Promise<Stream | undefined>;

  /**
   * Состав потока со статусами студентов. Поток не найден — undefined.
   */
  getMembers(streamId: string): Promise<StreamMembers | undefined>;
}
