import * as v from 'valibot';

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
export const StreamStudentSchema = v.object({
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

export type StreamStudent = v.InferOutput<typeof StreamStudentSchema>;

export interface StreamStudentArMeta {
  name: 'StreamStudent';
  label: 'Студент потока';
  state: StreamStudent;
}
