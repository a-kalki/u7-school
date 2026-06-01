import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import { StreamPolicy } from '#domain/stream/policy';
import { StreamStudentAr } from '#domain/stream-student/a-root';
import {
  type EnrollStudentCmd,
  type EnrollStudentCmdMeta,
  EnrollStudentCmdSchema,
} from '#domain/stream-student/commands/enroll-student-cmd';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case зачисления студента на поток.
 */
export class EnrollStudentUc extends StreamUseCase<EnrollStudentCmdMeta> {
  protected readonly ucName = 'enroll-student' as const;
  protected readonly ucLabel = 'Зачислить студента' as const;
  protected readonly arMeta = {
    arName: StreamStudentAr.arName as 'StreamStudent',
    arLabel: StreamStudentAr.arLabel as 'Студент потока',
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

    const streamEntity = await this.getStream(command.streamId);
    const streamAr = new StreamAr(streamEntity);
    const firstStepId = streamAr.getFirstStepId();

    if (!firstStepId) {
      this.throwAccessDenied('В потоке нет доступных шагов');
    }

    // 2. Создание записи студента
    const studentAr = StreamStudentAr.enroll(
      command.streamId,
      command.userId,
      firstStepId,
    );
    await studentRepo.save(studentAr.state);

    // 3. Обновление роли пользователя
    await userFacade.updateUserRole(command.userId, Role.STUDENT, actorId);
    return undefined;
  }
}
