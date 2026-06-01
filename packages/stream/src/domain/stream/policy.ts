import { Role } from '@u7-scl/user/domain';
import type { Stream } from './entity';

export const StreamPolicy = {
  canCreate(actor: { roles: Role[] }): boolean {
    return (
      actor.roles.includes(Role.MENTOR) || actor.roles.includes(Role.ADMIN)
    );
  },

  canRead(actor: { uuid: string; roles: Role[] }, stream: Stream): boolean {
    if (stream.status === 'active' || stream.status === 'completed')
      return true;
    return actor.roles.includes(Role.ADMIN) || actor.uuid === stream.mentorId;
  },

  canEdit(actor: { uuid: string; roles: Role[] }, stream: Stream): boolean {
    return actor.roles.includes(Role.ADMIN) || actor.uuid === stream.mentorId;
  },

  canEnroll(actor: { roles: Role[] }): boolean {
    const roles = actor.roles;
    return roles.includes(Role.GUEST) || roles.includes(Role.CANDIDATE);
  },
};
