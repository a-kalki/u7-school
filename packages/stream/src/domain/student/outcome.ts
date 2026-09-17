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
