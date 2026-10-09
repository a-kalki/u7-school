import { isoNow } from '@u7-scl/core/shared';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import type {
  StepRecord,
  Student,
} from '../packages/stream/src/domain/student/entity';

/** Информация об опережающем студенте для отчёта */
export interface AheadStudentInfo {
  studentUuid: string;
  userId: string;
  currentStepId: string;
  currentStepIndex: number;
  newStepId: string;
  newStepIndex: number;
}

/** Результат анализа дельты снапшотов */
export interface SnapshotDeltaAnalysis {
  /** Идентификаторы добавленных шагов */
  addedStepIds: string[];
  /** Идентификаторы удалённых шагов */
  removedStepIds: string[];
  /** Список студентов, которые обогнали добавленные шаги */
  aheadStudents: AheadStudentInfo[];
  /** Есть ли конфликт (добавлены шаги позади хотя бы одного студента) */
  hasConflict: boolean;
}

/**
 * Извлекает плоский упорядоченный список UUID всех шагов из снапшота контента.
 */
export function extractStepIds(snapshot: ContentSnapshot): string[] {
  const ids: string[] = [];
  for (const project of snapshot) {
    for (const lesson of project.lessons) {
      for (const stepId of lesson.stepIds) {
        ids.push(stepId);
      }
    }
  }
  return ids;
}

/**
 * Проверяет, прошёл ли студент позицию шага в программе.
 * Студент считается прошедшим шаг, если:
 * 1. Его статус терминальный успешный ('advanced' / 'not_advanced'), либо
 * 2. Его текущий шаг (currentStepId) находится СТРОГО ДАЛЬШЕ в новой структуре программы, либо
 * 3. Он завершил последний шаг программы.
 */
export function isStudentAheadOfStep(
  student: Student,
  stepIndex: number,
  newStepIds: string[],
): boolean {
  if (student.status === 'advanced' || student.status === 'not_advanced') {
    return true;
  }

  const studentStepIndex = newStepIds.indexOf(student.currentStepId);
  if (studentStepIndex === -1) {
    // Если текущий шаг студента не найден в новой программе — не можем однозначно определить
    return false;
  }

  if (studentStepIndex > stepIndex) {
    return true;
  }

  // Если студент находится на самом последнем шаге программы и уже завершил его
  if (
    studentStepIndex === newStepIds.length - 1 &&
    studentStepIndex === stepIndex
  ) {
    const isCompleted = student.steps.some(
      (s) => s.stepId === student.currentStepId && s.status === 'completed',
    );
    if (isCompleted) return true;
  }

  return false;
}

/**
 * Анализирует изменения между старым и новым снапшотом для заданного списка студентов.
 */
export function analyzeSnapshotDelta(
  oldSnapshot: ContentSnapshot,
  newSnapshot: ContentSnapshot,
  students: Student[],
): SnapshotDeltaAnalysis {
  const oldStepIds = extractStepIds(oldSnapshot);
  const newStepIds = extractStepIds(newSnapshot);

  const addedStepIds = newStepIds.filter((id) => !oldStepIds.includes(id));
  const removedStepIds = oldStepIds.filter((id) => !newStepIds.includes(id));

  const aheadStudents: AheadStudentInfo[] = [];

  for (const newStepId of addedStepIds) {
    const newStepIndex = newStepIds.indexOf(newStepId);

    for (const student of students) {
      // Игнорируем студентов, которые бросили обучение
      if (student.status === 'abandoned') {
        continue;
      }

      if (isStudentAheadOfStep(student, newStepIndex, newStepIds)) {
        // Проверяем, нет ли уже этого шага у студента как completed
        const alreadyHasCompleted = student.steps.some(
          (s) => s.stepId === newStepId && s.status === 'completed',
        );
        if (!alreadyHasCompleted) {
          aheadStudents.push({
            studentUuid: student.uuid,
            userId: student.userId,
            currentStepId: student.currentStepId,
            currentStepIndex: newStepIds.indexOf(student.currentStepId),
            newStepId,
            newStepIndex,
          });
        }
      }
    }
  }

  return {
    addedStepIds,
    removedStepIds,
    aheadStudents,
    hasConflict: aheadStudents.length > 0,
  };
}

/**
 * Синхронизирует студентов: добавляет новые шаги в статусе 'completed' тем студентам,
 * которые уже ушли вперёд точки вставки.
 * Возвращает количество обновлённых студентов и мутирует массив students.
 */
export function syncAheadStudents(
  newSnapshot: ContentSnapshot,
  students: Student[],
  addedStepIds: string[],
  nowIso: string = isoNow(),
): { updatedCount: number; updatedStudentUuids: string[] } {
  const newStepIds = extractStepIds(newSnapshot);
  const updatedUuids = new Set<string>();

  for (const newStepId of addedStepIds) {
    const newStepIndex = newStepIds.indexOf(newStepId);

    for (const student of students) {
      if (student.status === 'abandoned') {
        continue;
      }

      if (isStudentAheadOfStep(student, newStepIndex, newStepIds)) {
        const existingRecord = student.steps.find(
          (s) => s.stepId === newStepId,
        );
        if (!existingRecord) {
          const newRecord: StepRecord = {
            stepId: newStepId,
            status: 'completed',
            issuedAt: nowIso,
            completedAt: nowIso,
          };
          student.steps.push(newRecord);
          updatedUuids.add(student.uuid);
        } else if (existingRecord.status !== 'completed') {
          existingRecord.status = 'completed';
          existingRecord.completedAt = nowIso;
          updatedUuids.add(student.uuid);
        }
      }
    }
  }

  return {
    updatedCount: updatedUuids.size,
    updatedStudentUuids: Array.from(updatedUuids),
  };
}
