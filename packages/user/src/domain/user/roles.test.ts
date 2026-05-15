import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { Role, RoleSchema } from './roles';

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
