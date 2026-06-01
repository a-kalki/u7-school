import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import { StreamDs } from '#domain/stream-ds';
import { StudentAr } from '#domain/student/a-root';
import {
  type CompleteStepCmd,
  type CompleteStepCmdMeta,
  CompleteStepCmdSchema,
} from '#domain/student/commands/complete-step-cmd';
import type { CompletionResult } from '#domain/types';
import { StreamUseCase } from '../stream-uc';

export class CompleteStepUc extends StreamUseCase<CompleteStepCmdMeta> {
  protected readonly ucName = 'complete-step' as const;
  protected readonly ucLabel = 'Завершить шаг' as const;
  protected readonly arMeta = {
    arName: 'Student' as const,
    arLabel: 'Студент потока' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CompleteStepCmdSchema;
  protected readonly outputSchema = v.variant('level', [
    v.object({
      level: v.literal('step'),
      currentStepId: v.string(),
    }),
    v.object({
      level: v.literal('lesson'),
      currentStepId: v.string(),
      completedLessonId: v.string(),
    }),
    v.object({
      level: v.literal('project'),
      currentStepId: v.string(),
      completedProjectId: v.string(),
    }),
    v.object({
      level: v.literal('stream'),
      completed: v.literal(true),
    }),
  ]);

  async execute(
    command: CompleteStepCmd,
    _actorId: string,
  ): Promise<CompletionResult> {
    const studentRepo = this.resolve.streamStudentRepo;

    // 1. Загрузка сущностей
    const streamEntity = await this.getStream(command.streamId);
    const studentEntity = await studentRepo.getByUuid(command.studentId);

    if (!studentEntity) {
      this.throwAccessDenied('Студент не найден');
    }

    const streamAr = new StreamAr(streamEntity);
    const studentAr = new StudentAr(studentEntity);

    // 2. Выполнение логики
    const result = StreamDs.completeStep(streamAr, studentAr, command.stepId);

    // 3. Сохранение
    await studentRepo.save(studentAr.state);

    return result;
  }
}
