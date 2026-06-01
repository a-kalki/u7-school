import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import type { StepRecord, StreamStudent, StreamStudentArMeta } from './entity';
import { StreamStudentSchema } from './entity';

/**
 * Агрегат StreamStudent — представляет запись студента на учебном потоке.
 * Управляет выдачей и завершением шагов для конкретного студента.
 */
export class StreamStudentAr extends Aggregate<StreamStudentArMeta> {
  static readonly arName = 'StreamStudent';
  static readonly arLabel = 'Студент потока';

  constructor(state: StreamStudent) {
    super(state, StreamStudentSchema);
  }

  /**
   * Фабричный метод для зачисления студента на поток.
   */
  static enroll(
    streamId: string,
    userId: string,
    currentStepId: string,
  ): StreamStudentAr {
    const candidate: StreamStudent = {
      uuid: crypto.randomUUID(),
      streamId,
      userId,
      enrolledAt: isoNow(),
      status: 'active',
      currentStepId,
      steps: [],
      createdAt: isoNow(),
    };

    return new StreamStudentAr(candidate);
  }

  /**
   * Выдать следующий шаг студенту.
   */
  issueStep(stepId: string): void {
    const exists = this._state.steps.some((s) => s.stepId === stepId);
    if (exists) {
      this.throwBadRequest(`Шаг с ID ${stepId} уже выдан этому студенту.`);
    }

    const record: StepRecord = {
      stepId,
      status: 'issued',
      issuedAt: isoNow(),
    };

    this._state.steps.push(record);
    this.safeUpdate({
      currentStepId: stepId,
    });
  }

  /**
   * Завершить шаг.
   */
  completeStep(stepId: string): void {
    const record = this._state.steps.find((s) => s.stepId === stepId);
    if (!record) {
      this.throwBadRequest(
        `Нельзя завершить шаг ${stepId}, так как он не был выдан студенту.`,
      );
    }

    record.status = 'completed';
    record.completedAt = isoNow();
    this.safeUpdate({});
  }

  /**
   * Пометить прохождение потока студентом как успешно завершённое.
   */
  complete(): void {
    this.safeUpdate({
      status: 'completed',
    });
  }
}
