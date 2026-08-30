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
 * Событие снятия студента с учёбы (самовыход или решение ментора).
 *
 * Публикуется агрегатом Student при drop()/markAbandoned().
 * Потребители: ER кика из Telegram-группы потока, стори уведомлений
 * (ментору при самовыходе, студенту при решении ментора).
 */
export interface StudentAbandonedEvent extends DomainEvent {
  eventName: 'student.abandoned';
  aggregateName: 'Student';
  payload: {
    /** uuid записи студента */
    studentId: string;
    /** uuid пользователя */
    userId: string;
    /** uuid потока */
    streamId: string;
    /** кто инициировал уход: сам студент или ментор */
    who: 'self' | 'mentor';
    /** причина ухода */
    cause: 'voluntary' | 'inactivity' | 'by_mentor';
  };
}

/**
 * Событие завершения студентом модуля потока.
 *
 * Публикуется агрегатом Student при advance()/markNotAdvanced().
 * Подписчики стори формируют уведомления (текст/кнопки) по паре
 * (outcome, место модуля в программе курса через фасад).
 * Снятие с учёбы публикуется отдельным событием student.abandoned.
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
