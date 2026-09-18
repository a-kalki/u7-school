import { Aggregate, errConflict, throwError } from '@u7-scl/core/domain';
import type {
  CampaignParticipant,
  ReviewCampaign,
  ReviewCampaignArMeta,
} from './entity';
import { ReviewCampaignSchema } from './entity';
import type { ReviewWindowClosedUcError } from './errors';

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
   * - userId участников уникальны (человек представлен в кампании один раз).
   */
  protected override checkInvariant(): void {
    const seen = new Set<string>();
    for (const p of this._state.participants) {
      if (p.role === 'student' && p.outcome === undefined) {
        this.throwInvariant(
          { campaignId: this._state.uuid, userId: p.userId },
          'Студент-участник кампании обязан иметь исход-проекцию (completed | dropped | never_started)',
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
  }

  // ── Чтение: каркас ──

  /** uuid скоупа кампании (для stream_completed — streamId). */
  get scopeId(): string {
    return this._state.scopeId;
  }

  /** Контекст кампании (дискриминант payload). */
  get context(): ReviewCampaign['context'] {
    return this._state.context;
  }

  /** Дата закрытия окна — вычислена при создании и сохранена. */
  get expiresAt(): string {
    return this._state.expiresAt;
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
