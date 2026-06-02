import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import {
  type ActivateStreamCmd,
  type ActivateStreamCmdMeta,
  ActivateStreamCmdSchema,
} from '#domain/stream/commands/activate-stream-cmd';
import { StreamPolicy } from '#domain/stream/policy';
import { StudentAr } from '#domain/student/a-root';
import { StreamUseCase } from '../stream-uc';

export class ActivateStreamUc extends StreamUseCase<ActivateStreamCmdMeta> {
  protected readonly ucName = 'activate-stream' as const;
  protected readonly ucLabel = 'Активировать поток' as const;
  protected readonly arMeta = {
    arName: 'Stream' as const,
    arLabel: 'Поток' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = ActivateStreamCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: ActivateStreamCmd,
    actorId: string,
  ): Promise<undefined> {
    const streamEntity = await this.getStream(command.streamId);
    const streamAr = new StreamAr(streamEntity);

    // Проверка прав: ментор потока или админ
    const actor = await this.getActor(actorId);
    if (!StreamPolicy.canEdit(actor, streamEntity)) {
      this.throwAccessDenied();
    }

    // 1. Активировать поток
    streamAr.activate();
    await this.resolve.streamRepo.save(streamAr.state);

    // 2. Найти первый шаг
    const firstStepId = streamAr.getFirstStepId();
    if (!firstStepId) return;

    // 3. Загрузить студентов потока
    const studentRepo = this.resolve.streamStudentRepo;
    const students = await studentRepo.getByStream(command.streamId);

    // 4. Выдать первый шаг студентам без выданных шагов
    for (const entity of students) {
      // Пропускаем студентов, у которых уже есть выданные шаги
      if (entity.steps.length > 0) continue;

      const studentAr = new StudentAr(entity);
      studentAr.issueStep(firstStepId);
      await studentRepo.save(studentAr.state);
    }
    return undefined;
  }
}
