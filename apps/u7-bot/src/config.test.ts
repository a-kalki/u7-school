import { describe, expect, test } from 'bun:test';
import { loadConfig } from './config';

describe('loadConfig', () => {
  test('валидный env загружается корректно', () => {
    const originalEnv = { ...process.env };

    process.env.BOT_TOKEN = 'test-token';
    process.env.SCHOOL_GROUP_URL = 'https://t.me/test';
    process.env.BOT_ADMIN_UUID = '550e8400-e29b-41d4-a716-446655440000';
    process.env.DB_DIR = './test-data';

    const config = loadConfig();

    expect(config.botToken).toBe('test-token');
    expect(config.schoolGroupUrl).toBe('https://t.me/test');
    expect(config.botAdminUuid).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(config.dbDir).toBe('./test-data');

    process.env = originalEnv;
  });

  test("dbDir по умолчанию './data'", () => {
    const originalEnv = { ...process.env };

    process.env.BOT_TOKEN = 'test-token';
    process.env.SCHOOL_GROUP_URL = 'https://t.me/test';
    process.env.BOT_ADMIN_UUID = '550e8400-e29b-41d4-a716-446655440000';
    delete process.env.DB_DIR;

    const config = loadConfig();

    expect(config.dbDir).toBe('./data');

    process.env = originalEnv;
  });

  test('отсутствующий BOT_TOKEN выбрасывает ошибку', () => {
    const originalEnv = { ...process.env };

    delete process.env.BOT_TOKEN;
    process.env.SCHOOL_GROUP_URL = 'https://t.me/test';
    process.env.BOT_ADMIN_UUID = '550e8400-e29b-41d4-a716-446655440000';

    expect(() => loadConfig()).toThrow();

    process.env = originalEnv;
  });

  test('невалидный BOT_ADMIN_UUID выбрасывает ошибку', () => {
    const originalEnv = { ...process.env };

    process.env.BOT_TOKEN = 'test-token';
    process.env.SCHOOL_GROUP_URL = 'https://t.me/test';
    process.env.BOT_ADMIN_UUID = 'not-a-uuid';

    expect(() => loadConfig()).toThrow();

    process.env = originalEnv;
  });
});
