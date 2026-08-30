import { errNotFound } from '@u7-scl/core/domain';
import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { StudentAr } from '#domain/student/a-root';
import {
  type DropStudentCmd,
  type DropStudentCmdMeta,
  DropStudentCmdSchema,
} from '#domain/student/commands/drop-student-cmd';
import type { StreamNotFoundUcError, StreamUcErrors } from '../errors';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case самостоятельного выхода студента из учёбы («Покинуть учёбу»).
 * active/enrolled → abandoned (who=self, cause=voluntary) + −STUDENT
 * + событие student.abandoned (кик из TG-группы, уведомление ментору).
 */
export class DropStudentUc extends StreamUseCase<DropStudentCmdMeta> {
  protected readonly ucName = 'drop-student' as const;
  protected readonly ucLabel = 'Покинуть учёбу' as const;
  protected readonly arMeta = {
    arName: StudentAr.arName as 'Student',
    arLabel: StudentAr.arLabel as 'Студент потока',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = DropStudentCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(command: DropStudentCmd, actorId: string): Promise<undefined> {
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

    // Только сам студент может выйти
    if (actorId !== studentEntity.userId) {
      this.throwAccessDenied('Вы не можете выйти из чужого потока');
    }

    const studentAr = new StudentAr(studentEntity);
    studentAr.drop();
    await studentRepo.save(studentAr.state);

    // Событие ухода студента (подписчики: ER кика из TG-группы, стори уведомлений)
    this.publishEvents(studentAr);

    // Снятие роли STUDENT
    await userFacade.removeRoleFromUser(
      studentEntity.userId,
      Role.STUDENT,
      actorId,
    );

    return undefined;
  }
}
