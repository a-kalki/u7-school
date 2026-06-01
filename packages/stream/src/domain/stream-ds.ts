import type { StreamAr } from './stream/a-root';
import { StreamStudentAr } from './stream-student/a-root';
import type { CompletionResult } from './types';

export class StreamDs {
  static completeStep(
    stream: StreamAr,
    student: StreamStudentAr,
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
  }
}
