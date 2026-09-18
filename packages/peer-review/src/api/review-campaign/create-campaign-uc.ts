import { U7UseCase } from '@u7-scl/app/domain';
import { errConflict, errNotFound } from '@u7-scl/core/domain';
import {
  type StreamMemberOutcome,
  type StreamMembers,
  StudentOutcomeCategory,
} from '@u7-scl/stream/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type {
  CreateCampaignCmd,
  CreateCampaignCmdMeta,
} from '#domain/review-campaign/commands/create-campaign-cmd';
import { CreateCampaignCmdSchema } from '#domain/review-campaign/commands/create-campaign-cmd';
import type {
  ScopeNotFoundUcError,
  ScopeNotTerminalUcError,
} from '#domain/review-campaign/commands/errors';
import type {
  CampaignParticipant,
  ParticipantOutcome,
  ReviewCampaign,
} from '#domain/review-campaign/entity';
import { ReviewCampaignSchema } from '#domain/review-campaign/entity';
import { ReviewCampaignFactory } from '#domain/review-campaign/review-campaign-factory';

/**
 * Use-case создания кампании сбора отзывов (ФР-6).
 *
 * Идемпотентен (ФР-7): кампания контекста для скоупа уже создана —
 * повторный триггер (повтор события stream.completed) не создаёт дубль.
 * Участников собирает фасад stream (read-API студента), исходы — проекция
 * peer-review (тройка completed/dropped/never_started), событие
 * campaign.created публикуется после сохранения.
 */
export class CreateCampaignUc extends U7UseCase<
  CreateCampaignCmdMeta,
  PeerReviewApiModuleResolver
> {
  protected readonly ucName = 'create-campaign' as const;
  protected readonly ucLabel = 'Создать кампанию отзывов' as const;
  protected readonly arMeta = {
    arName: 'ReviewCampaign' as const,
    arLabel: 'Кампания отзывов' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = CreateCampaignCmdSchema;
  protected readonly outputSchema = ReviewCampaignSchema;

  async execute(command: CreateCampaignCmd): Promise<ReviewCampaign> {
    // Идемпотентность: кампания для скоупа уже есть — триггер повторный
    const existing = await this.resolve.reviewCampaignRepo.findByScope(
      command.context,
      command.scopeId,
    );
    if (existing) return existing;

    // Сбор состава потока (ментор + студенты с исходами read-API)
    const members = await this.resolve.streamFacade.getMembers(command.scopeId);
    if (!members) {
      this.throwError(
        errNotFound<ScopeNotFoundUcError>(
          'REVIEW_SCOPE_NOT_FOUND',
          'Завершённый поток не найден',
          { scopeId: command.scopeId },
        ),
      );
    }

    const campaign = ReviewCampaignFactory.createStreamCompleted(
      command.scopeId,
      this.#participants(command.scopeId, members),
      new Date(),
    );

    await this.resolve.reviewCampaignRepo.save(campaign.state);
    this.publishEvents(campaign);
    return campaign.state;
  }

  /** Снапшот участников: студенты с исходами-проекциями + ментор. */
  #participants(
    scopeId: string,
    members: StreamMembers,
  ): CampaignParticipant[] {
    const students = members.students.map((s) => ({
      userId: s.userId,
      role: 'student' as const,
      outcome: this.#projectOutcome(scopeId, s),
    }));
    return [...students, { userId: members.mentorId, role: 'mentor' as const }];
  }

  /**
   * Проекция исхода студента в исход кампании (ФР-3, решение 6):
   * завершил → completed; забросил не начав → never_started;
   * забросил начав → dropped. Нетерминальный студент в завершённом
   * потоке — конфликт данных с инвариантом ФР-2.
   */
  #projectOutcome(
    scopeId: string,
    member: StreamMemberOutcome,
  ): ParticipantOutcome {
    switch (member.outcomeCategory) {
      case StudentOutcomeCategory.COMPLETED:
        return 'completed';
      case StudentOutcomeCategory.ABANDONED:
        return member.neverStarted ? 'never_started' : 'dropped';
      case StudentOutcomeCategory.IN_PROGRESS:
        this.throwError(
          errConflict<ScopeNotTerminalUcError>(
            'CAMPAIGN_SCOPE_NOT_TERMINAL',
            'В потоке есть студенты с незавершённой судьбой — кампания невозможна',
            { scopeId, pending: [member.userId] },
          ),
        );
    }
  }
}
