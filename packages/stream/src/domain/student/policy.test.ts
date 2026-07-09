import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import { StreamStatus } from '../status';
import type { Stream } from '../stream/entity';
import type { Student } from './entity';
import { StudentPolicy } from './policy';

const mockDate = '2026-06-01T10:00';
const MENTOR_ID = 'm1';
const STUDENT_USER_ID = 'u1';

const mockStream: Stream = {
  uuid: 's1',
  title: 'Поток',
  description: 'Описание',
  mentorId: MENTOR_ID,
  moduleId: 'mod1',
  startDate: mockDate,
  status: StreamStatus.ACTIVE,
  contentSnapshot: [],
  createdAt: mockDate,
};

const mockStudent: Student = {
  uuid: 'st1',
  streamId: 's1',
  userId: STUDENT_USER_ID,
  enrolledAt: mockDate,
  status: 'active',
  currentStepId: 'step-1',
  steps: [],
  createdAt: mockDate,
};

function makeUser(uuid: string, roles: Role[]): User {
  return { uuid, name: 'Имя', telegramId: 1, roles, createdAt: mockDate };
}

describe('StudentPolicy', () => {
  // ── canManageStudent ──

  test('canManageStudent — true для ментора-владельца потока (не ADMIN)', () => {
    const mentor = makeUser(MENTOR_ID, [Role.MENTOR]);
    expect(StudentPolicy.canManageStudent(mentor, mockStream)).toBe(true);
  });

  test('canManageStudent — true для админа (даже не владельца потока)', () => {
    const admin = makeUser('admin-1', [Role.ADMIN]);
    expect(StudentPolicy.canManageStudent(admin, mockStream)).toBe(true);
  });

  test('canManageStudent — false для чужого ментора (не владельца, не админ)', () => {
    const otherMentor = makeUser('other-mentor', [Role.MENTOR]);
    expect(StudentPolicy.canManageStudent(otherMentor, mockStream)).toBe(false);
  });

  test('canManageStudent — false для студента', () => {
    const student = makeUser(STUDENT_USER_ID, [Role.STUDENT]);
    expect(StudentPolicy.canManageStudent(student, mockStream)).toBe(false);
  });

  test('canManageStudent — false для гостя', () => {
    const guest = makeUser('guest-1', [Role.GUEST]);
    expect(StudentPolicy.canManageStudent(guest, mockStream)).toBe(false);
  });

  // ── canViewProgress ──

  test('canViewProgress — true для самого студента', () => {
    const student = makeUser(STUDENT_USER_ID, [Role.STUDENT]);
    expect(StudentPolicy.canViewProgress(student, mockStudent)).toBe(true);
  });

  test('canViewProgress — true для админа', () => {
    const admin = makeUser('admin-1', [Role.ADMIN]);
    expect(StudentPolicy.canViewProgress(admin, mockStudent)).toBe(true);
  });

  test('canViewProgress — false для чужого студента (не админ)', () => {
    const otherStudent = makeUser('other-student', [Role.STUDENT]);
    expect(StudentPolicy.canViewProgress(otherStudent, mockStudent)).toBe(
      false,
    );
  });

  // ── canCompleteStep ──

  test('canCompleteStep — true только для самого студента', () => {
    const student = makeUser(STUDENT_USER_ID, [Role.STUDENT]);
    expect(StudentPolicy.canCompleteStep(student, mockStudent)).toBe(true);
  });

  test('canCompleteStep — false для ментора', () => {
    const mentor = makeUser(MENTOR_ID, [Role.MENTOR]);
    expect(StudentPolicy.canCompleteStep(mentor, mockStudent)).toBe(false);
  });
});
