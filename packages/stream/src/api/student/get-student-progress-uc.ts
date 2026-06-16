import type { User } from '@u7-scl/user/domain';
import { StreamPolicy } from '#domain/index';
import { StudentAr } from '#domain/student/a-root';
import {
  type GetStudentProgressCmd,
  type GetStudentProgressCmdMeta,
  GetStudentProgressCmdSchema,
} from '#domain/student/commands/get-student-progress-cmd';
import type { Student } from '#domain/student/entity';
import { StudentSchema } from '#domain/student/entity';
import { StudentPolicy } from '#domain/student/policy';
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
    actorId: string,
  ): Promise<Student> {
    const student = await this.resolve.streamStudentRepo.getByUuid(
      command.studentId,
    );
    if (!student) {
      this.throwAccessDenied('Студент не найден');
    }

    // Проверка прав: сам студент, ментор потока или админ
    const actor = await this.getActor(actorId);
    const canView =
      StudentPolicy.canViewProgress(actor, student) ||
      (await this.isStreamMentor(student.streamId, actor));

    if (!canView) {
      this.throwAccessDenied();
    }

    return student;
  }

  /** Проверяет, является ли актор ментором потока */
  private async isStreamMentor(
    streamId: string,
    actor: User,
  ): Promise<boolean> {
    const stream = await this.resolve.streamRepo.getByUuid(streamId);
    if (!stream) return false;
    return StreamPolicy.isMentor(actor, stream);
  }
}
