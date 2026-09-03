import { errNotFound } from '@u7-scl/core/domain';
import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { StudentAr } from '#domain/student/a-root';
import {
  type DropStudentCmd,
  type DropStudentCmdMeta,
  DropStudentCmdSchema,
} from '#domain/student/commands/drop-student-cmd';
import type { Student } from '#domain/student/entity';
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

    // Событие ухода студента
    this.publishEvents(studentAr);

    // Снятие роли STUDENT
    await userFacade.removeRoleFromUser(
      studentEntity.userId,
      Role.STUDENT,
      actorId,
    );

    // Уведомление ментору (перенос из InactivityStory, сценарий #3)
    await this.#notifyMentorAboutDrop(studentEntity, actorId);

    return undefined;
  }

  /**
   * Уведомление ментору о самовыходе студента (текст FR-6 #3).
   * Поток недоступен — уведомление невозможно, молчаливый пропуск.
   */
  async #notifyMentorAboutDrop(
    student: Pick<Student, 'userId' | 'streamId'>,
    actorId: string,
  ): Promise<void> {
    const stream = await this.resolve.streamRepo.getByUuid(student.streamId);
    if (!stream) return;

    const user = await this.resolve.userFacade.getUserByUuid(student.userId);
    const studentName = user?.name ?? student.userId.slice(0, 8);

    await this.resolve.userFacade.notify(
      stream.mentorId,
      `🚪 Студент ${studentName} покинул учёбу с потока «${stream.title}» по собственному желанию.`,
      actorId,
    );
  }
}
