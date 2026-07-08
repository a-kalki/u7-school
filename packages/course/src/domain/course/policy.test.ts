import { describe, expect, it } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import { Status } from '../status';
import type { Course } from './entity';
import { CoursePolicy } from './policy';

function makeUser(roles: Role[]): User {
  return {
    uuid: crypto.randomUUID(),
    telegramId: 123456789,
    name: 'Тестовый Пользователь',
    roles,
    status: 'active',
    createdAt: '2026-07-08T16:00',
  } as User;
}

function makeUserWithId(uuid: string, roles: Role[]): User {
  return {
    uuid,
    telegramId: 123456789,
    name: 'Тестовый Пользователь',
    roles,
    status: 'active',
    createdAt: '2026-07-08T16:00',
  } as User;
}

function makeCourse(authorId: string): Course {
  return {
    uuid: crypto.randomUUID(),
    title: 'Тестовый курс',
    description: 'Описание',
    authorId,
    phases: [],
    status: Status.DRAFT,
    createdAt: '2026-07-08T16:00',
  };
}

describe('CoursePolicy', () => {
  const authorId = crypto.randomUUID();
  const otherId = crypto.randomUUID();

  describe('canCreate', () => {
    it('AUTHOR может создавать', () => {
      expect(CoursePolicy.canCreate(makeUser([Role.AUTHOR]))).toBe(true);
    });

    it('ADMIN не может создавать', () => {
      expect(CoursePolicy.canCreate(makeUser([Role.ADMIN]))).toBe(false);
    });

    it('MENTOR не может создавать', () => {
      expect(CoursePolicy.canCreate(makeUser([Role.MENTOR]))).toBe(false);
    });

    it('STUDENT не может создавать', () => {
      expect(CoursePolicy.canCreate(makeUser([Role.STUDENT]))).toBe(false);
    });
  });

  describe('canRead', () => {
    it('любой авторизованный может читать', () => {
      expect(CoursePolicy.canRead(makeUser([Role.STUDENT]))).toBe(true);
      expect(CoursePolicy.canRead(makeUser([Role.ADMIN]))).toBe(true);
    });
  });

  describe('canEdit', () => {
    it('автор может редактировать свой курс', () => {
      const course = makeCourse(authorId);
      expect(
        CoursePolicy.canEdit(makeUserWithId(authorId, [Role.AUTHOR]), course),
      ).toBe(true);
    });

    it('ADMIN может редактировать чужой курс', () => {
      const course = makeCourse(otherId);
      expect(CoursePolicy.canEdit(makeUser([Role.ADMIN]), course)).toBe(true);
    });

    it('не-автор без ADMIN не может редактировать', () => {
      const course = makeCourse(otherId);
      expect(CoursePolicy.canEdit(makeUser([Role.MENTOR]), course)).toBe(false);
    });
  });
});
