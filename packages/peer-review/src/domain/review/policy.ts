import type { CampaignParticipant } from '../review-campaign/entity';

/**
 * Политика адресатов отзыва (ФР-4):
 * - субъект «завершил» → ментор + соученики completed/in_progress;
 * - субъект «забросил» / «не начал» → только ментор;
 * - ментор → только субъект окна.
 *
 * Никогда — отзыв о себе; постороннему автору — пусто.
 */
export const ReviewPolicy = {
  /**
   * Разрешённые адресаты автора (без автора; постороннему — пусто).
   *
   * @param author — участник-автор отзыва (субъект окна или ментор)
   * @param participants — снапшот участников кампании
   * @param subjectId — uuid студента, чьё событие открыло окно (ФР-2)
   */
  recipientsOf(
    author: CampaignParticipant,
    participants: readonly CampaignParticipant[],
    subjectId: string,
  ): CampaignParticipant[] {
    const isParticipant = participants.some((p) => p.userId === author.userId);
    if (!isParticipant) {
      return [];
    }

    const others = participants.filter((p) => p.userId !== author.userId);

    if (author.role === 'mentor') {
      // Ментор → только субъект окна
      return others.filter((p) => p.userId === subjectId);
    }

    if (author.outcome === 'completed') {
      // Субъект «завершил» → ментор + соученики completed/in_progress
      return others.filter(
        (p) =>
          p.role === 'mentor' ||
          (p.role === 'student' &&
            (p.outcome === 'completed' || p.outcome === 'in_progress')),
      );
    }

    // dropped / never_started / undefined → только ментор
    return others.filter((p) => p.role === 'mentor');
  },

  /** Может ли автор написать отзыв адресату (запрет «о себе» включён). */
  canReview(
    author: CampaignParticipant,
    recipient: { userId: string },
    participants: readonly CampaignParticipant[],
    subjectId: string,
  ): boolean {
    return ReviewPolicy.recipientsOf(author, participants, subjectId).some(
      (p) => p.userId === recipient.userId,
    );
  },
};
