import { errNotFound } from '@u7-scl/core/domain';
import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { StudentAr } from '#domain/student/a-root';
import {
  type CompleteStudentCmd,
  type CompleteStudentCmdMeta,
  CompleteStudentCmdSchema,
} from '#domain/student/commands/complete-student-cmd';
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
    if (!StudentPolicy.canExpel(actor, streamEntity)) {
      this.throwAccessDenied('Недостаточно прав для завершения студента');
    }

    const studentAr = new StudentAr(studentEntity);

    switch (command.outcome) {
      case 'advanced':
        studentAr.advance();
        break;
      case 'not_advanced':
        studentAr.markNotAdvanced();
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

    // Сообщение через TgFacade (только для advanced и not_advanced)
    if (command.outcome !== 'abandoned') {
      const tgFacade = this.resolve.tgFacade;
      const user = await userFacade.getUserByUuid(studentEntity.userId);
      if (user?.telegramId) {
        const message =
          command.outcome === 'advanced'
            ? 'Ты завершил модуль. Хочешь записаться на следующий?'
            : 'Ты завершил модуль, но не набрал проходной балл. Хочешь перезаписаться на этот же модуль?';
        await tgFacade.sendMessage(user.telegramId, message);
      }
    }

    return undefined;
  }
}
