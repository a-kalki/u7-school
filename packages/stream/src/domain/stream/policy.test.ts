import { describe, expect, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import { StreamStatus } from '../status';
import { StreamPolicy } from './policy';

const mentorId = 'm1';
const studentId = 's1';

const mockStream = {
  uuid: 's1',
  title: 'Поток',
  description: 'Описание',
  mentorId,
  moduleId: 'mod1',
  startDate: '2026-06-01T12:00',
  status: StreamStatus.ACTIVE,
  createdAt: '2026-06-01T10:00',
  contentSnapshot: [],
};

describe('StreamPolicy', () => {
  test('canCreate — true для MENTOR', () => {
    const actor = { uuid: 'a1', roles: [Role.MENTOR] };
    expect(StreamPolicy.canCreate(actor)).toBe(true);
  });

  test('canCreate — false для GUEST', () => {
    const actor = { uuid: 'a1', roles: [Role.GUEST] };
    expect(StreamPolicy.canCreate(actor)).toBe(false);
  });

  test('canRead — true для всех при ACTIVE', () => {
    const actor = { uuid: 'a2', roles: [Role.STUDENT] };
    expect(StreamPolicy.canRead(actor, mockStream)).toBe(true);
  });

  test('canEnroll — true для GUEST', () => {
    const actor = { uuid: 'a1', roles: [Role.GUEST] };
    expect(StreamPolicy.canEnroll(actor)).toBe(true);
  });

  test('canEnroll — false для STUDENT', () => {
    const actor = { uuid: 'a1', roles: [Role.STUDENT] };
    expect(StreamPolicy.canEnroll(actor)).toBe(false);
  });
});
