import { errNotFound } from '@u7-scl/core/domain';
import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import type { Stream } from '#domain/stream/entity';
import { StudentAr } from '#domain/student/a-root';
import {
  type CompleteStudentCmd,
  type CompleteStudentCmdMeta,
  CompleteStudentCmdSchema,
} from '#domain/student/commands/complete-student-cmd';
import type { Student } from '#domain/student/entity';
import { StudentPolicy } from '#domain/student/policy';
import type { StreamNotFoundUcError, StreamUcErrors } from '../errors';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case завершения студента ментором (выбор исхода).
 * active → advanced|not_advanced|abandoned + −STUDENT.
 */
export class CompleteStudentUc extends StreamUseCase<CompleteStudentCmdMeta> {
  protected readonly ucName = 'complete-student' as const;
  protected readonly ucLabel = 'Завершить студента' as const;
  protected readonly arMeta = {
    arName: StudentAr.arName as 'Student',
    arLabel: StudentAr.arLabel as 'Студент потока',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CompleteStudentCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: CompleteStudentCmd,
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
      this.throwAccessDenied('Недостаточно прав для завершения студента');
    }

    const studentAr = new StudentAr(studentEntity);

    switch (command.outcome) {
      case 'advanced':
        studentAr.advance(streamEntity.moduleId);
        break;
      case 'not_advanced':
        studentAr.markNotAdvanced(streamEntity.moduleId);
        break;
      case 'abandoned':
        studentAr.markAbandoned('by_mentor');
        break;
    }

    await studentRepo.save(studentAr.state);

    // Снятие роли STUDENT
    await userFacade.removeRoleFromUser(
      studentEntity.userId,
      Role.STUDENT,
      actorId,
    );

    // Публикация доменного события (подписчики: сторя hub — уведомление)
    this.publishEvents(studentAr);

    // Уведомление студенту при advanced (сценарии #7c/7d, трек user-notify)
    if (command.outcome === 'advanced') {
      await this.#notifyCompletion(studentEntity, streamEntity, actorId);
    }

    return undefined;
  }

  /**
   * Уведомление студенту о завершении модуля (текст FR-6 #7c/#7d).
   * Последний модуль программы → поздравление с завершением курса;
   * есть следующий модуль → уведомление не шлётся (кнопка остаётся
   * в HubStory); место неизвестно → «🏁 Модуль завершён!».
   */
  async #notifyCompletion(
    student: Pick<Student, 'userId'>,
    stream: Pick<Stream, 'moduleId'>,
    actorId: string,
  ): Promise<void> {
    const place = await this.resolve.courseFacade.getModulePlace(
      stream.moduleId,
    );

    if (place?.nextModuleId) return; // кнопочная ветка 7a — в HubStory

    const text = place?.isLast
      ? '🎉 Курс завершён! Поздравляем — ты прошёл всю программу.'
      : '🏁 Модуль завершён!';
    await this.resolve.userFacade.notify(student.userId, text, 'info', actorId);
  }
}
