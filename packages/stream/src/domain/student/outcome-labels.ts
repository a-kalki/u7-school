import {
  AbandonSign,
  CompletionSign,
  StudentOutcomeCategory,
  type StudentOutcomeInput,
  studentOutcomeCategory,
  studentOutcomeSigns,
} from './outcome';

/**
 * Словарь продуктовых меток исхода (ФР-2): единый источник пользовательских
 * строк для UI и снапшотов. Канонические формулировки из спецификации трека:
 * «окончил», «окончил, не прошёл», «забросил», «не начал», «покинул сам»,
 * «снят ментором» (+ «учится» для нетерминальных состояний).
 */
export const STUDENT_OUTCOME_SIGN_LABELS: Record<
  CompletionSign | AbandonSign | 'abandoned' | 'in_progress',
  string
> = {
  // Признаки завершения
  passed: 'окончил',
  not_passed: 'окончил, не прошёл',
  // Признаки ухода
  never_started: 'не начал',
  left_voluntarily: 'покинул сам',
  removed_by_mentor: 'снят ментором',
  // Категории без признаков
  abandoned: 'забросил',
  in_progress: 'учится',
} as const;

/** Метка одного признака/категории из словаря */
function signLabel(sign: keyof typeof STUDENT_OUTCOME_SIGN_LABELS): string {
  return STUDENT_OUTCOME_SIGN_LABELS[sign];
}

/**
 * Главный лейбл исхода студента (ФР-2). Для выбывших с несколькими
 * признаками выбирает приоритет «не начал», как зафиксировано в спеке.
 */
export function studentOutcomeLabel(student: StudentOutcomeInput): string {
  if (studentOutcomeCategory(student) !== StudentOutcomeCategory.ABANDONED) {
    switch (student.status) {
      case 'advanced':
        return signLabel(CompletionSign.PASSED);
      case 'not_advanced':
        return signLabel(CompletionSign.NOT_PASSED);
      default:
        return signLabel('in_progress');
    }
  }

  const signs = studentOutcomeSigns(student);
  // Приоритет «не начал» над причиной ухода
  if (signs.includes(AbandonSign.NEVER_STARTED)) {
    return signLabel(AbandonSign.NEVER_STARTED);
  }
  if (signs.includes(AbandonSign.LEFT_VOLUNTARILY)) {
    return signLabel(AbandonSign.LEFT_VOLUNTARILY);
  }
  if (signs.includes(AbandonSign.REMOVED_BY_MENTOR)) {
    return signLabel(AbandonSign.REMOVED_BY_MENTOR);
  }
  // Легаси: abandoned с шагами, причина неизвестна
  return signLabel('abandoned');
}

/**
 * Составной лейбл карточки (ФР-2): все применимые метки через разделитель
 * « · », например «не начал · покинул сам». Собирается из словаря —
 * клиенты не дублируют строки и разделитель.
 */
export function studentOutcomeDetailLabel(
  student: StudentOutcomeInput,
): string {
  if (studentOutcomeCategory(student) !== StudentOutcomeCategory.ABANDONED) {
    return studentOutcomeLabel(student);
  }

  const signs = studentOutcomeSigns(student);
  if (signs.length === 0) {
    // Легаси: abandoned с шагами, причина неизвестна
    return signLabel('abandoned');
  }
  return signs.map(signLabel).join(' · ');
}
