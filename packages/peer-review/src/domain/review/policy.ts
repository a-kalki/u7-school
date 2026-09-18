import type { CampaignParticipant } from '../review-campaign/entity';

/**
 * Политика адресатов отзыва (ФР-5):
 * - студент «завершил» → все студенты кампании + ментор;
 * - студент «забросил» / «не начал» → только ментор;
 * - ментор → все студенты.
 *
 * Никогда — отзыв о себе; постороннему автору — пусто.
 */
export const ReviewPolicy = {
  /** Разрешённые адресаты автора (без автора; постороннему — пусто). */
  recipientsOf(
    author: CampaignParticipant,
    participants: readonly CampaignParticipant[],
  ): CampaignParticipant[] {
    const isParticipant = participants.some((p) => p.userId === author.userId);
    if (!isParticipant) {
      return [];
    }

    const others = participants.filter((p) => p.userId !== author.userId);

    if (author.role === 'mentor') {
      return others.filter((p) => p.role === 'student');
    }

    if (author.outcome === 'completed') {
      // Все студенты кампании + ментор — то есть все прочие участники
      return others;
    }

    // dropped / never_started / undefined — только ментор
    return others.filter((p) => p.role === 'mentor');
  },

  /** Может ли автор написать отзыв адресату (запрет «о себе» включён). */
  canReview(
    author: CampaignParticipant,
    recipient: { userId: string },
    participants: readonly CampaignParticipant[],
  ): boolean {
    return ReviewPolicy.recipientsOf(author, participants).some(
      (p) => p.userId === recipient.userId,
    );
  },
};
