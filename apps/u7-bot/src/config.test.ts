import { describe, expect, test } from 'bun:test';
import { loadConfig } from './config';

describe('loadConfig', () => {
  const setValidEnv = () => {
    process.env.BOT_TOKEN = 'test-token';
    process.env.COMMUNITY_GROUP_URL = 'https://t.me/+comm';
    process.env.COMMUNITY_GROUP_ID = '-1003964284604';
    process.env.STUDENT_GROUP_INVITE = 'https://t.me/+stud';
    process.env.STUDENT_GROUP_ID = '-1003960918937';
    process.env.BOT_ADMIN_UUID = '550e8400-e29b-41d4-a716-446655440000';
    process.env.NODE_ENV = 'test';
    process.env.DB_DIR = './test-data';
  };

  test('валидный env загружается корректно', () => {
    const originalEnv = { ...process.env };
    setValidEnv();

    const config = loadConfig();

    expect(config.botToken).toBe('test-token');
    expect(config.communityGroupUrl).toBe('https://t.me/+comm');
    expect(config.communityGroupId).toBe(-1003964284604);
    expect(config.studentGroupInvite).toBe('https://t.me/+stud');
    expect(config.studentGroupId).toBe(-1003960918937);
    expect(config.botAdminUuid).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(config.mode).toBe('test');
    expect(config.dbDir).toBe('./test-data');

    process.env = originalEnv;
  });

  test("dbDir по умолчанию './data'", () => {
    const originalEnv = { ...process.env };
    setValidEnv();
    delete process.env.DB_DIR;

    const config = loadConfig();

    expect(config.dbDir).toBe('./data');

    process.env = originalEnv;
  });

  test('отсутствующий BOT_TOKEN выбрасывает ошибку', () => {
    const originalEnv = { ...process.env };
    setValidEnv();
    delete process.env.BOT_TOKEN;

    expect(() => loadConfig()).toThrow();

    process.env = originalEnv;
  });

  test('невалидный BOT_ADMIN_UUID выбрасывает ошибку', () => {
    const originalEnv = { ...process.env };
    setValidEnv();
    process.env.BOT_ADMIN_UUID = 'not-a-uuid';

    expect(() => loadConfig()).toThrow();

    process.env = originalEnv;
  });

  test('отсутствующий COMMUNITY_GROUP_ID выбрасывает ошибку', () => {
    const originalEnv = { ...process.env };
    setValidEnv();
    delete process.env.COMMUNITY_GROUP_ID;

    expect(() => loadConfig()).toThrow();

    process.env = originalEnv;
  });

  test('отсутствующий COMMUNITY_GROUP_URL выбрасывает ошибку', () => {
    const originalEnv = { ...process.env };
    setValidEnv();
    delete process.env.COMMUNITY_GROUP_URL;

    expect(() => loadConfig()).toThrow();

    process.env = originalEnv;
  });

  test('отсутствующий STUDENT_GROUP_ID выбрасывает ошибку', () => {
    const originalEnv = { ...process.env };
    setValidEnv();
    delete process.env.STUDENT_GROUP_ID;

    expect(() => loadConfig()).toThrow();

    process.env = originalEnv;
  });

  test('отсутствующий STUDENT_GROUP_INVITE выбрасывает ошибку', () => {
    const originalEnv = { ...process.env };
    setValidEnv();
    delete process.env.STUDENT_GROUP_INVITE;

    expect(() => loadConfig()).toThrow();

    process.env = originalEnv;
  });

  test('отсутствующий NODE_ENV выбрасывает ошибку (дефолта нет)', () => {
    const originalEnv = { ...process.env };
    setValidEnv();
    delete process.env.NODE_ENV;

    expect(() => loadConfig()).toThrow();

    process.env = originalEnv;
  });

  test('невалидный NODE_ENV выбрасывает ошибку', () => {
    const originalEnv = { ...process.env };
    setValidEnv();
    process.env.NODE_ENV = 'staging';

    expect(() => loadConfig()).toThrow();

    process.env = originalEnv;
  });

  test('NODE_ENV=production принимается', () => {
    const originalEnv = { ...process.env };
    setValidEnv();
    process.env.NODE_ENV = 'production';

    const config = loadConfig();
    expect(config.mode).toBe('production');

    process.env = originalEnv;
  });

  test('NODE_ENV=development принимается', () => {
    const originalEnv = { ...process.env };
    setValidEnv();
    process.env.NODE_ENV = 'development';

    const config = loadConfig();
    expect(config.mode).toBe('development');

    process.env = originalEnv;
  });
});
