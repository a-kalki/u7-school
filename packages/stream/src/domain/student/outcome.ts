import * as v from 'valibot';
import type { Student } from './entity';

/**
 * Категория исхода студента (ФР-1).
 * Read-слой над состоянием студента: клиенты не разбирают `status` сами,
 * а спрашивают категорию здесь.
 */
export enum StudentOutcomeCategory {
  /** Завершил поток: `advanced` или `not_advanced` */
  COMPLETED = 'completed',
  /** Забросил учёбу: `abandoned` */
  ABANDONED = 'abandoned',
  /** Нетерминальные состояния: `enrolled` или `active` */
  IN_PROGRESS = 'in_progress',
}

/** Valibot-схема категории исхода (для снапшотов и сериализации) */
export const StudentOutcomeCategorySchema = v.picklist(
  [
    StudentOutcomeCategory.COMPLETED,
    StudentOutcomeCategory.ABANDONED,
    StudentOutcomeCategory.IN_PROGRESS,
  ],
  `Недопустимая категория исхода студента. Ожидается: ${Object.values(StudentOutcomeCategory).join(', ')}`,
);

/** Признак завершения — применим к категории COMPLETED */
export enum CompletionSign {
  /** Прошёл поток: `advanced` */
  PASSED = 'passed',
  /** Не прошёл поток: `not_advanced` */
  NOT_PASSED = 'not_passed',
}

/** Valibot-схема признака завершения */
export const CompletionSignSchema = v.picklist(
  [CompletionSign.PASSED, CompletionSign.NOT_PASSED],
  `Недопустимый признак завершения. Ожидается: ${Object.values(CompletionSign).join(', ')}`,
);

/**
 * Признак ухода — применим к категории ABANDONED.
 * Признаки независимы: «не начал» может сочетаться и с «покинул сам»,
 * и со «снят ментором» (приоритет выбора лейбла — забота словаря меток).
 */
export enum AbandonSign {
  /** Не начал: нет ни одного завершённого шага */
  NEVER_STARTED = 'never_started',
  /** Покинул сам: `cause: 'voluntary'` */
  LEFT_VOLUNTARILY = 'left_voluntarily',
  /** Снят ментором: `cause: 'by_mentor'` или `'inactivity'` */
  REMOVED_BY_MENTOR = 'removed_by_mentor',
}

/** Valibot-схема признака ухода */
export const AbandonSignSchema = v.picklist(
  [
    AbandonSign.NEVER_STARTED,
    AbandonSign.LEFT_VOLUNTARILY,
    AbandonSign.REMOVED_BY_MENTOR,
  ],
  `Недопустимый признак ухода. Ожидается: ${Object.values(AbandonSign).join(', ')}`,
);

/** Любой признак исхода студента */
export type StudentOutcomeSign = CompletionSign | AbandonSign;

/** Valibot-схема любого признака исхода (для снапшотов кампаний peer-review) */
export const StudentOutcomeSignSchema = v.union([
  CompletionSignSchema,
  AbandonSignSchema,
]);

/**
 * Вход API исходов: данные состояния студента, которых достаточно
 * для вычислений. Без обращений к репозиториям — чистые функции.
 * Совместимо по структуре с сущностью `Student`.
 */
export type StudentOutcomeInput = Pick<
  Student,
  'status' | 'abandonDetails' | 'steps'
>;

/**
 * Категория исхода студента (ФР-1).
 * Единственная точка знания «какой статус к какой категории относится»:
 * клиенты не разбирают `status` сами.
 */
export function studentOutcomeCategory(
  student: StudentOutcomeInput,
): StudentOutcomeCategory {
  switch (student.status) {
    case 'advanced':
    case 'not_advanced':
      return StudentOutcomeCategory.COMPLETED;
    case 'abandoned':
      return StudentOutcomeCategory.ABANDONED;
    case 'enrolled':
    case 'active':
      return StudentOutcomeCategory.IN_PROGRESS;
  }
}

/** Есть ли у студента хотя бы один завершённый шаг */
function hasCompletedStep(student: StudentOutcomeInput): boolean {
  return student.steps.some((step) => step.status === 'completed');
}

/**
 * Признак «не начал» (ФР-1, ФР-4): нет ни одного завершённого шага.
 * Выводимый признак — независим от причины ухода.
 */
export function studentNeverStarted(student: StudentOutcomeInput): boolean {
  return (
    studentOutcomeCategory(student) === StudentOutcomeCategory.ABANDONED &&
    !hasCompletedStep(student)
  );
}

/**
 * Признаки исхода студента (ФР-1): признаки завершения для категории
 * COMPLETED, признаки ухода — для ABANDONED. Признаки ухода независимы:
 * «не начал» сочетается с причиной ухода (приоритет выбора лейбла —
 * забота словаря меток).
 */
export function studentOutcomeSigns(
  student: StudentOutcomeInput,
): StudentOutcomeSign[] {
  switch (studentOutcomeCategory(student)) {
    case StudentOutcomeCategory.COMPLETED:
      return [
        student.status === 'advanced'
          ? CompletionSign.PASSED
          : CompletionSign.NOT_PASSED,
      ];
    case StudentOutcomeCategory.ABANDONED: {
      // Легаси-данные: abandoned без abandonDetails — без признаков ухода
      const cause = student.abandonDetails?.cause;
      const signs: StudentOutcomeSign[] = [];
      if (studentNeverStarted(student)) {
        signs.push(AbandonSign.NEVER_STARTED);
      }
      if (cause === 'voluntary') {
        signs.push(AbandonSign.LEFT_VOLUNTARILY);
      } else if (cause === 'by_mentor' || cause === 'inactivity') {
        signs.push(AbandonSign.REMOVED_BY_MENTOR);
      }
      return signs;
    }
    case StudentOutcomeCategory.IN_PROGRESS:
      return [];
  }
}
