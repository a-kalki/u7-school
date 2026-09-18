import {
  Aggregate,
  errAccessDenied,
  errConflict,
  throwError,
} from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import { ReviewPolicy } from '../review/policy';
import type {
  CampaignParticipant,
  ReviewCampaign,
  ReviewCampaignArMeta,
} from './entity';
import { ReviewCampaignSchema } from './entity';
import type {
  PeerReviewNotParticipantUcError,
  RecipientNotAllowedUcError,
  ReviewWindowClosedUcError,
} from './errors';

/** Миллисекунд в сутках — для расчёта остатка окна. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Агрегат ReviewCampaign — кампания сбора отзывов. */
export class ReviewCampaignAr extends Aggregate<ReviewCampaignArMeta> {
  static readonly arName = 'ReviewCampaign';
  static readonly arLabel = 'Кампания отзывов';

  /**
   * Поля, которые safeUpdate не перезаписывает никогда: каркас и окно
   * выставляются только при создании (фабрикой), участники — снапшот.
   */
  protected override readonly safeAttrs: Array<keyof ReviewCampaign> = [
    'uuid',
    'createdAt',
    'context',
    'scopeId',
    'subjectId',
    'expiresAt',
    'participants',
    'payload',
  ];

  constructor(state: ReviewCampaign) {
    super(state, ReviewCampaignSchema);
  }

  /**
   * Инварианты снапшота участников:
   * - студент обязан иметь исход-проекцию, ментор — обязан не иметь
   *   (роль «ментор» — отдельная роль, не исход);
   * - userId участников уникальны (человек представлен в кампании один раз);
   * - субъект окна (ФР-2) присутствует среди участников: студент с
   *   ТЕРМИНАЛЬНЫМ исходом (completed | dropped | never_started, не
   *   in_progress) — его событие открыло окно судьбы.
   */
  protected override checkInvariant(): void {
    const seen = new Set<string>();
    for (const p of this._state.participants) {
      if (p.role === 'student' && p.outcome === undefined) {
        this.throwInvariant(
          { campaignId: this._state.uuid, userId: p.userId },
          'Студент-участник кампании обязан иметь исход-проекцию (completed | in_progress | dropped | never_started)',
        );
      }
      if (p.role === 'mentor' && p.outcome !== undefined) {
        this.throwInvariant(
          { campaignId: this._state.uuid, userId: p.userId },
          'У ментора-участника кампании не может быть исхода (роль, не исход)',
        );
      }
      if (seen.has(p.userId)) {
        this.throwInvariant(
          { campaignId: this._state.uuid, userId: p.userId },
          'Дубль userId среди участников кампании',
        );
      }
      seen.add(p.userId);
    }

    const subject = this._state.participants.find(
      (p) => p.userId === this._state.subjectId,
    );
    if (!subject) {
      this.throwInvariant(
        { campaignId: this._state.uuid, userId: this._state.subjectId },
        'Субъект кампании обязан присутствовать среди участников',
      );
    }
    if (subject.role !== 'student') {
      this.throwInvariant(
        { campaignId: this._state.uuid, userId: subject.userId },
        'Субъект кампании обязан быть студентом (окно открывает событие студента)',
      );
    }
    if (subject.outcome === undefined || subject.outcome === 'in_progress') {
      this.throwInvariant(
        { campaignId: this._state.uuid, userId: subject.userId },
        'Исход субъекта кампании обязан быть терминальным (completed | dropped | never_started)',
      );
    }
  }

  // ── Чтение: каркас ──

  /** uuid скоупа кампании (для stream_ended — streamId). */
  get scopeId(): string {
    return this._state.scopeId;
  }

  /** uuid студента, чьё событие открыло окно судьбы (ФР-2). */
  get subjectId(): string {
    return this._state.subjectId;
  }

  /** Является ли userId субъектом окна. */
  isSubject(userId: string): boolean {
    return this._state.subjectId === userId;
  }

  /** Контекст кампании (дискриминант payload). */
  get context(): ReviewCampaign['context'] {
    return this._state.context;
  }

  /** Дата закрытия окна — вычислена при создании и сохранена. */
  get expiresAt(): string {
    return this._state.expiresAt;
  }

