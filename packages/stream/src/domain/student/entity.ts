import type { ArMeta } from '@u7-scl/core/domain';
import * as v from 'valibot';

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
}
