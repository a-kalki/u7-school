import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { StudentAr } from '#domain/student/a-root';
import {
  type ExpelStudentCmd,
  type ExpelStudentCmdMeta,
  ExpelStudentCmdSchema,
} from '#domain/student/commands/expel-student-cmd';
import { StudentPolicy } from '#domain/student/policy';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case отчисления студента с потока.
 */
export class ExpelStudentUc extends StreamUseCase<ExpelStudentCmdMeta> {
  protected readonly ucName = 'expel-student' as const;
  protected readonly ucLabel = 'Отчислить студента' as const;
  protected readonly arMeta = {
    arName: StudentAr.arName as 'Student',
    arLabel: StudentAr.arLabel as 'Студент потока',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = ExpelStudentCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: ExpelStudentCmd,
    actorId: string,
  ): Promise<undefined> {
    const studentRepo = this.resolve.streamStudentRepo;
    const userFacade = this.resolve.userFacade;

    const actor = await this.getActor(actorId);

    // 1. Получаем запись студента
    const studentEntity = await studentRepo.getByUuid(command.studentId);
    if (!studentEntity) {
      this.throwNotFound('Студент не найден');
    }

    // 2. Получаем поток для проверки прав ментора
    const streamEntity = await this.resolve.streamRepo.getByUuid(
      command.streamId,
    );
    if (!streamEntity) {
      this.throwNotFound('Поток не найден');
    }

    // 3. Проверка прав: ментор потока или админ
    if (!StudentPolicy.canExpel(actor, streamEntity)) {
      this.throwAccessDenied('Недостаточно прав для отчисления студента');
    }

    // 4. Отчисление
    const studentAr = new StudentAr(studentEntity);
    studentAr.expel();
    await studentRepo.save(studentAr.state);

    // 5. Снятие роли STUDENT
    await userFacade.removeRoleFromUser(studentEntity.userId, Role.STUDENT);

    return undefined;
  }
}
