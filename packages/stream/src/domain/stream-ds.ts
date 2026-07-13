import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { StreamAr } from './stream/a-root';
import type { StudentAr } from './student/a-root';
import type { StepRecord } from './student/entity';
import type {
  CompletionResult,
  LessonNode,
  LessonStepsView,
  NavigationTree,
  NodeStatus,
  Progress,
  ProjectNode,
  StepNode,
} from './types';

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
      // Все шаги пройдены — поток завершён для этого студента.
      // Статус изменит ментор через CompleteStudentUc.
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

  /**
   * Прогресс студента: сколько шагов завершено из общего числа.
   * Используется progress.story и monitor.story.
   */
  computeProgress(
    snapshot: ContentSnapshot,
    student: { steps: StepRecord[] },
  ): Progress {
    const total = snapshot.reduce(
      (sum, p) => sum + p.lessons.reduce((s, l) => s + l.stepIds.length, 0),
      0,
    );
    const completed = student.steps.filter(
      (s) => s.status === 'completed',
    ).length;
    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },

  /**
   * Дерево навигации: проекты → уроки с прогрессом.
   * Показывает все проекты/уроки/шаги программы. Узлы имеют статус completed/current/locked.
   * Используется learning.story (#showProjects, #showLessons).
   */
  buildNavigationTree(
    snapshot: ContentSnapshot,
    student: { steps: StepRecord[] },
  ): NavigationTree {
    const stepStatusMap = new Map<string, 'completed' | 'issued'>();
    for (const sr of student.steps) {
      if (sr.status === 'completed' || sr.status === 'issued') {
        stepStatusMap.set(sr.stepId, sr.status);
      }
    }

    const projects: ProjectNode[] = [];

    for (const p of snapshot) {
      const lessons: LessonNode[] = [];
      let completedLessons = 0;
      let hasCurrent = false;

      for (const l of p.lessons) {
        const steps: StepNode[] = l.stepIds.map((sid) => {
          const s = stepStatusMap.get(sid);
          if (s === 'completed') return { stepId: sid, status: 'completed' };
          if (s === 'issued') return { stepId: sid, status: 'current' };
          return { stepId: sid, status: 'locked' };
        });

        const completedSteps = steps.filter(
          (s) => s.status === 'completed',
        ).length;
        const hasCurrentStep = steps.some((s) => s.status === 'current');
        const allCompleted = steps.every((s) => s.status === 'completed');

        if (completedSteps > 0) completedLessons++;
        if (hasCurrentStep) hasCurrent = true;

        const lessonStatus: NodeStatus = allCompleted
          ? 'completed'
          : hasCurrentStep
            ? 'current'
            : 'locked';

        lessons.push({
          lessonId: l.lessonId,
          title: l.lessonTitle,
          status: lessonStatus,
          completedSteps,
          totalSteps: l.stepIds.length,
          steps,
        });
      }

      const projectStatus: NodeStatus =
        completedLessons === p.lessons.length && !hasCurrent
          ? 'completed'
          : hasCurrent
            ? 'current'
            : 'locked';

      projects.push({
        title: p.projectTitle,
        status: projectStatus,
        completedLessons,
        totalLessons: p.lessons.length,
        lessons,
      });
    }

    return { projects };
  },

  /**
   * Шаги конкретного урока с заголовками и статусами.
   * Используется learning.story (#showSteps, #showStepView).
   */
  buildLessonSteps(
    snapshot: ContentSnapshot,
    lessonId: string,
    student: {
      steps: StepRecord[];
      currentStepId: string;
    },
  ): LessonStepsView | null {
    const statusMap = new Map<string, 'completed' | 'issued'>();
    for (const sr of student.steps) {
      if (sr.status === 'completed' || sr.status === 'issued') {
        statusMap.set(sr.stepId, sr.status);
      }
    }

    for (let pi = 0; pi < snapshot.length; pi++) {
      const project = snapshot[pi];
      if (!project) continue;

      for (let li = 0; li < project.lessons.length; li++) {
        const lesson = project.lessons[li];
        if (!lesson || lesson.lessonId !== lessonId) continue;

        const steps: StepNode[] = lesson.stepIds.map((stepId) => {
          const status = statusMap.get(stepId);
          if (status === 'completed') return { stepId, status: 'completed' };
          if (status === 'issued') return { stepId, status: 'current' };
          return { stepId, status: 'locked' };
        });

        return {
          lessonTitle: lesson.lessonTitle,
          lessonIndex: li + 1,
          projectTitle: project.projectTitle,
          projectIndex: pi + 1,
          steps,
        };
      }
    }

    return null;
  },
};
