import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { Role, RoleSchema, UserSchema } from './user';

describe('Роли пользователей (Roles)', () => {
  test('должны быть определены все роли', () => {
    expect(Role.GUEST as string).toBe('GUEST');
    expect(Role.SUBSCRIBER as string).toBe('SUBSCRIBER');
    expect(Role.CANDIDATE as string).toBe('CANDIDATE');
    expect(Role.STUDENT as string).toBe('STUDENT');
    expect(Role.MENTOR as string).toBe('MENTOR');
    expect(Role.ADMIN as string).toBe('ADMIN');
  });

  test('RoleSchema должна пропускать валидные значения ролей', () => {
    expect(v.safeParse(RoleSchema, Role.GUEST).success).toBe(true);
    expect(v.safeParse(RoleSchema, Role.SUBSCRIBER).success).toBe(true);
    expect(v.safeParse(RoleSchema, Role.CANDIDATE).success).toBe(true);
    expect(v.safeParse(RoleSchema, Role.STUDENT).success).toBe(true);
    expect(v.safeParse(RoleSchema, Role.MENTOR).success).toBe(true);
    expect(v.safeParse(RoleSchema, Role.ADMIN).success).toBe(true);
  });

  test('RoleSchema должна отклонять невалидные значения', () => {
    expect(v.safeParse(RoleSchema, 'SUPER_ADMIN').success).toBe(false);
    expect(v.safeParse(RoleSchema, '').success).toBe(false);
    expect(v.safeParse(RoleSchema, 'UNKNOWN').success).toBe(false);
  });
});

