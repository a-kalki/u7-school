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

/**
 * Событие завершения студентом модуля потока.
 *
 * Публикуется агрегатом Student при advance()/markNotAdvanced().
 * Подписчики стори формируют уведомления (текст/кнопки) по паре
 * (outcome, место модуля в программе курса через фасад).
 * Отчисление (abandoned) НЕ публикуется.
 */
export interface StudentCompletedEvent extends DomainEvent {
  eventName: 'student.completed';
  aggregateName: 'Student';
  payload: {
    /** uuid записи студента */
    studentId: string;
    /** uuid пользователя */
    userId: string;
    /** uuid потока */
    streamId: string;
    /** uuid завершённого модуля */
    moduleId: string;
    /** исход завершения */
    outcome: 'advanced' | 'not_advanced';
  };
}
