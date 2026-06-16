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
};
