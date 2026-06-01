import { StudentSchema } from '#domain/student/entity';
import {
  type GetStudentByUserCmd,
  type GetStudentByUserCmdMeta,
  GetStudentByUserCmdSchema,
} from '#domain/student/commands/get-student-by-user-cmd';
import { errNotFound } from '@u7-scl/core/domain';
import type { StreamNotFoundUcError, StreamUcErrors } from '../errors';
import { StreamUseCase } from '../stream-uc';

export class GetStudentByUserUc extends StreamUseCase<GetStudentByUserCmdMeta> {
  protected readonly ucName = 'get-student-by-user' as const;
  protected readonly ucLabel = 'Найти активную запись студента' as const;
  protected readonly arMeta = {
    arName: 'Student' as const,
    arLabel: 'Студент потока' as const,
  };
  protected readonly type = 'query' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = GetStudentByUserCmdSchema;
  protected readonly outputSchema = StudentSchema;

  async execute(
    command: GetStudentByUserCmd,
  ): Promise<GetStudentByUserCmdMeta['output']> {
    const students = await this.resolve.streamStudentRepo.getByUser(
      command.userId,
    );

    const active = students.find((s) => s.status === 'active');

    if (!active) {
      this.throwError(
        errNotFound<StreamNotFoundUcError>(
          'STREAM_NOT_FOUND',
          'Активная запись студента не найдена',
          { userId: command.userId },
        ) as StreamUcErrors,
      );
    }

    return active;
  }
}
