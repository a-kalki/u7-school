import { type Course, CoursePolicy } from '@u7-scl/course/domain';
import { type User, UserPolicy } from '@u7-scl/user/domain';
import { StreamStatus } from '#domain/status';
import type { Student } from '../student/entity';
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
   *
   * @param course — курс с фазами и упорядоченными moduleIds
   * @param targetModuleId — модуль, на который планируется запись
   * @param students — все записи студента (Student)
   * @param streams — соответствующие потоки (Stream), чтобы взять moduleId
   */
  canEnrollNextModule(
    course: Course,
    targetModuleId: string,
    students: Student[],
    streams: Stream[],
  ): boolean {
    const streamMap = new Map(streams.map((s) => [s.uuid, s.moduleId]));

    const completedModuleIds = students
      .filter((s) => s.status === 'advanced')
      .map((s) => streamMap.get(s.streamId))
      .filter((id): id is string => id !== undefined);

    return CoursePolicy.canEnrollNextModule(
      course,
      targetModuleId,
      completedModuleIds,
    );
  },
};
