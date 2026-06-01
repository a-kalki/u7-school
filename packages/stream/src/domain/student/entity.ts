import * as v from 'valibot';
import type { ArMeta } from '@u7-scl/core/domain';

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
    ['active', 'completed', 'dropped'],
    'Недопустимый статус студента',
  ),
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
