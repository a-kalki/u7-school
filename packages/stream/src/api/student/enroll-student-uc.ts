import { errConflict } from '@u7-scl/core/domain';
import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import { StreamPolicy } from '#domain/stream/policy';
import { StudentAr } from '#domain/student/a-root';
import {
  type EnrollStudentCmd,
  type EnrollStudentCmdMeta,
  EnrollStudentCmdSchema,
} from '#domain/student/commands/enroll-student-cmd';
import type { StreamConflictUcError, StreamUcErrors } from '../errors';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case зачисления студента на поток.
 */
export class EnrollStudentUc extends StreamUseCase<EnrollStudentCmdMeta> {
  protected readonly ucName = 'enroll-student' as const;
  protected readonly ucLabel = 'Зачислить студента' as const;
  protected readonly arMeta = {
    arName: StudentAr.arName as 'Student',
    arLabel: StudentAr.arLabel as 'Студент потока',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = EnrollStudentCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: EnrollStudentCmd,
    actorId: string,
  ): Promise<undefined> {
    const studentRepo = this.resolve.streamStudentRepo;
    const userFacade = this.resolve.userFacade;

    const actor = await this.getActor(actorId);

    // 1. Проверка, не учится ли уже (политика)
    if (!StreamPolicy.canEnroll(actor)) {
      this.throwAccessDenied('Вы не можете записаться на этот поток');
    }

    // 1.5 Проверка, нет ли уже активной записи в другом потоке
    const activeRecords = await studentRepo.getByUser(command.userId);
    const hasActive = activeRecords.some((r) => r.status === 'active');
    if (hasActive) {
      this.throwError(
        errConflict<StreamConflictUcError>(
          'STREAM_CONFLICT',
          'Вы уже проходите обучение в другом потоке',
          { userId: command.userId },
        ) as StreamUcErrors,
      );
    }

    const streamEntity = await this.getStream(command.streamId);

    // Проверка кодового слова (если задано у потока)
    if (streamEntity.enrollmentKey) {
      if (streamEntity.enrollmentKey !== command.enrollmentKey) {
        this.throwAccessDenied('Неверное кодовое слово');
      }
    }

    const streamAr = new StreamAr(streamEntity);
    const firstStepId = streamAr.getFirstStepId();

    if (!firstStepId) {
      this.throwAccessDenied('В потоке нет доступных шагов');
    }

    // 2. Создание записи студента
    const studentAr = StudentAr.enroll(
      command.streamId,
      command.userId,
      firstStepId,
    );
    await studentRepo.save(studentAr.state);

    // 3. Обновление роли пользователя
    await userFacade.updateUserRole(command.userId, Role.STUDENT, actorId);

    // 4. Снятие роли CANDIDATE, если была
    const user = await userFacade.getUserByUuid(command.userId);
    if (user?.roles.includes(Role.CANDIDATE)) {
      await userFacade.removeRoleFromUser(command.userId, Role.CANDIDATE);
    }

    return undefined;
  }
}
