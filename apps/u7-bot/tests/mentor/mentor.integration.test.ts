import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { TestApp } from '../helpers/test-app';
import { createTestApp } from '../helpers/test-app';

/**
 * Интеграционный тест: ментор → список потоков → карточка → студенты.
 *
 * Фикстурные ID:
 *   e0e0e0e0 — enrollment (ментор 4444...)
 *   e1e1e1e1 — active     (ментор 4444...)
 *   e2e2e2e2 — completed  (ментор 4444...)
 *   e3e3e3e3 — archived   (ментор 4444...)
 *   Ментор — telegramId 1004, uuid 4444...
 */
describe('MentorController (интеграционный)', () => {
  let app: TestApp;
  let mentor: User;

  const ENROLLMENT_ID = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0';
  const ACTIVE_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';

  beforeAll(async () => {
    app = await createTestApp('mentor-int');
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ── Мои потоки ──

  test('ментор видит свои потоки (включая все 4 статуса)', async () => {
    const streams = await app.apiApp.execute('list-streams', {});
    const myStreams = (
      streams as Array<{ mentorId: string; status: string }>
    ).filter((s) => s.mentorId === mentor.uuid);
    expect(myStreams.length).toBeGreaterThanOrEqual(4);
    const statuses = new Set(myStreams.map((s) => s.status));
    expect(statuses.has('enrollment')).toBe(true);
    expect(statuses.has('active')).toBe(true);
    expect(statuses.has('completed')).toBe(true);
    expect(statuses.has('archived')).toBe(true);
  });

  // ── Карточка потока ──

  test('enrollment поток существует и доступен', async () => {
    const stream = await app.apiApp.execute('get-stream', {
      streamId: ENROLLMENT_ID,
    });
    expect((stream as { status: string }).status).toBe('enrollment');
    expect((stream as { mentorId: string }).mentorId).toBe(mentor.uuid);
  });

  test('active поток — статус active', async () => {
    const stream = await app.apiApp.execute('get-stream', {
      streamId: ACTIVE_ID,
    });
    expect((stream as { status: string }).status).toBe('active');
  });

  // ── Студенты ──

  test('список студентов enrollment-потока (пустой)', async () => {
    const students = await app.apiApp.execute(
      'list-stream-students',
      { streamId: ENROLLMENT_ID },
      mentor.uuid,
    );
    expect(Array.isArray(students)).toBe(true);
  });

  // ── Создание потока (wizard: модули) ──

  test('wizard: список модулей для создания потока', async () => {
    const modules = await app.apiApp.execute('list-modules', {});
    expect(Array.isArray(modules)).toBe(true);
  });
});
