import * as v from 'valibot';
import { StreamUseCase } from '../stream-uc';

export const GetStudentProgressCmdSchema = v.object({
  studentId: v.pipe(v.string(), v.uuid('Некорректный UUID студента')),
});

export type GetStudentProgressCmd = v.InferOutput<
  typeof GetStudentProgressCmdSchema
>;

export interface GetStudentProgressCmdMeta {
  name: 'get-student-progress';
  label: 'Получить прогресс студента';
  input: GetStudentProgressCmd;
}

export class GetStudentProgressUc extends StreamUseCase<GetStudentProgressCmdMeta> {
  protected readonly ucName = 'get-student-progress' as const;
  protected readonly ucLabel = 'Получить прогресс студента' as const;
  protected readonly arMeta = {
    arName: 'StreamStudent',
    arLabel: 'Студент потока',
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = GetStudentProgressCmdSchema;
  protected readonly outputSchema = v.any();

  async execute(
    command: GetStudentProgressCmd,
    _actorId: string,
  ): Promise<any> {
    const student = await this.resolve.streamStudentRepo.getByUuid(
      command.studentId,
    );
    if (!student) {
      this.throwAccessDenied('Студент не найден');
    }
    return student;
  }
}
