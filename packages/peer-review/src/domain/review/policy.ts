import type { CampaignParticipant } from '../review-campaign/entity';

/**
 * Политика адресатов отзыва (ФР-5): кому автор может написать отзыв
 * в кампании. Stateless — чистая функция участников кампании.
 *
 * Правила по исходу автора:
 * - студент «завершил» → все студенты кампании + ментор;
 * - студент «забросил» / «не начал» → только ментор;
 * - ментор → все студенты.
 *
 * Никогда — отзыв о себе. Автор — обязательно участник кампании:
 * постороннему список адресатов пуст. Студент без исхода (повреждённые
 * данные, инвариант кампании этого не допускает) получает консервативную
 * ветку «только ментор».
 */
export const ReviewPolicy = {
  /**
   * Список разрешённых адресатов автора в кампании (без автора).
   * Пуст, если автор — не участник кампании.
   */
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

  /**
   * Может ли автор написать отзыв адресату: адресат — участник кампании
   * и входит в разрешённый список (включая запрет «о себе»).
   */
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
