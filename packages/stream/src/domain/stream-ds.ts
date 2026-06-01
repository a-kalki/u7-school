import type { StreamAr } from './stream/a-root';
import type { StudentAr } from './student/a-root';
import type { CompletionResult } from './types';

export const StreamDs = {
  /**
   * Завершить шаг и выдать следующий.
   * Определяет уровень перехода: step / lesson / project / stream.
   */
  completeStep(
    stream: StreamAr,
    student: StudentAr,
    stepId: string,
  ): CompletionResult {
    student.completeStep(stepId);

    const nextStepId = stream.findNextStep(stepId);

    if (!nextStepId) {
      student.complete();
      return { level: 'stream', completed: true };
    }

    const ctx = stream.findStepContext(stepId);
    student.issueStep(nextStepId);

    // Последний шаг урока + последний урок проекта → переход проекта
    if (ctx.isLastStepInLesson && ctx.isLastLessonInProject) {
      return {
        level: 'project',
        currentStepId: nextStepId,
        completedProjectId: ctx.projectId,
      };
    }

    // Последний шаг урока (но не последний урок проекта) → переход урока
    if (ctx.isLastStepInLesson) {
      return {
        level: 'lesson',
        currentStepId: nextStepId,
        completedLessonId: ctx.lessonId,
      };
    }

    // Обычный шаг
    return { level: 'step', currentStepId: nextStepId };
  },
};
