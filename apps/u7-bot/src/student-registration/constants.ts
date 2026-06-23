import type { ContentSnapshot } from '@u7-scl/course/domain';

// ═══════════════════════════════════════════════════════════════
// Хардкод-данные для временных команд регистрации студентов
// Источник: maybe-member.md (раздел 6), поток 1
// ═══════════════════════════════════════════════════════════════

/** UUID потока 1: «Основы JS. Синтаксис — 1» */
export const STREAM_1_UUID = '8ae94921-8af6-4fb6-ad1d-60bd2f8ee394';

/** ID Telegram-группы потока (supergroup, с префиксом -100) */
export const GROUP_CHAT_ID = '-1003960918937';

/** Запись студента в хардкод-списке */
export interface StudentEntry {
  name: string;
  telegramId: number;
  uuid: string;
}

/**
 * Список студентов — участников группы u7-school-1,
 * которые известны системе (из maybe-member.md, раздел 6).
 *
 * Исключены: Nur (админ/ментор) и U7 School Bot.
 */
export const STUDENT_LIST: StudentEntry[] = [
  { name: 'Alex', telegramId: 5167204720, uuid: 'b39a00a8-af8b-4f43-a270-176fc3b4ac7b' },
  { name: 'Нұрым', telegramId: 1274181696, uuid: '5af02d03-952b-4914-9b86-8a94a9e127c1' },
  { name: 'Vice', telegramId: 1886053369, uuid: 'f3abd8ad-95dd-4b5f-86f8-b14c97b48c64' },
  { name: 'Ибрахим', telegramId: 7976471166, uuid: '62b1080d-2ad0-4e16-88eb-ea20ac1fa0ae' },
  { name: 'Aidar', telegramId: 952537114, uuid: 'd9f1694f-ef7e-495f-9389-080da724828f' },
  { name: 'Nur', telegramId: 671999593, uuid: '0f6e594c-b6ab-4ed4-af6d-d4406dae4b8e' },
  { name: 'Ismail', telegramId: 2023546466, uuid: 'c77ace46-414f-4a0b-97c2-da5ecc5fbdc3' },
  { name: 'nurts.nu', telegramId: 6888927793, uuid: 'fef43a67-0bae-4759-b172-057736aa5401' },
  { name: 'Asema🤍', telegramId: 923356508, uuid: '51a05e8f-b339-47e3-bb62-119aa8558363' },
  { name: 'Мират ☀️', telegramId: 7339477355, uuid: '4e7d618a-0cb1-40a4-bf2e-add225b14c29' },
  { name: 'Dina', telegramId: 795572232, uuid: '0cba1f15-c7bc-448c-9064-d9eab302a185' },
  { name: 'Zarina', telegramId: 756418382, uuid: '7e76a369-2e20-4075-bbf0-b6648ea3bc21' },
  { name: 'нур', telegramId: 1474054578, uuid: 'e1be6010-717e-448e-8a08-a27f4eeb6850' },
  { name: 'Laura', telegramId: 1060467091, uuid: '068e0099-db55-4acd-8709-9a05b1b95b4b' },
  { name: 'Мария', telegramId: 8960175810, uuid: '81a4ebf2-7186-43fe-b877-17f8fa4e0e2d' },
  { name: 'ᅠᅠ', telegramId: 7467906232, uuid: '98993dd2-b888-47be-9bb3-f9dbef694de1' },
];

// ═══════════════════════════════════════════════════════════════
// Хелперы
// ═══════════════════════════════════════════════════════════════

/**
 * Парсит метку урока формата `pN-lM` в 0-based индексы.
 *
 * @returns `{ projectIndex, lessonIndex }` или `null` при неверном формате.
 *   projectIndex = N - 1, lessonIndex = M - 1.
 */
export function parseLessonLabel(label: string): { projectIndex: number; lessonIndex: number } | null {
  const trimmed = label.trim();
  const match = trimmed.match(/^p(\d+)-l(\d+)$/);
  if (!match) return null;

  const projectNum = parseInt(match[1]!, 10);
  const lessonNum = parseInt(match[2]!, 10);

  if (projectNum < 1 || lessonNum < 1) return null;

  return {
    projectIndex: projectNum - 1,
    lessonIndex: lessonNum - 1,
  };
}

/**
 * Находит ID первого шага в указанном уроке снимка контента.
 *
 * @returns stepId или `null`, если проект или урок не найдены.
 */
export function findFirstStepId(
  snapshot: ContentSnapshot,
  projectIndex: number,
  lessonIndex: number,
): string | null {
  const project = snapshot[projectIndex];
  if (!project) return null;

  const lesson = project.lessons[lessonIndex];
  if (!lesson) return null;

  return lesson.stepIds[0] ?? null;
}

/**
 * Ищет студента в хардкод-списке по Telegram ID.
 */
export function findStudentByTelegramId(telegramId: number): StudentEntry | undefined {
  return STUDENT_LIST.find((s) => s.telegramId === telegramId);
}

/**
 * Строит человекочитаемую метку шага по снимку контента.
 *
 * Пример: «Шаг 1 / Переменные (p1-l2)»
 */
export function buildStepLabel(snapshot: ContentSnapshot, stepId: string): string {
  for (let pi = 0; pi < snapshot.length; pi++) {
    const project = snapshot[pi]!;
    for (let li = 0; li < project.lessons.length; li++) {
      const lesson = project.lessons[li]!;
      const si = lesson.stepIds.indexOf(stepId);
      if (si !== -1) {
        return `Шаг ${si + 1} / ${lesson.lessonTitle} (p${pi + 1}-l${li + 1})`;
      }
    }
  }
  // Запасной вариант — первые 8 символов UUID
  return `Шаг (${stepId.slice(0, 8)}...)`;
}
