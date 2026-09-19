import * as v from 'valibot';
import type { Review } from '../review/entity';
import type { ReviewCampaignAr } from './a-root';
import type { CampaignParticipant } from './entity';

/** Роль автора окна — субъект или его ментор (не роль участника кампании). */
export const AuthorRoleSchema = v.picklist(['subject', 'mentor']);
export type AuthorRole = v.InferOutput<typeof AuthorRoleSchema>;

/** Прогресс M/K: мои отзывы против адресатов политики. */
export interface CampaignProgress {
  /** М — мои отзывы в кампании. */
  done: number;
  /** K — доступные адресаты по политике. */
  total: number;
}

/** Факты «моей кампании» — общие для списка и деталки (ФР-7). */
export interface MyCampaignFacts {
  myRole: 'subject' | 'mentor';
  daysLeft: number;
  progress: CampaignProgress;
}

/** Карточка «моей кампании» — тип данных для UI и внешних модулей. */
export interface MyCampaignCard extends MyCampaignFacts {
  campaignId: string;
  context: 'stream_ended';
  scopeId: string;
  subjectId: string;
  expiresAt: string;
}

/** Адресат с признаком «мой отзыв уже есть» — тип данных для UI. */
export type RecipientWithMyReview = CampaignParticipant & {
  hasMyReview: boolean;
};

/** Адресаты окна автора — тип данных для UI (деталка кампании, ФР-7). */
export interface MyRecipientsView {
  campaignId: string;
  myRole: AuthorRole;
  /** Исход автора-студента (у ментора отсутствует) — выбор текста-подсказки S05. */
  myOutcome?: CampaignParticipant['outcome'];
  daysLeft: number;
  recipients: RecipientWithMyReview[];
}

/**
 * DS: факты кампании отзывов.
 * Работает с двумя агрегатами (ReviewCampaign + Review) — потому сервис,
 * а не метод AR; вычисления домена, не UC.
 */
export const CampaignFactsDs = {
  /** Роль автора, остаток дней и прогресс M/K по его кампании. */
  myCampaignFacts(
    ar: ReviewCampaignAr,
    userId: string,
    campaignReviews: readonly Review[],
    now: Date,
  ): MyCampaignFacts {
    const { myRole, recipients } = ar.authorshipOf(userId);
    const done = campaignReviews.filter((r) => r.authorId === userId).length;
    return {
      myRole,
      daysLeft: ar.daysLeft(now),
      progress: { done, total: recipients.length },
    };
  },

  /** Адресаты автора окна с признаком «мой отзыв уже есть». */
  recipientsWithMyReview(
    ar: ReviewCampaignAr,
    userId: string,
    myReviews: readonly Review[],
  ): RecipientWithMyReview[] {
    const { recipients } = ar.authorshipOf(userId);
    const written = new Set(myReviews.map((r) => r.recipientId));
    return recipients.map((r) => ({
      ...r,
      hasMyReview: written.has(r.userId),
    }));
  },
};
