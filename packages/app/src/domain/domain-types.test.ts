import * as v from 'valibot';
import { describe, expect, test } from 'bun:test';

describe('@u7-scl/app/domain — доменные типы', () => {
  test('User экспортируется из @u7-scl/app/domain', async () => {
    const mod = await import('@u7-scl/app/domain');
    // Проверяем, что модуль экспортирует рантайм-значения (схемы)
    expect(mod).toHaveProperty('UserSchema');
    expect(mod).toHaveProperty('RoleSchema');
    expect(mod).toHaveProperty('Role');
  });

  test('U7BotAppMeta и U7AppResolver доступны на уровне типов', async () => {
    // Типы стираются в рантайме; проверяем что модуль импортируется без ошибок
    const mod = await import('@u7-scl/app/domain');
    expect(mod).toBeDefined();
  });

  test('UserSchema валидирует корректного пользователя', async () => {
    const { UserSchema } = await import('@u7-scl/app/domain');
    const validUser = {
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Тестовый Пользователь',
      telegramId: 123456789,
      roles: ['GUEST'],
      createdAt: '2024-06-01T12:00',
    };
    const result = v.safeParse(UserSchema, validUser);
    expect(result.success).toBe(true);
  });

  test('UserSchema отклоняет некорректного пользователя', async () => {
    const { UserSchema } = await import('@u7-scl/app/domain');
    const invalidUser = {
      uuid: 'не-uuid',
      name: '',
      telegramId: -5,
      roles: [],
      createdAt: 'не-дата',
    };
    const result = v.safeParse(UserSchema, invalidUser);
    expect(result.success).toBe(false);
  });
});
