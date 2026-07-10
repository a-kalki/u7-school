import type { Course } from '@u7-scl/course/domain';
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
   * Проверяет, может ли студент записаться на следующий модуль курса.
   * Гейт: первый модуль разрешён всем, остальные — только после advanced.
   *
   * @param course — курс с фазами и moduleIds
   * @param targetModuleId — модуль, на который планируется запись
   * @param prevModuleStatus — статус студента на предыдущем модуле (undefined если записи нет)
   */
  canEnrollNextModule(
    course: Course,
    targetModuleId: string,
    prevModuleStatus: Student['status'] | undefined,
  ): boolean {
    // Собираем все moduleIds в линейный порядок по фазам
    const allModuleIds = course.phases.flatMap((phase) => phase.moduleIds);
    const targetIndex = allModuleIds.indexOf(targetModuleId);

    // Модуль не найден в курсе — отказ
    if (targetIndex === -1) return false;

    // Первый модуль в курсе — разрешён всем
    if (targetIndex === 0) return true;

    // Для всех остальных модулей нужен advanced на предыдущем
    return prevModuleStatus === 'advanced';
  },
};
