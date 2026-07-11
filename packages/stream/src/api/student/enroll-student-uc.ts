import { CourseAr } from '@u7-scl/course/domain';
import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import { StudentAr } from '#domain/student/a-root';
import {
  type EnrollStudentCmd,
  type EnrollStudentCmdMeta,
  EnrollStudentCmdSchema,
} from '#domain/student/commands/enroll-student-cmd';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case зачисления студента на поток.
 *
 * Оркестрирует получение данных и делегирует доменную логику
 * (проверку enrollmentKey, конфликта активных записей и gate)
 * в StreamAr.enroll().
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
    const courseFacade = this.resolve.courseFacade;

    // 1. Получение данных для доменной операции
    const streamEntity = await this.getStream(command.streamId);
    const existingStudents = await studentRepo.getByUser(command.userId);

    // Получаем потоки для записей студента (сопоставление streamId → moduleId)
    const studentStreams = (
      await Promise.all(
        existingStudents.map((r) =>
          this.resolve.streamRepo.getByUuid(r.streamId),
        ),
      )
    ).filter((s): s is NonNullable<typeof s> => s !== undefined);

    // Курс для gate-проверки
    const course = await courseFacade.getCourseByModuleId(
      streamEntity.moduleId,
    );

    // Название предыдущего модуля для сообщения об ошибке gate
    let prevModuleTitle: string | undefined;
    if (course) {
      const prevModuleId = new CourseAr(course).getPrevModuleId(
        streamEntity.moduleId,
      );
      if (prevModuleId) {
        try {
          const prevModule = await courseFacade.getModule(prevModuleId);
          prevModuleTitle = prevModule.title;
        } catch {
          prevModuleTitle = prevModuleId;
        }
      }
    }

    // 2. Доменная операция: проверка правил зачисления
    const streamAr = new StreamAr(streamEntity);
    const { firstStepId } = streamAr.enroll({
      enrollmentKey: command.enrollmentKey,
      course,
      existingStudents,
      studentStreams,
      prevModuleTitle,
    });

    // 3. Создание записи студента
    const studentAr = StudentAr.enroll(
      streamEntity.uuid,
      command.userId,
      firstStepId,
    );

    // 4. Сохранение
    await studentRepo.save(studentAr.state);

    // 5. Выдача роли STUDENT
    await userFacade.addRoleToUser(command.userId, Role.STUDENT, actorId);

    // 6. Снятие роли CANDIDATE
    await userFacade.removeRoleFromUser(
      command.userId,
      Role.CANDIDATE,
      actorId,
    );

    return undefined;
  }
}
