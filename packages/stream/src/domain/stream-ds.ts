import type { ContentSnapshot, StepPosition } from '@u7-scl/course/domain';
import { CourseDs } from '@u7-scl/course/domain';
import type { StreamAr } from './stream/a-root';
import type { StudentAr } from './student/a-root';
import type { StepRecord, Student } from './student/entity';
import type {
  CategorizedStudent,
  CompletionResult,
  LagLevel,
  LessonNode,
  LessonStepsView,
  NavigationTree,
  NodeStatus,
  Progress,
  ProjectNode,
  StepNode,
  StepTimeStats,
  StudentCardData,
  StudentRowSummary,
  TimeCategory,
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
   *
   * ВАЖНО: snapshot может быть как полным снимком потока, так и ЧАСТИЧНЫМ
   * (например, один проект `[projectItem]` для прогресса по проекту).
   * Поэтому completed фильтруется строго по stepId, присутствующим в snapshot,
   * чтобы исключить шаги из других частей программы.
   *
   * Используется progress.story, learning.story, monitor.story.
   */
  computeProgress(
    snapshot: ContentSnapshot,
    student: { steps: Array<{ stepId: string; status: string }> },
  ): Progress {
    const total = snapshot.reduce(
      (sum, p) => sum + p.lessons.reduce((s, l) => s + l.stepIds.length, 0),
      0,
    );
    // Собираем ID шагов, которые реально есть в переданном снимке
    // (снимок может быть частичным — например, один проект)
    const stepIdsInSnapshot = new Set(
      snapshot.flatMap((p) => p.lessons.flatMap((l) => l.stepIds)),
    );
    const completed = student.steps.filter(
      (s) => s.status === 'completed' && stepIdsInSnapshot.has(s.stepId),
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
    student: { steps: Array<{ stepId: string; status: string }> },
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
        const steps: StepNode[] = l.stepIds.map((sid, idx) => {
          const s = stepStatusMap.get(sid);
          if (s === 'completed')
            return { stepId: sid, status: 'completed', index: idx + 1 };
          if (s === 'issued')
            return { stepId: sid, status: 'current', index: idx + 1 };
          return { stepId: sid, status: 'locked', index: idx + 1 };
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

        const steps: StepNode[] = lesson.stepIds.map((stepId, idx) => {
          const status = statusMap.get(stepId);
          if (status === 'completed')
            return { stepId, status: 'completed', index: idx + 1 };
          if (status === 'issued')
            return { stepId, status: 'current', index: idx + 1 };
          return { stepId, status: 'locked', index: idx + 1 };
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

  /**
   * Прогресс проекта: сколько уроков полностью завершены.
   * Урок считается завершённым, когда ВСЕ его шаги выполнены.
   */
  computeProjectLevelProgress(
    snapshot: ContentSnapshot,
    projectIndex: number,
    student: { steps: Array<{ stepId: string; status: string }> },
  ): Progress {
    const completedStepIds = new Set(
      student.steps
        .filter((s) => s.status === 'completed')
        .map((s) => s.stepId),
    );

    const project = snapshot[projectIndex];
    if (!project) return { completed: 0, total: 0, percent: 0 };

    const total = project.lessons.length;
    const completed = project.lessons.filter((l) =>
      l.stepIds.every((sid) => completedStepIds.has(sid)),
    ).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  },

  /**
   * Прогресс потока в разрезе проектов: сколько проектов полностью завершены.
   * Проект завершён, когда ВСЕ его уроки завершены.
   */
  computeStreamProjectProgress(
    snapshot: ContentSnapshot,
    student: { steps: Array<{ stepId: string; status: string }> },
  ): Progress {
    const completedStepIds = new Set(
      student.steps
        .filter((s) => s.status === 'completed')
        .map((s) => s.stepId),
    );

    const total = snapshot.length;
    const completed = snapshot.filter((p) =>
      p.lessons.every((l) =>
        l.stepIds.every((sid) => completedStepIds.has(sid)),
      ),
    ).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  },

  /**
   * Позиция шага в курсе: индексы, заголовки, общее количество шагов в уроке.
   * Делегирует CourseDs.findStepPosition.
   */
  getStepPosition(
    snapshot: ContentSnapshot,
    stepId: string,
  ): StepPosition | null {
    return new CourseDs().findStepPosition(snapshot, stepId);
  },

  /**
   * Прогресс в уроке для конкретного шага: сколько шагов завершено.
   */
  getStepLessonProgress(
    snapshot: ContentSnapshot,
    stepId: string,
    student: { steps: Array<{ stepId: string; status: string }> },
  ): Progress {
    const pos = new CourseDs().findStepPosition(snapshot, stepId);
    if (!pos) return { completed: 0, total: 0, percent: 0 };

    const lessonStepIds =
      snapshot
        .flatMap((p) => p.lessons)
        .find((l) => l.lessonTitle === pos.lessonTitle)?.stepIds ?? [];

    const completedIds = new Set(
      student.steps
        .filter((s) => s.status === 'completed')
        .map((s) => s.stepId),
    );

    const completed = lessonStepIds.filter((sid) =>
      completedIds.has(sid),
    ).length;
    const total = lessonStepIds.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  },

  /**
   * Категоризирует студентов по уровню отставания.
   *
   * Использует агрегаты StudentAr для индивидуальных расчётов,
   * вычисляет медиану и применяет комбинированную логику:
   * - Время >7д → critical
   * - Время >4д → lagging
   * - on_track по времени, но отстаёт от медианы на 30%+ → lagging
   */
  categorizeStudents(
    students: Student[],
    now: Date = new Date(),
  ): CategorizedStudent[] {
    // Время с последней активности для каждого
    const hoursMap = new Map<string, number>();
    const activeHours: number[] = [];

    for (const s of students) {
      let latest = 0;
      for (const step of s.steps) {
        const ts = step.completedAt ?? step.issuedAt;
        const ms = new Date(ts).getTime();
        if (ms > latest) latest = ms;
      }
      const hours =
        latest > 0 ? (now.getTime() - latest) / (1000 * 60 * 60) : 0;
      hoursMap.set(s.uuid, hours);

      if (s.status === 'active' || s.status === 'enrolled') {
        activeHours.push(hours);
      }
    }

    // Медиана по активным студентам
    activeHours.sort((a, b) => a - b);
    let median = 0;
    if (activeHours.length > 0) {
      const mid = Math.floor(activeHours.length / 2);
      if (activeHours.length % 2 === 0) {
        const a = activeHours[mid - 1];
        const b = activeHours[mid];
        if (a !== undefined && b !== undefined) {
          median = (a + b) / 2;
        }
      } else {
        median = activeHours[mid] ?? 0;
      }
    }

    return students.map((s) => {
      const hours = hoursMap.get(s.uuid) ?? 0;
      let lagLevel: CategorizedStudent['lagLevel'] = 'on_track';

      // Неактивные статусы — on_track
      if (s.status !== 'active' && s.status !== 'enrolled') {
        return {
          studentId: s.uuid,
          lagLevel: 'on_track',
          hoursSinceLastActivity: hours,
        };
      }

      // Время
      if (hours > 7 * 24) {
        lagLevel = 'critical';
      } else if (hours > 4 * 24) {
        lagLevel = 'lagging';
      }

      // Медиана: on_track по времени, но > медианы на 30% → lagging
      if (lagLevel === 'on_track' && median > 0 && hours >= median * 1.3) {
        lagLevel = 'lagging';
      }

      return { studentId: s.uuid, lagLevel, hoursSinceLastActivity: hours };
    });
  },

  /**
   * Вычисляет статистику времени выполнения шагов.
   * Для каждого завершённого шага: completedAt - issuedAt.
   */
  computeStepTimeStats(
    steps: Array<{ completedAt?: string; issuedAt?: string }>,
  ): StepTimeStats {
    const stats = { runner: 0, fast: 0, normal: 0, deep: 0 };

    for (const step of steps) {
      if (!step.completedAt || !step.issuedAt) continue;
      const durationMs =
        new Date(step.completedAt).getTime() -
        new Date(step.issuedAt).getTime();
      if (Number.isNaN(durationMs) || durationMs < 0) continue;

      const minutes = durationMs / 60_000;
      if (minutes < 1) stats.runner++;
      else if (minutes < 5) stats.fast++;
      else if (minutes < 15) stats.normal++;
      else stats.deep++;
    }

    return stats;
  },

  /**
   * Категории времени с прозвищами.
   */
  TIME_CATEGORIES: [
    { emoji: '🏃', name: 'Бегун', maxMinutes: 1 },
    { emoji: '⚡', name: 'Спринтер', maxMinutes: 5 },
    { emoji: '🐢', name: 'Вдумчивый', maxMinutes: 15 },
    { emoji: '📚', name: 'Исследователь', maxMinutes: Infinity },
  ] as const,

  /**
   * Вычисляет среднее время на шаг и доминирующую категорию.
   */
  computeAvgTime(steps: StepRecord[]): {
    avgMinutes: number | null;
    dominant: TimeCategory | null;
  } {
    let totalMs = 0;
    let count = 0;
    const stats = StreamDs.computeStepTimeStats(steps);

    for (const step of steps) {
      if (!step.completedAt || !step.issuedAt) continue;
      const durationMs =
        new Date(step.completedAt).getTime() -
        new Date(step.issuedAt).getTime();
      if (Number.isNaN(durationMs) || durationMs < 0) continue;
      totalMs += durationMs;
      count++;
    }

    if (count === 0) return { avgMinutes: null, dominant: null };

    const avgMinutes = Math.round(totalMs / count / 60_000);

    // Доминирующая категория
    const totals: Array<{
      cat: (typeof StreamDs.TIME_CATEGORIES)[number];
      count: number;
    }> = [
      { cat: StreamDs.TIME_CATEGORIES[0], count: stats.runner },
      { cat: StreamDs.TIME_CATEGORIES[1], count: stats.fast },
      { cat: StreamDs.TIME_CATEGORIES[2], count: stats.normal },
      { cat: StreamDs.TIME_CATEGORIES[3], count: stats.deep },
    ];
    totals.sort((a, b) => b.count - a.count);
    const top = totals[0];

    return {
      avgMinutes,
      dominant:
        top && top.count > 0
          ? { emoji: top.cat.emoji, name: top.cat.name, count: top.count }
          : null,
    };
  },

  /**
   * Сводка студента для строки в S07.
   */
  computeStudentRowSummary(
    snapshot: ContentSnapshot,
    student: Student,
  ): StudentRowSummary {
    const progress = StreamDs.computeProgress(snapshot, student);
    const { avgMinutes, dominant } = StreamDs.computeAvgTime(student.steps);
    return {
      progress,
      avgTimeMinutes: avgMinutes,
      dominantCategory: dominant,
    };
  },

  /**
   * Данные для карточки студента (S08).
   */
  computeStudentCard(
    snapshot: ContentSnapshot,
    student: Student,
    lagInfo?: { lagLevel: LagLevel; hoursSinceLastActivity: number },
  ): StudentCardData {
    // Прогресс по модулю
    const moduleProgress = StreamDs.computeProgress(snapshot, student);

    // Текущий проект
    let currentProject: StudentCardData['currentProject'];
    let currentLesson: StudentCardData['currentLesson'];

    if (student.currentStepId) {
      const pos = StreamDs.getStepPosition(snapshot, student.currentStepId);
      if (pos) {
        // Прогресс по проекту
        currentProject = {
          title: pos.projectTitle,
          progress: StreamDs.computeProjectLevelProgress(
            snapshot,
            pos.projectIndex - 1,
            student,
          ),
        };
        currentLesson = { title: pos.lessonTitle };
      }
    }

    // Время
    const { avgMinutes } = StreamDs.computeAvgTime(student.steps);

    // Категории времени
    const rawStats = StreamDs.computeStepTimeStats(student.steps);
    const timeCategories: TimeCategory[] = [
      { emoji: '🏃', name: 'Бегун', count: rawStats.runner },
      { emoji: '⚡', name: 'Спринтер', count: rawStats.fast },
      { emoji: '🐢', name: 'Вдумчивый', count: rawStats.normal },
      { emoji: '📚', name: 'Исследователь', count: rawStats.deep },
    ];

    return {
      moduleProgress,
      currentProject,
      currentLesson,
      avgTimeMinutes: avgMinutes,
      timeCategories,
      hoursSinceLastActivity: lagInfo?.hoursSinceLastActivity ?? 0,
      lagLevel: lagInfo?.lagLevel ?? 'on_track',
    };
  },
};
