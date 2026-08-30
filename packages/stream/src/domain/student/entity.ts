import type { ArMeta } from '@u7-scl/core/domain';
import * as v from 'valibot';
import type {
  StudentAbandonedEvent,
  StudentCompletedEvent,
  StudentEnrolledEvent,
} from './events';

/** Детали отчисления студента */
export const AbandonDetailsSchema = v.object({
  who: v.picklist(['self', 'mentor'], 'Недопустимое значение who'),
  cause: v.picklist(
    ['voluntary', 'inactivity', 'by_mentor'],
    'Недопустимое значение cause',
  ),
});

export type AbandonDetails = v.InferOutput<typeof AbandonDetailsSchema>;

/** Детали завершения прохождения потока */
export const CompletionDetailsSchema = v.object({
  nextPreference: v.picklist(
    ['wants_next', 'wants_repeat', 'undecided'],
    'Недопустимое значение nextPreference',
  ),
});

export type CompletionDetails = v.InferOutput<typeof CompletionDetailsSchema>;

/** Схема записи о прохождении конкретного шага */
export const StepRecordSchema = v.object({
  stepId: v.pipe(v.string(), v.uuid('Некорректный формат UUID шага')),
  status: v.picklist(
    ['issued', 'completed'],
    'Недопустимый статус прохождения шага',
  ),
  issuedAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты выдачи'),
  ),
  completedAt: v.optional(
    v.pipe(v.string(), v.isoDateTime('Некорректный формат даты завершения')),
  ),
});

export type StepRecord = v.InferOutput<typeof StepRecordSchema>;

/**
 * Тип уведомления о бездействии (маркер уведомлённости).
 * Отдельные kind-ы для студента и ментора дают независимые цепочки
 * периодичности «через день» и строку «уведомления были ранее отправлены».
 */
export const StudentNoticeKindSchema = v.picklist(
  ['inactivity_warn_student', 'inactivity_warn_mentor'],
  'Недопустимый тип уведомления',
);

export type StudentNoticeKind = v.InferOutput<typeof StudentNoticeKindSchema>;

/** Запись маркера уведомлённости: тип + дата последней отправки */
export const StudentNoticeRecordSchema = v.object({
  kind: StudentNoticeKindSchema,
  sentAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты уведомления'),
  ),
});

export type StudentNoticeRecord = v.InferOutput<
  typeof StudentNoticeRecordSchema
>;

/** Схема сущности записи студента на поток */
export const StudentSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID студента')),
  streamId: v.pipe(v.string(), v.uuid('Некорректный формат UUID потока')),
  userId: v.pipe(v.string(), v.uuid('Некорректный формат UUID пользователя')),
  enrolledAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты зачисления'),
  ),
  status: v.picklist(
    ['enrolled', 'active', 'abandoned', 'advanced', 'not_advanced'],
    'Недопустимый статус студента',
  ),
  abandonDetails: v.optional(AbandonDetailsSchema),
  completionDetails: v.optional(CompletionDetailsSchema),
  currentStepId: v.pipe(
    v.string(),
    v.uuid('Некорректный формат UUID текущего шага'),
  ),
  steps: v.array(StepRecordSchema),
  notices: v.optional(v.array(StudentNoticeRecordSchema)),
  createdAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты создания'),
  ),
  updatedAt: v.optional(
    v.pipe(v.string(), v.isoDateTime('Некорректный формат даты обновления')),
  ),
});

export type Student = v.InferOutput<typeof StudentSchema>;

export interface StudentArMeta extends ArMeta {
  name: 'Student';
  label: 'Студент потока';
  state: Student;
  events: StudentEnrolledEvent | StudentCompletedEvent | StudentAbandonedEvent;
}
