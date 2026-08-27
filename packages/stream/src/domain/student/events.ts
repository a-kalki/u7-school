import type { DomainEvent } from '@u7-scl/core/domain';

/**
 * Событие зачисления студента на поток.
 *
 * Публикуется агрегатом Student при зачислении (StudentAr.enroll).
 * Потребители (например, ER fulfill-wish) резолвят принадлежность
 * модуля курсу через модуль курсов — payload сознательно без courseId.
 */
export interface StudentEnrolledEvent extends DomainEvent {
  eventName: 'student.enrolled';
  aggregateName: 'Student';
  payload: {
    /** uuid записи студента */
    studentId: string;
    /** uuid пользователя */
    userId: string;
    /** uuid потока */
    streamId: string;
    /** uuid модуля потока */
    moduleId: string;
  };
}
