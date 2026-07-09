import { describe, expect, test } from 'bun:test';
import { UserPolicy } from './policy';
import { Role } from './roles';

const admin = {
  uuid: 'a',
  name: 'Admin',
  telegramId: 1,
  roles: [Role.ADMIN],
  createdAt: '2026-05-01T12:00',
};

const student = {
  uuid: 's',
  name: 'Student',
  telegramId: 2,
  roles: [Role.STUDENT],
  createdAt: '2026-05-01T12:00',
};

const teacher = {
  uuid: 't',
  name: 'Teacher',
  telegramId: 3,
  roles: [Role.MENTOR],
  createdAt: '2026-05-01T12:00',
};

const author = {
  uuid: 'a2',
  name: 'Author',
  telegramId: 6,
  roles: [Role.AUTHOR],
  createdAt: '2026-05-01T12:00',
};

const anotherStudent = {
  uuid: 's2',
  name: 'Another',
  telegramId: 4,
  roles: [Role.STUDENT],
  createdAt: '2026-05-01T12:00',
};

const guest = {
  uuid: 'g',
  name: 'Guest',
  telegramId: 5,
  roles: [Role.GUEST],
  createdAt: '2026-05-01T12:00',
};

describe('UserPolicy', () => {
  describe('isAuthor', () => {
    test('AUTHOR — true', () => {
      expect(UserPolicy.isAuthor(author)).toBe(true);
    });

    test('MENTOR без AUTHOR — false', () => {
      expect(UserPolicy.isAuthor(teacher)).toBe(false);
    });

    test('ADMIN без AUTHOR — false', () => {
      expect(UserPolicy.isAuthor(admin)).toBe(false);
    });

    test('пользователь с AUTHOR + MENTOR — true', () => {
      const authorMentor = { ...teacher, roles: [Role.MENTOR, Role.AUTHOR] };
      expect(UserPolicy.isAuthor(authorMentor)).toBe(true);
    });

    test('пользователь без ролей — false', () => {
      const userWithoutRoles = { ...student, roles: [] };
      expect(UserPolicy.isAuthor(userWithoutRoles)).toBe(false);
    });
  });

  describe('canCreate', () => {
    test('ADMIN может создавать пользователей', () => {
      expect(UserPolicy.canCreate(admin)).toBe(true);
    });

    test('STUDENT не может создавать пользователей', () => {
      expect(UserPolicy.canCreate(student)).toBe(false);
    });

    test('TEACHER не может создавать пользователей', () => {
      expect(UserPolicy.canCreate(teacher)).toBe(false);
    });

    test('пользователь с несколькими ролями включая ADMIN может создавать', () => {
      const userWithMultipleRoles = {
        ...student,
        roles: [Role.STUDENT, Role.ADMIN],
      };
      expect(UserPolicy.canCreate(userWithMultipleRoles)).toBe(true);
    });

    test('пользователь без ролей не может создавать', () => {
      const userWithoutRoles = { ...student, roles: [] };
      expect(UserPolicy.canCreate(userWithoutRoles)).toBe(false);
    });
  });

  describe('canRead', () => {
    test('любой пользователь может читать любого другого пользователя', () => {
      expect(UserPolicy.canRead(student, anotherStudent)).toBe(true);
      expect(UserPolicy.canRead(admin, anotherStudent)).toBe(true);
      expect(UserPolicy.canRead(teacher, anotherStudent)).toBe(true);
    });

    test('можно читать самого себя', () => {
      expect(UserPolicy.canRead(student, student)).toBe(true);
    });

    test('даже без ролей можно читать', () => {
      const userWithoutRoles = { ...student, roles: [] };
      expect(UserPolicy.canRead(userWithoutRoles, admin)).toBe(true);
    });
  });

  describe('canEdit', () => {
    test('ADMIN может редактировать любого пользователя', () => {
      expect(UserPolicy.canEdit(admin, student)).toBe(true);
      expect(UserPolicy.canEdit(admin, teacher)).toBe(true);
      expect(UserPolicy.canEdit(admin, anotherStudent)).toBe(true);
    });

    test('ADMIN может редактировать себя', () => {
      expect(UserPolicy.canEdit(admin, admin)).toBe(true);
    });

    test('пользователь может редактировать себя', () => {
      expect(UserPolicy.canEdit(student, student)).toBe(true);
      expect(UserPolicy.canEdit(teacher, teacher)).toBe(true);
    });

    test('STUDENT не может редактировать другого STUDENT', () => {
      expect(UserPolicy.canEdit(student, anotherStudent)).toBe(false);
    });

    test('STUDENT не может редактировать ADMIN', () => {
      expect(UserPolicy.canEdit(student, admin)).toBe(false);
    });

    test('TEACHER не может редактировать STUDENT', () => {
      expect(UserPolicy.canEdit(teacher, student)).toBe(false);
    });

    test('TEACHER не может редактировать ADMIN', () => {
      expect(UserPolicy.canEdit(teacher, admin)).toBe(false);
    });

    test('пользователь с несколькими ролями включая ADMIN может редактировать', () => {
      const userWithAdmin = { ...student, roles: [Role.STUDENT, Role.ADMIN] };
      expect(UserPolicy.canEdit(userWithAdmin, teacher)).toBe(true);
    });

    test('пользователь без ролей не может редактировать другого', () => {
      const userWithoutRoles = { ...student, roles: [] };
      expect(UserPolicy.canEdit(userWithoutRoles, anotherStudent)).toBe(false);
    });

    test('пользователь без ролей может редактировать себя', () => {
      const userWithoutRoles = { ...student, roles: [] };
      expect(UserPolicy.canEdit(userWithoutRoles, userWithoutRoles)).toBe(true);
    });
  });

  describe('canAddRole', () => {
    test('ADMIN может добавить любую роль любому пользователю', () => {
      expect(UserPolicy.canAddRole(admin, student, Role.STUDENT)).toBe(true);
      expect(UserPolicy.canAddRole(admin, teacher, Role.ADMIN)).toBe(true);
    });

    test('GUEST может добавить себе роль STUDENT', () => {
      expect(UserPolicy.canAddRole(guest, guest, Role.STUDENT)).toBe(true);
    });

    test('GUEST может добавить себе роль CANDIDATE (после анкеты)', () => {
      expect(UserPolicy.canAddRole(guest, guest, Role.CANDIDATE)).toBe(true);
    });

    test('GUEST НЕ может добавить себе роль ADMIN', () => {
      expect(UserPolicy.canAddRole(guest, guest, Role.ADMIN)).toBe(false);
    });

    test('GUEST НЕ может добавить роль другому пользователю', () => {
      expect(UserPolicy.canAddRole(guest, student, Role.STUDENT)).toBe(false);
    });

    test('STUDENT может добавить себе STUDENT (идемпотентно)', () => {
      expect(UserPolicy.canAddRole(student, student, Role.STUDENT)).toBe(true);
    });

    test('STUDENT НЕ может добавить STUDENT другому', () => {
      expect(UserPolicy.canAddRole(student, anotherStudent, Role.STUDENT)).toBe(
        false,
      );
    });

    test('MENTOR может добавить STUDENT роль, но не другие', () => {
      expect(UserPolicy.canAddRole(teacher, student, Role.STUDENT)).toBe(true);
      expect(UserPolicy.canAddRole(teacher, teacher, Role.MENTOR)).toBe(false);
    });

    test('пользователь с ADMIN + другими ролями может всё', () => {
      const userWithAdmin = { ...student, roles: [Role.STUDENT, Role.ADMIN] };
      expect(UserPolicy.canAddRole(userWithAdmin, student, Role.MENTOR)).toBe(
        true,
      );
    });
  });

  describe('canRemoveRole', () => {
    test('ADMIN может удалить любую роль у любого пользователя', () => {
      expect(UserPolicy.canRemoveRole(admin, student, Role.STUDENT)).toBe(true);
      expect(UserPolicy.canRemoveRole(admin, teacher, Role.MENTOR)).toBe(true);
    });

    test('пользователь может удалить STUDENT у себя', () => {
      expect(UserPolicy.canRemoveRole(student, student, Role.STUDENT)).toBe(
        true,
      );
    });

    test('пользователь может удалить CANDIDATE у себя', () => {
      const candidate = { ...guest, roles: [Role.CANDIDATE] };
      expect(
        UserPolicy.canRemoveRole(candidate, candidate, Role.CANDIDATE),
      ).toBe(true);
    });

    test('ADMIN может удалить любую роль, включая у себя', () => {
      expect(UserPolicy.canRemoveRole(admin, admin, Role.ADMIN)).toBe(true);
    });

    test('GUEST НЕ может удалить роль у другого', () => {
      expect(UserPolicy.canRemoveRole(guest, student, Role.STUDENT)).toBe(
        false,
      );
    });

    test('MENTOR может удалить STUDENT у других, но не другие роли', () => {
      expect(UserPolicy.canRemoveRole(teacher, student, Role.STUDENT)).toBe(
        true,
      );
    });
  });
});
