import * as v from 'valibot';
import type { Review } from '../review/entity';
import type { StudentOutcome } from '../review-campaign/entity';
import type { ReviewCampaignAr } from './a-root';

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

/** Факты «моей кампании» — общие для списка и деталки. */
export interface MyCampaignFacts {
  myRole: AuthorRole;
  daysLeft: number;
  progress: CampaignProgress;
}

/** Карточка «моей кампании» — тип данных для UI и внешних модулей. */
export interface MyCampaignCard extends MyCampaignFacts {
  campaignId: string;
  context: 'stream_fate';
  scopeId: string;
  subjectId: string;
  expiresAt: string;
  /** Исход субъекта окна — выбор текстов S02 по парам «роль-судьба». */
  subjectOutcome: StudentOutcome;
}

/** Адресат с признаком «мой отзыв уже есть» — тип данных для UI. */
export interface RecipientWithMyReview {
  userId: string;
  hasMyReview: boolean;
}

/** Адресаты окна автора — тип данных для UI (деталка кампании). */
export interface MyRecipientsView {
  campaignId: string;
  myRole: AuthorRole;
  /** Ментор скоупа: UI отличает адресата-ментора для лейбла. */
  mentorId: string;
  /** Исход субъекта окна — выбор текстов S03/S05 по парам «роль-судьба»
   * (для автора-субъекта это и есть его исход). */
  subjectOutcome: StudentOutcome;
  daysLeft: number;
  recipients: RecipientWithMyReview[];
}

/**
 * DS: факты кампании отзывов.
 * Работает с двумя агрегатами (ReviewCampaign + Review) — потому сервис,
 * а не метод AR; вычисления домена, не UC.
 */
export const CampaignFactsDs = {
  /** Факты «моей кампании»: роль автора, остаток дней, прогресс M/K. */
  myCampaignFacts(
    ar: ReviewCampaignAr,
    userId: string,
    campaignReviews: readonly Review[],
    now: Date,
  ): MyCampaignFacts {
    const { myRole, targetIds } = ar.reviewTargets(userId);
    const done = campaignReviews.filter((r) => r.authorId === userId).length;
    return {
      myRole,
      daysLeft: ar.daysLeft(now),
      progress: { done, total: targetIds.length },
    };
  },

  /** Адресаты автора с признаком «уже писал». */
  recipientsWithMyReview(
    ar: ReviewCampaignAr,
    userId: string,
    myReviews: readonly Review[],
  ): RecipientWithMyReview[] {
    const { targetIds } = ar.reviewTargets(userId);
    const written = new Set(myReviews.map((r) => r.recipientId));
    return targetIds.map((userId2) => ({
      userId: userId2,
      hasMyReview: written.has(userId2),
    }));
  },
};
