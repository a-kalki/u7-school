import type { User } from '@u7-scl/app/domain';
import type { StudentOutcomeCategory } from './status';
import type { Stream } from './stream/entity';

/**
 * Факт участия студента в потоке.
 */
export interface StreamMemberOutcome {
  userId: string;
  outcomeCategory: StudentOutcomeCategory;
  neverStarted: boolean;
}

/**
 * Состав потока: ментор + студенты с исходами.
 */
export interface StreamMembers {
  mentorId: string;
  students: StreamMemberOutcome[];
}

/**
 * Фасад модуля потоков для внешних модулей.
 */
export interface StreamFacade {
  getStream(streamId: string, actor?: User): Promise<Stream | undefined>;

  /**
   * Состав потока с исходами студентов. Поток не найден — undefined.
   */
  getMembers(streamId: string): Promise<StreamMembers | undefined>;
}
