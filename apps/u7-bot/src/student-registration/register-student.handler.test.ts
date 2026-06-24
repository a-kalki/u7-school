import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test';
import { isoNow } from '@u7-scl/core/shared';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { Student, StudentRepo } from '@u7-scl/stream/domain';
import type { User, UserFacade } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import { handleRegisterStudent } from './register-student.handler';

// ── Тестовые данные ──

const STREAM_UUID = '8ae94921-8af6-4fb6-ad1d-60bd2f8ee394';
const GROUP_ID = '-1003960918937';
const BOT_ADMIN_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';

const testUser: User = {
  uuid: 'b39a00a8-af8b-4f43-a270-176fc3b4ac7b',
  name: 'Alex',
  telegramId: 5167204720,
  roles: [Role.GUEST],
  createdAt: '2026-06-01T00:00:00.000Z',
};

const testSnapshot: ContentSnapshot = [
  {
    projectId: 'p1-uuid',
    projectTitle: 'Проект 1',
    lessons: [
      {
        lessonId: 'l1-uuid',
        lessonTitle: 'Введение',
        stepIds: ['s1-1', 's1-2'],
      },
      { lessonId: 'l2-uuid', lessonTitle: 'Переменные', stepIds: ['s2-1'] },
      { lessonId: 'l3-uuid', lessonTitle: 'Операторы', stepIds: ['s3-1'] },
      { lessonId: 'l4-uuid', lessonTitle: 'Типы данных', stepIds: ['s4-1'] },
      { lessonId: 'l5-uuid', lessonTitle: 'Исключения', stepIds: ['s5-1'] },
    ],
  },
  {
    projectId: 'p2-uuid',
    projectTitle: 'Проект 2',
    lessons: [
      { lessonId: 'l6-uuid', lessonTitle: 'Урок 2.1', stepIds: ['s6-1'] },
      { lessonId: 'l7-uuid', lessonTitle: 'Урок 2.2', stepIds: ['s7-1'] },
      { lessonId: 'l8-uuid', lessonTitle: 'Урок 2.3', stepIds: ['s8-1'] },
    ],
  },
  {
    projectId: 'p3-uuid',
    projectTitle: 'Проект 3',
    lessons: [
      { lessonId: 'l9-uuid', lessonTitle: 'Урок 3.1', stepIds: ['s9-1'] },
    ],
  },
  {
    projectId: 'p4-uuid',
    projectTitle: 'Проект 4',
    lessons: [
      { lessonId: 'l10-uuid', lessonTitle: 'Урок 4.1', stepIds: ['s10-1'] },
    ],
  },
];

// ── Хелперы для моков ──

function createMockCtx(
  overrides: Partial<{
    telegramId: number;
    firstName: string;
    messageText: string;
  }> = {},
) {
  const replies: string[] = [];
  const reply = mock(
    async (text: string, _opts?: unknown): Promise<unknown> => {
      replies.push(text);
      return {} as ReturnType<typeof reply>;
    },
  );

  return {
    from: {
      id: overrides.telegramId ?? testUser.telegramId,
      first_name: overrides.firstName ?? testUser.name,
    },
    message: {
      text: overrides.messageText ?? '/register_student',
    },
    reply,
    replies,
    api: {
      getChatMember: mock(async (_chatId: string, _userId: number) => {
        return { status: 'member' };
      }),
    },
  };
}

function createMockUserFacade(existingUser?: User): UserFacade {
  return {
    getUserByTelegramId: mock(async (tgId: number) => {
      if (existingUser && existingUser.telegramId === tgId) return existingUser;
      return undefined;
    }),
    registerGuest: mock(
      async (_tgId: number, name: string, _actorId: string): Promise<User> => {
        return {
          uuid: crypto.randomUUID(),
          name,
          telegramId: _tgId,
          roles: [Role.GUEST],
          createdAt: isoNow(),
        };
      },
    ),
    updateUserRole: mock(async () => {}),
    getUserByUuid: mock(async () => undefined),
    userExists: mock(async () => false),
    addRoleToUser: mock(async () => {}),
    removeRoleFromUser: mock(async () => undefined),
  } as unknown as UserFacade;
}

function createMockStudentRepo(
  existingStudents: Student[] = [],
): StudentRepo & { _saved: Student[] } {
  const saved: Student[] = [];
  return {
    save: mock(async (student: Student) => {
      saved.push(student);
    }),
    getByUser: mock(async (_userId: string) => existingStudents),
    getByUuid: mock(async () => undefined),
    getByStream: mock(async () => []),
    _saved: saved, // для проверки в тестах
  } as unknown as StudentRepo & { _saved: Student[] };
}

// ── Тесты ──

