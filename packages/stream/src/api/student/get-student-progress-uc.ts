import { StudentAr } from '#domain/student/a-root';
import {
  type GetStudentProgressCmd,
  type GetStudentProgressCmdMeta,
  GetStudentProgressCmdSchema,
} from '#domain/student/commands/get-student-progress-cmd';
import type { Student } from '#domain/student/entity';
import { StudentSchema } from '#domain/student/entity';
import { StreamUseCase } from '../stream-uc';

export class GetStudentProgressUc extends StreamUseCase<GetStudentProgressCmdMeta> {
  protected readonly ucName = 'get-student-progress' as const;
  protected readonly ucLabel = 'Получить прогресс студента' as const;
  protected readonly arMeta = {
    arName: StudentAr.arName as 'Student',
    arLabel: StudentAr.arLabel as 'Студент потока',
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = GetStudentProgressCmdSchema;
  protected readonly outputSchema = StudentSchema;

  async execute(
    command: GetStudentProgressCmd,
    _actorId: string,
  ): Promise<Student> {
    const student = await this.resolve.streamStudentRepo.getByUuid(
      command.studentId,
    );
    if (!student) {
      this.throwAccessDenied('Студент не найден');
    }

    // Публичная информация — любой может видеть прогресс студента
    return student;
  }
}
