import type { StreamStatus } from './status';

/** Идентификатор учебного потока (UUID) */
export type StreamId = string;

/** Идентификатор записи студента в потоке (UUID) */
export type StreamStudentId = string;

/** Статус прохождения шага студентом */
export type StepRecordStatus = 'issued' | 'completed';

/** Фильтр для списка потоков */
export interface StreamListFilter {
  status?: StreamStatus;
  mentorId?: string;
}

/** Результат завершения шага/уровня */
export type CompletionResult =
  | { level: 'step'; currentStepId: string }
  | { level: 'lesson'; currentStepId: string; completedLessonId: string }
  | { level: 'project'; currentStepId: string; completedProjectId: string }
  | { level: 'stream'; completed: true }
  | { level: 'already_completed'; currentStepId: string };

// ── Типы для навигации и прогресса ──

/** Узел шага в дереве навигации */
export type StepNode = {
  stepId: string;
  status: 'completed' | 'current' | 'locked';
  /** 1-based индекс шага в уроке */
  index: number;
};

/** Представление шагов урока для рендеринга */
export type LessonStepsView = {
  lessonTitle: string;
  lessonIndex: number; // 1-based
  projectTitle: string;
  projectIndex: number; // 1-based
  steps: StepNode[];
};

/** Узел урока в дереве навигации */
export type LessonNode = {
  lessonId: string;
  title: string;
  status: NodeStatus;
  completedSteps: number;
  totalSteps: number;
  /** Шаги со статусами для inline-списка в теле сообщения */
  steps: StepNode[];
};

/** Статус узла в дереве: пройден / в процессе / закрыт */
export type NodeStatus = 'completed' | 'current' | 'locked';

/** Узел проекта в дереве навигации */
export type ProjectNode = {
  title: string;
  status: NodeStatus;
  completedLessons: number;
  totalLessons: number;
  lessons: LessonNode[];
};

/** Полное дерево навигации: проекты → уроки с прогрессом */
export type NavigationTree = {
  projects: ProjectNode[];
};

/** Прогресс студента: завершено / всего / процент */
export type Progress = {
  completed: number;
  total: number;
  percent: number;
};

/** Уровень отставания */
export type LagLevel = 'critical' | 'lagging' | 'on_track';

/** Результат категоризации студента по отставанию */
export interface CategorizedStudent {
  studentId: string;
  lagLevel: LagLevel;
  hoursSinceLastActivity: number;
}

/** Статистика времени выполнения шагов */
export interface StepTimeStats {
  /** < 1 мин */
  runner: number;
  /** 1–5 мин */
  fast: number;
  /** 5–15 мин */
  normal: number;
  /** > 15 мин */
  deep: number;
}

/** Категория времени с названием */
export interface TimeCategory {
  emoji: string;
  name: string;
  count: number;
}

/** Сводка студента для строки в S07 */
export interface StudentRowSummary {
  progress: Progress;
  medianTimeMinutes: number | null;
  dominantCategory: TimeCategory | null;
}

/** Данные для карточки студента (S08) */
export interface StudentCardData {
  moduleProgress: Progress;
  currentProject?: {
    title: string;
    progress: Progress;
  };
  currentLesson?: {
    title: string;
  };
  medianTimeMinutes: number | null;
  timeCategories: TimeCategory[];
  hoursSinceLastActivity: number;
  lagLevel: LagLevel;
}
