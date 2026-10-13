import { describe, expect, it } from 'bun:test';
import { campaign, checkWorld, course, person, stream, student } from './index';

describe('world:check — валидатор мира', () => {
  const anchor = new Date('2026-09-23T10:00:00.000Z');

  function createValidWorldDef() {
    const pMentor = person({
      key: 'mentor',
      name: 'Dev Mentor',
      telegramId: 1004,
      roles: ['MENTOR', 'AUTHOR'],
      registeredAt: 'T-90d',
    });

    const pStudent = person({
      key: 'andrey',
      name: 'Андрей',
      telegramId: 1003,
      roles: ['STUDENT'],
      registeredAt: 'T-60d',
    });

    const cCourse = course({
      key: 'js-core',
      title: 'JS Core',
      description: 'Курс',
      authorKey: 'mentor',
      modules: [
        {
          key: 'm1',
          title: 'Синтаксис',
          projects: [
            {
              key: 'p1',
              title: 'Проект 1',
              lessons: [
                {
                  key: 'l1',
                  title: 'Урок 1',
                  steps: [{ key: 's1', title: 'Шаг 1' }],
                },
              ],
            },
          ],
        },
      ],
    });

    const sStream = stream({
      key: 'stream-1',
      title: 'Поток 1',
      description: 'Описание',
      courseKey: 'js-core',
      moduleKey: 'm1',
      mentorKey: 'mentor',
      status: 'completed',
      startedAt: 'T-50d',
    });

    const stStudent = student({
      key: 'student-andrey',
      personKey: 'andrey',
      streamKey: 'stream-1',
      enrolledAt: 'T-50d',
      status: 'advanced',
    });

    const cmp = campaign({
      key: 'cmp-andrey',
      context: 'stream_fate',
      streamKey: 'stream-1',
      subjectPersonKey: 'andrey',
      mentorPersonKey: 'mentor',
      subjectOutcome: 'completed_passed',
      createdAt: 'T-2d',
      expiresAt: 'T+5d',
      participants: [],
    });

    return {
      name: 'test-valid-world',
      anchorDate: anchor,
      persons: [pMentor, pStudent],
      courses: [cCourse],
      streams: [sStream],
      students: [stStudent],
      campaigns: [cmp],
    };
  }

  it('валидный мир проходит проверку без ошибок', () => {
    const logs: string[] = [];
    const worldDef = createValidWorldDef();

    const result = checkWorld(worldDef, {
      logger: (msg) => logs.push(msg),
    });

    expect(result.valid).toBe(true);
    expect(result.violations.length).toBe(0);
    expect(logs.some((l) => l.includes('валиден'))).toBe(true);
  });

  it('невалидный мир отвергается с возвратом всех нарушений и печатью отчёта', () => {
    const logs: string[] = [];
    const worldDef = createValidWorldDef();

    // Вносим нарушение роли: студент активен, но имеет только GUEST
    worldDef.persons[1] = person({
      key: 'andrey',
      name: 'Андрей',
      telegramId: 1003,
      roles: ['GUEST'],
      registeredAt: 'T-60d',
    });
    worldDef.students[0] = student({
      key: 'student-andrey',
      personKey: 'andrey',
      streamKey: 'stream-1',
      enrolledAt: 'T-50d',
      status: 'active',
    });

    const result = checkWorld(worldDef, {
      logger: (msg) => logs.push(msg),
    });

    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(
      result.violations.some((v) => v.code === 'STUDENT_ROLE_MISMATCH'),
    ).toBe(true);
    expect(logs.some((l) => l.includes('STUDENT_ROLE_MISMATCH'))).toBe(true);
  });

  it('ловит несколько нарушений инвариантов одновременно', () => {
    const worldDef = createValidWorldDef();

    // Нарушение 1: ментор без роли
    worldDef.persons[0] = person({
      key: 'mentor',
      name: 'Dev Mentor',
      telegramId: 1004,
      roles: ['AUTHOR'],
      registeredAt: 'T-90d',
    });

    // Нарушение 2: кампания expiresAt <= createdAt
    worldDef.campaigns[0] = campaign({
      key: 'cmp-andrey',
      context: 'stream_fate',
      streamKey: 'stream-1',
      subjectPersonKey: 'andrey',
      mentorPersonKey: 'mentor',
      subjectOutcome: 'completed_passed',
      createdAt: 'T-2d',
      expiresAt: 'T-5d',
      participants: [],
    });

    const result = checkWorld(worldDef);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.code === 'MENTOR_ROLE_MISMATCH'),
    ).toBe(true);
  });

  it('CLI-скрипт возвращает ненулевой exit при ошибках', async () => {
    const proc = Bun.spawn(['bun', 'run', 'world:check', 'unknown-world'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const exitCode = await proc.exited;
    expect(exitCode).toBe(1);
  });
});
