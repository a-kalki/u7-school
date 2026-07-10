import { type Course, CoursePolicy } from '@u7-scl/course/domain';
import { type User, UserPolicy } from '@u7-scl/user/domain';
import { StreamStatus } from '#domain/status';
import type { Stream } from './entity';

export const StreamPolicy = {
  canCreate(actor: User): boolean {
    return UserPolicy.isMentor(actor);
  },

  canRead(actor: User, stream: Stream): boolean {
    if (this.isActive(stream) || this.isComplete(stream)) return true;
    return UserPolicy.isAdmin(actor) || this.isMentor(actor, stream);
  },

  canEdit(actor: User, stream: Stream): boolean {
    return UserPolicy.isAdmin(actor) || this.isMentor(actor, stream);
  },

  canEnroll(actor: User): boolean {
    return UserPolicy.isGuest(actor) || UserPolicy.isCandidate(actor);
  },

  isMentor(actor: User, stream: Stream): boolean {
    return actor.uuid === stream.mentorId;
  },

  isComplete(stream: Stream): boolean {
    return stream.status === StreamStatus.COMPLETED;
  },

  isActive(stream: Stream): boolean {
    return stream.status === StreamStatus.ACTIVE;
  },

  isArchived(stream: Stream): boolean {
    return stream.status === StreamStatus.ARCHIVED;
  },

  /**
   * Может ли студент записаться на указанный модуль курса.
   * Решение: делегирует проверку структуры курса в CoursePolicy,
   * предварительно извлекая completedModuleIds из stream-объектов.
   *
   * @param course — курс с фазами и упорядоченными moduleIds
   * @param targetModuleId — модуль, на который планируется запись
   * @param completedRecords — записи о завершённых потоках студента (streamId, moduleId, status)
   */
  canEnrollNextModule(
    course: Course,
    targetModuleId: string,
    completedRecords: { streamId: string; moduleId: string; status: string }[],
  ): boolean {
    const completedModuleIds = completedRecords
      .filter((r) => r.status === 'advanced')
      .map((r) => r.moduleId);

    return CoursePolicy.canEnrollNextModule(
      course,
      targetModuleId,
      completedModuleIds,
    );
  },
};
