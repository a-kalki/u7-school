import { Aggregate } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import type { User } from '@u7-scl/user/domain';
import type { Module } from '../module/entity';
import { ModulePolicy } from '../module/policy';
import { Status } from '../status';
import type { CreateLessonCmd } from './commands/create-lesson-cmd';
import type { Lesson, LessonArMeta } from './entity';
import { LessonSchema } from './entity';

/**
 * Агрегат Lesson — урок курса.
 */
export class LessonAr extends Aggregate<LessonArMeta> {
  static readonly arName = 'Lesson';
  static readonly arLabel = 'Урок';

  constructor(state: Lesson) {
    super(state, LessonSchema);
  }

  static create(command: CreateLessonCmd): LessonAr {
    const candidate: Lesson = {
      uuid: crypto.randomUUID(),
      moduleId: command.moduleId,
      title: command.title,
      additional: command.additional,
      estimatedMinutes: command.estimatedMinutes,
      status: Status.DRAFT,
      createdAt: isoNow(),
      stepIds: [],
      mentorStepIds: [],
    };
    return new LessonAr(candidate);
  }

  /** Добавляет stepId в массив урока. */
  addStep(stepId: string): void {
    this._state.stepIds.push(stepId);
    this.safeUpdate({});
  }

  /**
   * Урок, видимый актору (или null).
   * - Без актора: только PUBLISHED.
   * - Автор/ADMIN курса: любой статус.
   * - Остальные: только PUBLISHED.
   */
  getVisibleFor(actor: User | undefined, module: Module): Lesson | null {
    if (!actor) {
      return this.state.status === Status.PUBLISHED ? this.state : null;
    }
    if (ModulePolicy.isAdminOrAuthor(actor, module)) return this.state;
    return this.state.status === Status.PUBLISHED ? this.state : null;
  }
}