describe('handleRegisterStudent', () => {
  let studentRepo: StudentRepo & { _saved: Student[] };

  beforeAll(() => {
    // Прогреваем схемы (valibot может быть ленивым)
  });

  afterAll(() => {
    mock.restore();
  });

  test('Сценарий 1: Успешная регистрация с уроком по умолчанию (p4-l1)', async () => {
    const ctx = createMockCtx({ messageText: '/register_student' });
    const facade = createMockUserFacade(testUser);
    studentRepo = createMockStudentRepo([]);

    await handleRegisterStudent(
      ctx as never,
      STREAM_UUID,
      GROUP_ID,
      testSnapshot,
      facade,
      studentRepo as StudentRepo,
      BOT_ADMIN_UUID,
    );

    const replyText = ctx.replies.join(' ');
    expect(replyText).toContain('зарегистрирован');
    expect(replyText).toContain('p4\\-l1');

    // Проверяем, что студент создан
    expect(studentRepo._saved.length).toBe(1);
    const student = studentRepo._saved[0]!;
    expect(student.userId).toBe(testUser.uuid);
    expect(student.streamId).toBe(STREAM_UUID);
    expect(student.status).toBe('active');
    expect(student.currentStepId).toBe('s10-1'); // первый шаг p4-l1
    expect(student.steps.length).toBe(1);
    expect(student.steps[0]!.stepId).toBe('s10-1');
    expect(student.steps[0]!.status).toBe('issued');
  });

  test('Сценарий 2: Успешная регистрация с явным уроком p1-l5', async () => {
    const ctx = createMockCtx({ messageText: '/register_student p1-l5' });
    const facade = createMockUserFacade(testUser);
    studentRepo = createMockStudentRepo([]);

    await handleRegisterStudent(
      ctx as never,
      STREAM_UUID,
      GROUP_ID,
      testSnapshot,
      facade,
      studentRepo as StudentRepo,
      BOT_ADMIN_UUID,
    );

    const student = studentRepo._saved[0]!;
    expect(student.currentStepId).toBe('s5-1'); // первый шаг p1-l5
    expect(ctx.replies.join(' ')).toContain('p1\\-l5');
  });

  test('Сценарий 3: Пользователь не в списке, но в группе — регистрируется', async () => {
    const newTgId = 9999999999;
    const ctx = createMockCtx({
      telegramId: newTgId,
      messageText: '/register_student',
    });
    const facade = createMockUserFacade(undefined); // нет в системе
    studentRepo = createMockStudentRepo([]);

    await handleRegisterStudent(
      ctx as never,
      STREAM_UUID,
      GROUP_ID,
      testSnapshot,
      facade,
      studentRepo as StudentRepo,
      BOT_ADMIN_UUID,
    );

    // Должен создать гостя и затем студента
    expect(ctx.replies.join(' ')).toContain('зарегистрирован');
    expect(studentRepo._saved.length).toBe(1);
  });

  test('Сценарий 4: Пользователь не в списке и не в группе — отказ', async () => {
    const ctx = createMockCtx({
      telegramId: 8888888888,
      messageText: '/register_student',
    });
    ctx.api.getChatMember = mock(async () => ({ status: 'left' }));
    const facade = createMockUserFacade(undefined);
    studentRepo = createMockStudentRepo([]);

    await handleRegisterStudent(
      ctx as never,
      STREAM_UUID,
      GROUP_ID,
      testSnapshot,
      facade,
      studentRepo as StudentRepo,
      BOT_ADMIN_UUID,
    );

    expect(ctx.replies.join(' ')).toContain('не являешься участником');
    expect(studentRepo._saved.length).toBe(0);
  });

  test('Сценарий 5: Уже есть активная запись — сообщает об этом', async () => {
    const existingStudent: Student = {
      uuid: crypto.randomUUID(),
      streamId: STREAM_UUID,
      userId: testUser.uuid,
      enrolledAt: isoNow(),
      status: 'active',
      currentStepId: 's1-1',
      steps: [
        {
          stepId: 's1-1',
          status: 'issued',
          issuedAt: isoNow(),
        },
      ],
      createdAt: isoNow(),
    };

    const ctx = createMockCtx({ messageText: '/register_student' });
    const facade = createMockUserFacade(testUser);
    studentRepo = createMockStudentRepo([existingStudent]);

    await handleRegisterStudent(
      ctx as never,
      STREAM_UUID,
      GROUP_ID,
      testSnapshot,
      facade,
      studentRepo as StudentRepo,
      BOT_ADMIN_UUID,
    );

    expect(ctx.replies.join(' ')).toContain('уже зарегистрирован');
    expect(studentRepo._saved.length).toBe(0);
  });

  test('Сценарий 6: Неверный формат урока — сообщение об ошибке', async () => {
    const ctx = createMockCtx({ messageText: '/register_student abc' });
    const facade = createMockUserFacade(testUser);
    studentRepo = createMockStudentRepo([]);

    await handleRegisterStudent(
      ctx as never,
      STREAM_UUID,
      GROUP_ID,
      testSnapshot,
      facade,
      studentRepo as StudentRepo,
      BOT_ADMIN_UUID,
    );

    expect(ctx.replies.join(' ')).toContain('Неверный формат');
    expect(studentRepo._saved.length).toBe(0);
  });

  test('Сценарий 7: Урок не найден в contentSnapshot — ошибка', async () => {
    const ctx = createMockCtx({ messageText: '/register_student p5-l1' });
    const facade = createMockUserFacade(testUser);
    studentRepo = createMockStudentRepo([]);

    await handleRegisterStudent(
      ctx as never,
      STREAM_UUID,
      GROUP_ID,
      testSnapshot,
      facade,
      studentRepo as StudentRepo,
      BOT_ADMIN_UUID,
    );

    expect(ctx.replies.join(' ')).toContain('не найден');
    expect(studentRepo._saved.length).toBe(0);
  });
});
