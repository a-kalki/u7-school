import { errNotFound } from '@u7-scl/core/domain';
import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { StudentAr } from '#domain/student/a-root';
import {
  type MarkAbandonedCmd,
  type MarkAbandonedCmdMeta,
  MarkAbandonedCmdSchema,
} from '#domain/student/commands/mark-abandoned-cmd';
import { StudentPolicy } from '#domain/student/policy';
import type { StreamNotFoundUcError, StreamUcErrors } from '../errors';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case отчисления студента ментором.
 * active → abandoned (who=mentor, cause=inactivity|by_mentor) + −STUDENT.
 * Заменяет прежний expel-student.
 */
export class MarkAbandonedUc extends StreamUseCase<MarkAbandonedCmdMeta> {
  protected readonly ucName = 'mark-abandoned' as const;
  protected readonly ucLabel = 'Отчислить студента' as const;
  protected readonly arMeta = {
    arName: StudentAr.arName as 'Student',
    arLabel: StudentAr.arLabel as 'Студент потока',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = MarkAbandonedCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: MarkAbandonedCmd,
    actorId: string,
  ): Promise<undefined> {
    const studentRepo = this.resolve.streamStudentRepo;
    const userFacade = this.resolve.userFacade;

    const studentEntity = await studentRepo.getByUuid(command.studentId);
    if (!studentEntity) {
      this.throwError(
        errNotFound<StreamNotFoundUcError>(
          'STREAM_NOT_FOUND',
          'Студент не найден',
          { uuid: command.studentId },
        ) as StreamUcErrors,
      );
    }

    // Проверка прав: ментор потока или админ
    const streamEntity = await this.getStream(command.streamId);
    const actor = await this.getActor(actorId);
    if (!StudentPolicy.canExpel(actor, streamEntity)) {
      this.throwAccessDenied('Недостаточно прав для отчисления студента');
    }

    const studentAr = new StudentAr(studentEntity);
    studentAr.markAbandoned(command.cause);
    await studentRepo.save(studentAr.state);

    // Снятие роли STUDENT
    await userFacade.removeRoleFromUser(
      studentEntity.userId,
      Role.STUDENT,
      actorId,
    );

    return undefined;
  }
}
