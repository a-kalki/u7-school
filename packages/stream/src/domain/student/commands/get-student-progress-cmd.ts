import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { StreamUcErrors } from '../../../api/errors';
import type { Student, StudentArMeta } from '../entity';

export const GetStudentProgressCmdSchema = v.object({
  studentId: v.pipe(v.string(), v.uuid('Некорректный UUID студента')),
});

export type GetStudentProgressCmd = v.InferOutput<
  typeof GetStudentProgressCmdSchema
>;

export interface GetStudentProgressCmdMeta extends UcMeta {
  ucName: 'get-student-progress';
  arMeta: StudentArMeta;
  input: GetStudentProgressCmd;
  output: Student;
  errors: StreamUcErrors;
  requiresAuth: true;
  type: 'query';
}
