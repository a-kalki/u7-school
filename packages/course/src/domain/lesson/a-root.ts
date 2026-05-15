import { Aggregate } from '@u7/core/domain';
import { isoNow } from '@u7/core/shared';
import type { User } from '@u7/user/domain';
import type { Course } from '../course/entity';
import { CoursePolicy } from '../course/policy';
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
      courseId: command.courseId,
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
  getVisibleFor(actor: User | undefined, course: Course): Lesson | null {
    if (!actor) {
      return this.state.status === Status.PUBLISHED ? this.state : null;
    }
    if (CoursePolicy.isAdminOrAuthor(actor, course)) return this.state;
    return this.state.status === Status.PUBLISHED ? this.state : null;
  }
}
