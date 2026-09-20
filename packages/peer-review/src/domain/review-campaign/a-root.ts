import {
  Aggregate,
  errAccessDenied,
  errConflict,
  throwError,
} from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import type { ReviewDirection } from '../review/entity';
import type {
  ReviewCampaign,
  ReviewCampaignArMeta,
  StudentOutcome,
} from './entity';
import { ReviewCampaignSchema } from './entity';
import type {
  PeerReviewNotParticipantUcError,
  RecipientNotAllowedUcError,
  ReviewWindowClosedUcError,
} from './errors';

/** Миллисекунд в сутках — для расчёта остатка окна. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** Роль автора окна судьбы: субъект или его ментор. */
export type WindowAuthorRole = 'subject' | 'mentor';

/** Агрегат ReviewCampaign — кампания сбора отзывов. */
export class ReviewCampaignAr extends Aggregate<ReviewCampaignArMeta> {
  static readonly arName = 'ReviewCampaign';
  static readonly arLabel = 'Кампания отзывов';

  /**
   * Поля, которые safeUpdate не перезаписывает никогда: каркас, окно
   * и адресуемые выставляются только при создании (фабрикой).
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
   * Инварианты адресации окна судьбы (ФР-3):
   * - id участников уникальны (человек адресуем один раз);
   * - субъект не адресует отзыв сам себе — его нет в participants;
   * - ментор — в payload, не соученик: его нет в participants.
   */
  protected override checkInvariant(): void {
    const seen = new Set<string>();
    for (const userId of this._state.participants) {
      if (seen.has(userId)) {
        this.throwInvariant(
          { campaignId: this._state.uuid, userId },
          'Дубль userId среди участников кампании',
        );
      }
      seen.add(userId);
    }

    if (seen.has(this._state.subjectId)) {
      this.throwInvariant(
        { campaignId: this._state.uuid, userId: this._state.subjectId },
        'Субъект кампании не может быть в списке адресуемых',
      );
    }
    if (seen.has(this._state.payload.mentorId)) {
      this.throwInvariant(
        { campaignId: this._state.uuid, userId: this._state.payload.mentorId },
        'Ментор кампании — в payload, не в списке адресуемых',
      );
    }
  }

  // ── Чтение: каркас ──

  /** uuid скоупа кампании (для stream_fate — streamId). */
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

  /** Исход судьбы субъекта — 4-значная проекция (payload). */
  get subjectOutcome(): StudentOutcome {
    return this._state.payload.subjectOutcome;
  }

  /** uuid ментора скоупа — второй автор окна (payload). */
  get mentorId(): string {
    return this._state.payload.mentorId;
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
        mentorId: this._state.payload.mentorId,
        subjectOutcome: this._state.payload.subjectOutcome,
      },
    });
  }

  // ── Чтение: адресуемые ──

  /** id адресуемых соучеников (клон только для чтения). */
  get participants(): string[] {
    return structuredClone(this._state.participants);
  }

  /** Является ли userId адресуемым соучеником. */
  hasParticipant(userId: string): boolean {
    return this._state.participants.includes(userId);
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

  // ── Чтение: авторство и адресация (домен вместо UC) ──

  /**
   * Роль автора окна и его адресаты (ФР-3):
   * субъект → соученики (participants) + ментор (пустой список —
   * только ментор); ментор → только субъект. Соученик пишет в
   * собственном окне — доступ запрещён.
   */
  reviewTargets(userId: string): {
    myRole: WindowAuthorRole;
    targetIds: string[];
  } {
    const myRole = this.authorRoleOf(userId);
    if (myRole === 'mentor') {
      return { myRole, targetIds: [this._state.subjectId] };
    }
    return {
      myRole,
      targetIds: [...this._state.participants, this._state.payload.mentorId],
    };
  }

  /** Роль автора окна; посторонний — не автор (доступ запрещён). */
  private authorRoleOf(userId: string): WindowAuthorRole {
    if (this._state.subjectId === userId) return 'subject';
    if (this._state.payload.mentorId === userId) return 'mentor';
    throwError(
      errAccessDenied<PeerReviewNotParticipantUcError>(
        'PEER_REVIEW_NOT_PARTICIPANT',
        'Автор не субъект окна и не ментор этой кампании',
        {},
      ),
    );
  }

  /**
   * Проверить право написать отзыв адресату; вернуть данные создания
   * отзыва: direction «кто о ком» и снапшот исхода автора-студента.
   * Ошибки домена: автор не субъект/ментор, адресат вне политики
   * (включая запрет «о себе» и неучастника кампании).
   */
  assertCanWrite(
    authorId: string,
    recipientId: string,
  ): { direction: ReviewDirection; authorOutcome: StudentOutcome | undefined } {
    const myRole = this.authorRoleOf(authorId);
    const { targetIds } = this.reviewTargetsFor(myRole);
    if (!targetIds.includes(recipientId)) {
      throwError(
        errConflict<RecipientNotAllowedUcError>(
          'PEER_REVIEW_RECIPIENT_NOT_ALLOWED',
          'Адресат недоступен по политике для роли автора',
          { campaignId: this._state.uuid, authorId, recipientId },
        ),
      );
    }

    const recipientIsMentor = recipientId === this._state.payload.mentorId;
    const direction: ReviewDirection =
      myRole === 'mentor'
        ? 'mentor_student'
        : recipientIsMentor
          ? 'student_mentor'
          : 'student_student';

    return {
      direction,
      authorOutcome: myRole === 'subject' ? this.subjectOutcome : undefined,
    };
  }

  /** Адресаты по роли автора (без проверки доступа). */
  private reviewTargetsFor(myRole: WindowAuthorRole): {
    targetIds: string[];
  } {
    if (myRole === 'mentor') return { targetIds: [this._state.subjectId] };
    return {
      targetIds: [...this._state.participants, this._state.payload.mentorId],
    };
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
