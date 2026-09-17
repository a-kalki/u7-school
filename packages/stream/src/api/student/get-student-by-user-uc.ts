import { errNotFound } from '@u7-scl/core/domain';
import { StudentAr } from '#domain/student/a-root';
import {
  type GetStudentByUserCmd,
  type GetStudentByUserCmdMeta,
  GetStudentByUserCmdSchema,
} from '#domain/student/commands/get-student-by-user-cmd';
import { StudentSchema } from '#domain/student/entity';
import type { StreamNotFoundUcError, StreamUcErrors } from '../errors';
import { StreamUseCase } from '../stream-uc';

export class GetStudentByUserUc extends StreamUseCase<GetStudentByUserCmdMeta> {
  protected readonly ucName = 'get-student-by-user' as const;
  protected readonly ucLabel = 'Найти запись студента' as const;
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

    // Сначала ищем живую запись (учится/зачислен) — признак StudentAr (ФР-10)
    const active = students.find((s) => new StudentAr(s).isInProgress());
    if (active) return active;

    // Если живой нет — любую терминальную (судьба разрешена)
    const record = students.find((s) => new StudentAr(s).isTerminal());

    if (!record) {
      this.throwError(
        errNotFound<StreamNotFoundUcError>(
          'STREAM_NOT_FOUND',
          'Активная запись студента не найдена',
          { uuid: command.userId },
        ) as StreamUcErrors,
      );
    }

    return record;
  }
}