describe('Схема пользователя', () => {
  const valid = {
    uuid: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Иван',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-05-01T12:00',
    updatedAt: '2026-05-01T13:00',
  };

  test('принимает валидного пользователя', () => {
    const result = v.safeParse(UserSchema, valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toMatchObject(valid);
    }
  });

  describe('поле uuid', () => {
    test('принимает корректный UUID v4', () => {
      const uuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      ];
      uuids.forEach((uuid) => {
        const result = v.safeParse(UserSchema, { ...valid, uuid });
        expect(result.success).toBe(true);
      });
    });

    test('отклоняет невалидный UUID', () => {
      const invalidUuids = [
        'bad',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-4466554400001',
        '550e8400-e29b-41d4-a716-44665544000g',
        '550e8400e29b41d4a716446655440000',
        '',
        ' ',
      ];
      invalidUuids.forEach((uuid) => {
        const result = v.safeParse(UserSchema, { ...valid, uuid });
        expect(result.success).toBe(false);
      });
    });

    test('отклоняет отсутствующее поле uuid', () => {
      const { uuid, ...withoutUuid } = valid;
      const result = v.safeParse(UserSchema, withoutUuid);
      expect(result.success).toBe(false);
    });
  });

  describe('поле name', () => {
    test('принимает непустую строку', () => {
      const names = ['Иван', 'John', 'Марія', '张三', 'A'];
      names.forEach((name) => {
        const result = v.safeParse(UserSchema, { ...valid, name });
        expect(result.success).toBe(true);
      });
    });

    test('отклоняет пустую строку', () => {
      const emptyNames = ['', ' ', '  '];
      emptyNames.forEach((name) => {
        const result = v.safeParse(UserSchema, { ...valid, name });
        expect(result.success).toBe(false);
      });
    });

    test('отклоняет отсутствующее поле name', () => {
      const { name, ...withoutName } = valid;
      const result = v.safeParse(UserSchema, withoutName);
      expect(result.success).toBe(false);
    });

    test('отклоняет name не строкового типа', () => {
      const invalidTypes = [123, true, null, undefined, [], {}];
      invalidTypes.forEach((name) => {
        const result = v.safeParse(UserSchema, { ...valid, name });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('поле telegramId', () => {
    test('принимает положительное целое число', () => {
      const ids = [1, 100, 999999, 123456789];
      ids.forEach((telegramId) => {
        const result = v.safeParse(UserSchema, { ...valid, telegramId });
        expect(result.success).toBe(true);
      });
    });

    test('отклоняет отрицательные числа', () => {
      const negativeIds = [-1, -100, -0];
      negativeIds.forEach((telegramId) => {
        const result = v.safeParse(UserSchema, { ...valid, telegramId });
        expect(result.success).toBe(false);
      });
    });

    test('отклоняет ноль', () => {
      const result = v.safeParse(UserSchema, { ...valid, telegramId: 0 });
      expect(result.success).toBe(false);
    });

    test('отклоняет нецелые числа', () => {
      const floats = [1.5, 2.001, 123.456];
      floats.forEach((telegramId) => {
        const result = v.safeParse(UserSchema, { ...valid, telegramId });
        expect(result.success).toBe(false);
      });
    });

    test('отклоняет отсутствующее поле telegramId', () => {
      const { telegramId, ...withoutTelegramId } = valid;
      const result = v.safeParse(UserSchema, withoutTelegramId);
      expect(result.success).toBe(false);
    });

    test('отклоняет telegramId не числового типа', () => {
      const invalidTypes = ['123', true, null, undefined, [], {}];
      invalidTypes.forEach((telegramId) => {
        const result = v.safeParse(UserSchema, { ...valid, telegramId });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('поле roles', () => {
    test('принимает массив с одной ролью', () => {
      const result = v.safeParse(UserSchema, {
        ...valid,
        roles: [Role.STUDENT],
      });
      expect(result.success).toBe(true);
    });

    test('принимает массив с несколькими ролями', () => {
      const result = v.safeParse(UserSchema, {
        ...valid,
        roles: [Role.STUDENT, Role.MENTOR, Role.ADMIN],
      });
      expect(result.success).toBe(true);
    });

    test('отклоняет пустой массив', () => {
      const result = v.safeParse(UserSchema, { ...valid, roles: [] });
      expect(result.success).toBe(false);
    });

    test('отклоняет отсутствующее поле roles', () => {
      const { roles, ...withoutRoles } = valid;
      const result = v.safeParse(UserSchema, withoutRoles);
      expect(result.success).toBe(false);
    });

    test('отклоняет roles не массивом', () => {
      const invalidTypes = ['STUDENT', 123, true, null, undefined, {}];
      invalidTypes.forEach((roles) => {
        const result = v.safeParse(UserSchema, { ...valid, roles });
        expect(result.success).toBe(false);
      });
    });

    test('отклоняет массив с некорректными значениями ролей', () => {
      const invalidRolesArrays = [
        ['INVALID_ROLE'],
        [Role.STUDENT, 'INVALID'],
        [123],
        [null],
      ];
      invalidRolesArrays.forEach((roles) => {
        const result = v.safeParse(UserSchema, { ...valid, roles });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('поле createdAt', () => {
    test('принимает корректный ISO дату и время (без миллисекунд)', () => {
      const validDates = [
        '2026-05-01T12:00',
        '2024-01-01T00:00',
        '2023-12-31T23:59',
        '2025-06-15T08:30',
      ];
      validDates.forEach((createdAt) => {
        const result = v.safeParse(UserSchema, { ...valid, createdAt });
        expect(result.success).toBe(true);
      });
    });

    test('отклоняет некорректный формат даты', () => {
      const invalidDates = [
        '2026-05-01T12:00:00.000Z',
        '2026-05-01',
        '01.05.2026',
        'invalid-date',
        '',
        ' ',
        '2026-13-01T12:00',
        '2026-05-32T12:00',
      ];
      invalidDates.forEach((createdAt) => {
        const result = v.safeParse(UserSchema, { ...valid, createdAt });
        expect(result.success).toBe(false);
      });
    });

    test('отклоняет отсутствующее поле createdAt', () => {
      const { createdAt, ...withoutCreatedAt } = valid;
      const result = v.safeParse(UserSchema, withoutCreatedAt);
      expect(result.success).toBe(false);
    });
  });

  describe('поле updatedAt', () => {
    test('принимает корректный ISO дату и время', () => {
      const validDates = [
        '2026-05-01T12:00',
        '2024-01-01T00:00',
        '2023-12-31T23:59',
      ];
      validDates.forEach((updatedAt) => {
        const result = v.safeParse(UserSchema, { ...valid, updatedAt });
        expect(result.success).toBe(true);
      });
    });

    test('принимает отсутствующее поле updatedAt (опционально)', () => {
      const { updatedAt, ...withoutUpdatedAt } = valid;
      const result = v.safeParse(UserSchema, withoutUpdatedAt);
      expect(result.success).toBe(true);
    });

    test('отклоняет некорректный формат даты', () => {
      const invalidDates = [
        '2026-05-01',
        'invalid-date',
        '2023-12-31T23:59.999Z',
      ];
      invalidDates.forEach((updatedAt) => {
        const result = v.safeParse(UserSchema, { ...valid, updatedAt });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('комбинации нескольких невалидных полей', () => {
    test('отклоняет при нескольких ошибках одновременно', () => {
      const invalid = {
        ...valid,
        uuid: 'bad',
        name: '',
        telegramId: -5,
        roles: [],
        createdAt: 'invalid',
      };
      const result = v.safeParse(UserSchema, invalid);
      expect(result.success).toBe(false);
    });
  });
});
