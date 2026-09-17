import * as v from 'valibot';

/**
 * Статусы учебного потока.
 * - ENROLLMENT: открыта регистрация студентов
 * - ACTIVE: поток запущен, идёт процесс обучения
 * - COMPLETED: поток успешно завершён
 * - ARCHIVED: поток заархивирован
 */
export enum StreamStatus {
  ENROLLMENT = 'enrollment',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

/** Valibot-схема для валидации статуса потока */
export const StreamStatusSchema = v.picklist(
  [
    StreamStatus.ENROLLMENT,
    StreamStatus.ACTIVE,
    StreamStatus.COMPLETED,
    StreamStatus.ARCHIVED,
  ],
  `Недопустимый статус потока. Ожидается: ${Object.values(StreamStatus).join(', ')}`,
);

/** Статусы студента в жизненном цикле потока */
export enum StudentStatus {
  ENROLLED = 'enrolled',
  ACTIVE = 'active',
  ABANDONED = 'abandoned',
  ADVANCED = 'advanced',
  NOT_ADVANCED = 'not_advanced',
}

/** Valibot-схема для валидации статуса студента */
export const StudentStatusSchema = v.picklist(
  [
    StudentStatus.ENROLLED,
    StudentStatus.ACTIVE,
    StudentStatus.ABANDONED,
    StudentStatus.ADVANCED,
    StudentStatus.NOT_ADVANCED,
  ],
  `Недопустимый статус студента. Ожидается: ${Object.values(StudentStatus).join(', ')}`,
);

/**
 * Категория исхода студента (ФР-1): обобщает `StudentStatus` для клиентов.
 * Единственная точка знания «какой статус к какой категории относится» —
 * методы агрегата StudentAr, клиенты не разбирают `status` сами.
 */
export enum StudentOutcomeCategory {
  /** Завершил поток (успешно или нет) */
  COMPLETED = 'completed',
  /** Забросил учёбу */
  ABANDONED = 'abandoned',
  /** Нетерминальные состояния: ещё учится */
  IN_PROGRESS = 'in_progress',
}

/** Valibot-схема для валидации категории исхода */
export const StudentOutcomeCategorySchema = v.picklist(
  Object.values(StudentOutcomeCategory),
  `Недопустимая категория исхода. Ожидается: ${Object.values(StudentOutcomeCategory).join(', ')}`,
);

/** Признак завершения потока */
export enum CompletionSign {
  PASSED = 'passed',
  NOT_PASSED = 'not_passed',
}

/** Valibot-схема для валидации признака завершения */
export const CompletionSignSchema = v.picklist(
  Object.values(CompletionSign),
  `Недопустимый признак завершения. Ожидается: ${Object.values(CompletionSign).join(', ')}`,
);

/** Признак ухода из потока */
export enum AbandonSign {
  /** Не начал: нет ни одного завершённого шага (выводимый) */
  NEVER_STARTED = 'never_started',
  /** Покинул сам */
  LEFT_VOLUNTARILY = 'left_voluntarily',
  /** Снят ментором (по причине или из-за бездействия) */
  REMOVED_BY_MENTOR = 'removed_by_mentor',
}

/** Valibot-схема для валидации признака ухода */
export const AbandonSignSchema = v.picklist(
  Object.values(AbandonSign),
  `Недопустимый признак ухода. Ожидается: ${Object.values(AbandonSign).join(', ')}`,
);

/** Любой признак исхода (завершения или ухода) */
export type StudentOutcomeSign = CompletionSign | AbandonSign;

/** Valibot-схема для валидации набора признаков (например, в снапшотах peer-review) */
export const StudentOutcomeSignSchema = v.union([
  CompletionSignSchema,
  AbandonSignSchema,
]);
