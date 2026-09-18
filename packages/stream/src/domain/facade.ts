import type { User } from '@u7-scl/app/domain';
import type { StudentOutcomeCategory } from './status';
import type { Stream } from './stream/entity';

/**
 * Факт участия студента в потоке — read-API студента без сырых статусов.
 * Для снапшотов кампаний peer-review (ФР-3 трека peer-review-domain).
 */
export interface StreamMemberOutcome {
  userId: string;
  /** Категория исхода студента (StudentAr.outcomeCategory). */
  outcomeCategory: StudentOutcomeCategory;
  /** Признак «не начал»: нет ни одного завершённого шага (StudentAr.neverStarted). */
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
   * Состав потока с исходами студентов (read-API StudentAr, без сырых
   * статусов). Поток не найден — undefined.
   */
  getMembers(streamId: string): Promise<StreamMembers | undefined>;
}
