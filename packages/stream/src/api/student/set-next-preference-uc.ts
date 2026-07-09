import { errNotFound } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { StudentAr } from '#domain/student/a-root';
import {
  type SetNextPreferenceCmd,
  type SetNextPreferenceCmdMeta,
  SetNextPreferenceCmdSchema,
} from '#domain/student/commands/set-next-preference-cmd';
import type { StreamNotFoundUcError, StreamUcErrors } from '../errors';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case выбора студентом предпочтения (хочет дальше / повторить).
 * Только для advanced и not_advanced студентов.
 */
export class SetNextPreferenceUc extends StreamUseCase<SetNextPreferenceCmdMeta> {
  protected readonly ucName = 'set-next-preference' as const;
  protected readonly ucLabel = 'Выбрать предпочтение' as const;
  protected readonly arMeta = {
    arName: StudentAr.arName as 'Student',
    arLabel: StudentAr.arLabel as 'Студент потока',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = SetNextPreferenceCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: SetNextPreferenceCmd,
    actorId: string,
  ): Promise<undefined> {
    const studentRepo = this.resolve.streamStudentRepo;

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

    // Только сам студент может менять предпочтение
    if (actorId !== studentEntity.userId) {
      this.throwAccessDenied(
        'Вы не можете менять предпочтения другого студента',
      );
    }

    const studentAr = new StudentAr(studentEntity);
    studentAr.setNextPreference(command.preference);
    await studentRepo.save(studentAr.state);

    return undefined;
  }
}
