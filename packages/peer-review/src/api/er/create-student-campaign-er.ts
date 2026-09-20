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
import type { StudentOutcome } from '#domain/review-campaign/entity';
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

    const subject = members.students.find((s) => s.userId === subjectId);
    const subjectOutcome = this.#subjectOutcome(event, subject);

    const ar = ReviewCampaignFactory.createStudentCampaign({
      scopeId,
      subjectId,
      mentorId: members.mentorId,
      subjectOutcome,
      participantIds: this.#participantIds(event, members, subjectId),
      now: new Date(),
    });

    await this.resolve.reviewCampaignRepo.save(ar.state);
    for (const domainEvent of ar.flushEvents()) {
      this.resolve.eventBus.publish(domainEvent);
    }
  }

  /**
   * Адресуемые соученики (ФР-2): «завершил» → завершившиеся и ещё
   * учащиеся (без субъекта); «забросил»/«не начал» → пустой список.
   */
  #participantIds(
    event: StudentCompletedEvent | StudentAbandonedEvent,
    members: StreamMembers,
    subjectId: string,
  ): string[] {
    if (event.eventName === 'student.abandoned') return [];
    return members.students
      .filter(
        (s) =>
          s.userId !== subjectId &&
          (s.outcomeCategory === StudentOutcomeCategory.COMPLETED ||
            s.outcomeCategory === StudentOutcomeCategory.IN_PROGRESS),
      )
      .map((s) => s.userId);
  }

  /**
   * Проекция исхода субъекта (ФР-1): завершил и прошел / завершил и
   * не прошел — из события; забросил / не начал — по neverStarted.
   */
  #subjectOutcome(
    event: StudentCompletedEvent | StudentAbandonedEvent,
    subject: StreamMemberOutcome | undefined,
  ): StudentOutcome {
    if (event.eventName === 'student.completed') {
      return event.payload.outcome === 'advanced'
        ? 'completed_passed'
        : 'completed_not_passed';
    }
    return subject?.neverStarted ? 'never_started' : 'dropped';
  }
}
