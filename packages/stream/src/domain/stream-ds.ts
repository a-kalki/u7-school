import type { StreamAr } from './stream/a-root';
import type { StudentAr } from './student/a-root';
import type { CompletionResult } from './types';

export const StreamDs = {
  /**
   * Завершить шаг и выдать следующий.
   * Если шаг последний в потоке — завершить прохождение студента.
   */
  completeStep(
    stream: StreamAr,
    student: StudentAr,
    stepId: string,
  ): CompletionResult {
    student.completeStep(stepId);

    const nextStepId = stream.findNextStep(stepId);

    if (nextStepId) {
      student.issueStep(nextStepId);
      return { level: 'step', currentStepId: nextStepId };
    }

    student.complete();
    return { level: 'stream', completed: true };
  },
};
