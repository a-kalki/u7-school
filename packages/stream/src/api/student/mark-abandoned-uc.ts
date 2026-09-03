import { errNotFound } from '@u7-scl/core/domain';
import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { StudentAr } from '#domain/student/a-root';
import {
  type MarkAbandonedCmd,
  type MarkAbandonedCmdMeta,
  MarkAbandonedCmdSchema,
} from '#domain/student/commands/mark-abandoned-cmd';
import type { Student } from '#domain/student/entity';
import { StudentPolicy } from '#domain/student/policy';
import type { StreamNotFoundUcError, StreamUcErrors } from '../errors';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case снятия студента с учёбы ментором.
 * active/enrolled → abandoned (who=mentor, cause=inactivity|by_mentor) + −STUDENT
 * + событие student.abandoned (кик из TG-группы, уведомления).
 * Терминология продукта: «Снять с учёбы» (не «отчислить»).
 */
export class MarkAbandonedUc extends StreamUseCase<MarkAbandonedCmdMeta> {
  protected readonly ucName = 'mark-abandoned' as const;
  protected readonly ucLabel = 'Снять студента с учёбы' as const;
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
    if (!StudentPolicy.canManageStudent(actor, streamEntity)) {
      this.throwAccessDenied('Недостаточно прав для снятия студента с учёбы');
    }

    const studentAr = new StudentAr(studentEntity);
    studentAr.markAbandoned(command.cause);
    await studentRepo.save(studentAr.state);

    // Событие ухода студента (подписчики: ER кика из TG-группы, стори уведомлений)
    this.publishEvents(studentAr);

    // Снятие роли STUDENT
    await userFacade.removeRoleFromUser(
      studentEntity.userId,
      Role.STUDENT,
      actorId,
    );

    // Уведомление студенту (перенос из InactivityStory, сценарий #4)
    await this.#notifyStudentAboutAbandon(studentEntity, actorId);

    return undefined;
  }

  /**
   * Уведомление студенту о снятии ментором (текст FR-6 #4).
   * Поток недоступен — уведомление невозможно, молчаливый пропуск.
   */
  async #notifyStudentAboutAbandon(
    student: Pick<Student, 'userId' | 'streamId'>,
    actorId: string,
  ): Promise<void> {
    const stream = await this.resolve.streamRepo.getByUuid(student.streamId);
    if (!stream) return;

    await this.resolve.userFacade.notify(
      student.userId,
      `Ты снят с учёбы с потока «${stream.title}» за бездействие и исключён из его группы. Прогресс сохранён — если захочешь вернуться, напиши ментору потока.`,
      actorId,
    );
  }
}