  /**
   * Зафиксировать факт создания кампании.
   * Вызывается фабрикой при создании нового агрегата.
   */
  announceCreated(): void {
    this.addEvent({
      eventId: crypto.randomUUID(),
      eventName: 'student-campaign.created',
      occurredAt: isoNow(),
      aggregateName: 'ReviewCampaign',
      aggregateId: this._state.uuid,
      payload: {
        campaignId: this._state.uuid,
        context: this._state.context,
        scopeId: this._state.scopeId,
        subjectId: this._state.subjectId,
      },
    });
  }

  // ── Чтение: участники ──

  /** Снапшот участников (клон только для чтения). */
  get participants(): CampaignParticipant[] {
    return structuredClone(this._state.participants);
  }

  /** Участник по userId (или undefined). */
  findParticipant(userId: string): CampaignParticipant | undefined {
    return structuredClone(
      this._state.participants.find((p) => p.userId === userId),
    );
  }

  // ── Чтение: окно жизни ──

  /** Истекло ли окно кампании на момент T (граница включительно). */
  isExpired(now: Date): boolean {
    return now.getTime() >= new Date(this._state.expiresAt).getTime();
  }

  /**
   * Остаток окна в полных отображаемых днях (округление вверх):
   * меньше суток до конца — 1, истёкшая — 0.
   */
  daysLeft(now: Date): number {
    if (this.isExpired(now)) return 0;
    const msLeft = new Date(this._state.expiresAt).getTime() - now.getTime();
    return Math.max(1, Math.ceil(msLeft / DAY_MS));
  }

  // ── Чтение: авторство (домен вместо UC) ──

  /**
   * Роль автора окна и его адресаты по политике.
   * Автор обязан быть субъектом окна или ментором; соученик пишет
   * только в собственном окне — доступ запрещён.
   */
  authorshipOf(userId: string): {
    myRole: 'subject' | 'mentor';
    recipients: CampaignParticipant[];
  } {
    const author = this.authorOf(userId);
    const myRole =
      author.userId === this._state.subjectId ? 'subject' : 'mentor';
    return {
      myRole,
      recipients: ReviewPolicy.recipientsOf(
        author,
        this.participants,
        this._state.subjectId,
      ),
    };
  }

  /** Автор окна; посторонний и соученик — не авторы (доступ запрещён). */
  private authorOf(userId: string): CampaignParticipant {
    const author = this._state.participants.find((p) => p.userId === userId);
    if (
      !author ||
      (author.userId !== this._state.subjectId && author.role !== 'mentor')
    ) {
      throwError(
        errAccessDenied<PeerReviewNotParticipantUcError>(
          'PEER_REVIEW_NOT_PARTICIPANT',
          'Автор не субъект окна и не ментор этой кампании',
          {},
        ),
      );
    }
    return author;
  }

  /**
   * Проверить право написать отзыв адресату; вернуть снапшоты
   * автора и адресата (для создания отзыва).
   * Ошибки домена: автор не субъект/ментор, адресат вне политики
   * (включая запрет «о себе» и неучастника кампании).
   */
  assertCanWrite(
    authorId: string,
    recipientId: string,
  ): { author: CampaignParticipant; recipient: CampaignParticipant } {
    const author = this.authorOf(authorId);
    const recipient = this._state.participants.find(
      (p) => p.userId === recipientId,
    );
    if (
      !recipient ||
      !ReviewPolicy.canReview(
        author,
        recipient,
        this._state.participants,
        this._state.subjectId,
      )
    ) {
      throwError(
        errConflict<RecipientNotAllowedUcError>(
          'PEER_REVIEW_RECIPIENT_NOT_ALLOWED',
          'Адресат недоступен по политике для роли автора',
          { campaignId: this._state.uuid, authorId, recipientId },
        ),
      );
    }
    return { author, recipient: structuredClone(recipient) };
  }

  /**
   * Подтвердить живость окна: доменная ошибка «возможность закрыта»
   */
  ensureLive(now: Date): void {
    if (this.isExpired(now)) {
      throwError(
        errConflict<ReviewWindowClosedUcError>(
          'REVIEW_WINDOW_CLOSED',
          'Возможность оставлять отзывы закрыта: срок кампании истёк',
          { campaignId: this._state.uuid, expiresAt: this._state.expiresAt },
        ),
      );
    }
  }
}
