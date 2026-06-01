import type { StreamStatus } from './status';

/** Идентификатор учебного потока (UUID) */
export type StreamId = string;

/** Идентификатор записи студента в потоке (UUID) */
export type StreamStudentId = string;

/** Статус прохождения шага студентом */
export type StepRecordStatus = 'issued' | 'completed';

/** Фильтр для списка потоков */
export interface StreamListFilter {
  status?: StreamStatus;
  mentorId?: string;
}
