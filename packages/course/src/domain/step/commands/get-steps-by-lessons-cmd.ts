import * as v from 'valibot';
import type { StepArMeta } from '../entity';

/** Схема команды получения шагов по ID уроков */
export const GetStepsByLessonsCmdSchema = v.object({
  lessonIds: v.array(v.pipe(v.string(), v.uuid())),
});

/** Команда получения шагов по ID уроков */
export type GetStepsByLessonsCmd = v.InferOutput<
  typeof GetStepsByLessonsCmdSchema
>;

/** Тип результата: шаги, сгруппированные по уроку */
export type StepsByLesson = Record<
  string,
  Array<{ uuid: string; description: string }>
>;

/** Мета команды получения шагов по ID уроков */
export interface GetStepsByLessonsCmdMeta {
  ucName: 'get-steps-by-lessons';
  arMeta: StepArMeta;
  input: GetStepsByLessonsCmd;
  output: StepsByLesson;
  errors: never;
  requiresAuth: false;
  type: 'query';
}
