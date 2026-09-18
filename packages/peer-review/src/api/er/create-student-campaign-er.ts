import type { ErMeta } from '@u7-scl/core/api';
import { EventReaction } from '@u7-scl/core/api';
import type {
  StudentAbandonedEvent,
  StudentCompletedEvent,
} from '@u7-scl/stream/domain';
import {
  type StreamMemberOutcome,
  type StreamMembers,
  StudentOutcomeCategory,
} from '@u7-scl/stream/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type {
  CampaignParticipant,
  ParticipantOutcome,
} from '#domain/review-campaign/entity';
import { ReviewCampaignFactory } from '#domain/review-campaign/review-campaign-factory';

/**
 * Метаданные реакции создания студенческой кампании
 */
export interface CreateStudentCampaignErMeta
  extends ErMeta<StudentCompletedEvent | StudentAbandonedEvent> {}

/**
 * ER «создать студенческую кампанию»: реакция на события судьбы
 * студента (student.completed / student.abandoned).
 */
export class CreateStudentCampaignEr extends EventReaction<
  CreateStudentCampaignErMeta,
  PeerReviewApiModuleResolver
> {
  protected readonly erName = 'create-student-campaign' as const;
  protected readonly erLabel = 'Создать студенческую кампанию' as const;

  protected readonly eventNames = [
    'student.completed',
    'student.abandoned',
  ] as const;

  async handle(
    event: StudentCompletedEvent | StudentAbandonedEvent,
  ): Promise<void> {
    const scopeId = event.payload.streamId;
    const subjectId = event.payload.userId;

    // Идемпотентность: кампания окна (scopeId, subjectId) уже есть
    const existing = await this.resolve.reviewCampaignRepo.findBySubject(
      scopeId,
      subjectId,
    );
    if (existing) return;

    // Состав окружения субъекта — read-API модуля stream
    const members = await this.resolve.streamFacade.getMembers(scopeId);
    if (!members) {
      this.resolve.appResolver.logger.warn(
        `peer-review:${this.erName}`,
        'Состав потока недоступен — кампания не создана',
        { scopeId, subjectId },
      );
      return;
    }

    const ar = ReviewCampaignFactory.createStudentCampaign({
      scopeId,
      subjectId,
      participants: this.#participants(members),
      now: new Date(),
    });

    await this.resolve.reviewCampaignRepo.save(ar.state);
    for (const domainEvent of ar.flushEvents()) {
      this.resolve.eventBus.publish(domainEvent);
    }
  }

  /** Снапшот участников: студенты с проекциями исходов + ментор. */
  #participants(members: StreamMembers): CampaignParticipant[] {
    const students = members.students.map((s) => ({
      userId: s.userId,
      role: 'student' as const,
      outcome: this.#projectOutcome(s),
    }));
    return [...students, { userId: members.mentorId, role: 'mentor' as const }];
  }

  /**
   * Проекция исхода студента в исход кампании (4 значения):
   * завершил → completed; ещё учится → in_progress;
   * забросил начав → dropped; забросил не начав → never_started.
   */
  #projectOutcome(member: StreamMemberOutcome): ParticipantOutcome {
    switch (member.outcomeCategory) {
      case StudentOutcomeCategory.COMPLETED:
        return 'completed';
      case StudentOutcomeCategory.IN_PROGRESS:
        return 'in_progress';
      case StudentOutcomeCategory.ABANDONED:
        return member.neverStarted ? 'never_started' : 'dropped';
      default: {
        const unknown: never = member.outcomeCategory;
        throw new Error(
          `Неизвестная категория исхода студента: ${String(unknown)}`,
        );
      }
    }
  }
}
