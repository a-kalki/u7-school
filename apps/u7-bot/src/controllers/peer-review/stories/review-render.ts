import { type MdText, md } from '@u7-scl/core/shared';
import type {
  ReviewDirection,
  StudentOutcome,
} from '@u7-scl/peer-review/domain';

/** Общий рендер отзыва для сторей чтения (S07 «Отзывы потока», S08 «Отзывы мне»). */

/** Роли «кто о ком» из направления отзыва. */
export function rolesOf(direction: ReviewDirection): {
  recipient: 'студент' | 'ментор';
  author: 'студент' | 'ментор';
} {
  switch (direction) {
    case 'student_mentor':
      return { recipient: 'ментор', author: 'студент' };
    case 'mentor_student':
      return { recipient: 'студент', author: 'ментор' };
    default:
      return { recipient: 'студент', author: 'студент' };
  }
}

/** Лейблы 4-значной проекции исходов (ui-spec S07). */
export const OUTCOME_LABELS: Record<StudentOutcome, string> = {
  completed_passed: 'завершил и прошел',
  completed_not_passed: 'завершил и не прошел',
  dropped: 'забросил',
  never_started: 'не начал',
};

/** Подпись автора: роль и (у автора-студента) лейбл исхода-снапшота. */
export function authorLabel(args: {
  direction: ReviewDirection;
  authorOutcome?: StudentOutcome;
}): string {
  const roles = rolesOf(args.direction);
  const outcome =
    roles.author === 'студент' && args.authorOutcome
      ? ` · ${OUTCOME_LABELS[args.authorOutcome]}`
      : '';
  return `${roles.author}${outcome}`;
}

/** Дата отзыва из isoMinute («2026-09-21T10:00») — «21.09.2026». */
export function reviewDate(createdAt: string): string {
  const [date] = createdAt.split('T');
  const [y, m, d] = (date ?? '').split('-');
  return d && m && y ? `${d}.${m}.${y}` : createdAt;
}

/** Строка автора отзыва в MarkdownV2: «👤 {Имя} (студент · исход · дата):». */
export function authorLine(args: {
  name: string;
  direction: ReviewDirection;
  authorOutcome?: StudentOutcome;
  createdAt: string;
}): MdText {
  return md`👤 ${args.name} \\(${authorLabel(args)} · ${reviewDate(args.createdAt)}\\):`;
}
