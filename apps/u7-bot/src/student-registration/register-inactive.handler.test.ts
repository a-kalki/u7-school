import { afterAll, describe, expect, test, mock } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import type { Student } from '@u7-scl/stream/domain';
import type { UserFacade } from '@u7-scl/user/domain';
import type { StudentRepo } from '@u7-scl/stream/domain';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import { STUDENT_LIST } from './constants';
import { handleRegisterInactive } from './register-inactive.handler';

// ── Тестовые данные ──
const STREAM_UUID = '8ae94921-8af6-4fb6-ad1d-60bd2f8ee394';
const GROUP_ID = '-1003960918937';

// Создаём только первых 3 студентов из списка для теста
const TEST_STUDENT_LIST = STUDENT_LIST.slice(0, 3);

const testSnapshot: ContentSnapshot = [
  {
    projectId: 'p1-uuid',
    projectTitle: 'Проект 1',
    lessons: [
      { lessonId: 'l1-uuid', lessonTitle: 'Введение', stepIds: ['s1-1'] },
      { lessonId: 'l2-uuid', lessonTitle: 'Переменные', stepIds: ['s2-1'] },
      { lessonId: 'l3-uuid', lessonTitle: 'Операторы', stepIds: ['s3-1'] },
      { lessonId: 'l4-uuid', lessonTitle: 'Типы данных', stepIds: ['s4-1'] },
      { lessonId: 'l5-uuid', lessonTitle: 'Исключения', stepIds: ['s5-1'] },
    ],
  },
];

function createMockCtx(telegramId: number, isAdmin = false) {
  const replies: string[] = [];
  const reply = mock(async (text: string, _opts?: unknown) => {
    replies.push(text);
    return {} as ReturnType<typeof reply>;
  });

  return {
    from: { id: telegramId, first_name: 'Test' },
    reply,
    replies,
    api: {
      getChatMember: mock(async (_chatId: string, _userId: number) => {
        return { status: 'member' };
      }),
    },
  };
}

interface TestState {
  users: Map<string, User>;
  students: Student[];
}

function createMocks(state: TestState, adminTgId: number) {
  const facade: UserFacade = {
    getUserByTelegramId: mock(async (tgId: number) => {
      if (tgId === adminTgId) {
        return {
          uuid: 'admin-uuid',
          name: 'Admin',
          telegramId: adminTgId,
          roles: ['ADMIN', 'MENTOR'],
          createdAt: '2026-01-01T00:00:00.000Z',
        };
      }
      for (const u of state.users.values()) {
        if (u.telegramId === tgId) return u;
      }
      return undefined;
    }),
    getUserByUuid: mock(async (uuid: string) => {
      return state.users.get(uuid);
    }),
    registerGuest: mock(async (tgId: number, name: string): Promise<User> => {
      const u: User = {
        uuid: crypto.randomUUID(),
        name,
        telegramId: tgId,
        roles: ['GUEST'],
        createdAt: new Date().toISOString(),
      };
      state.users.set(u.uuid, u);
      return u;
    }),
    updateUserRole: mock(async () => undefined),
    userExists: mock(async () => false),
    addRoleToUser: mock(async () => undefined),
    removeRoleFromUser: mock(async () => undefined),
  } as unknown as UserFacade;

  const savedStudents: Student[] = [];
  const studentRepo: StudentRepo & { _saved: Student[] } = {
    save: mock(async (student: Student) => {
      savedStudents.push(student);
    }),
    getByUser: mock(async (userId: string) => {
      return state.students.filter((s) => s.userId === userId);
    }),
    getByUuid: mock(async () => undefined),
    getByStream: mock(async () => []),
    _saved: savedStudents,
  } as unknown as StudentRepo & { _saved: Student[] };

  return { facade, studentRepo };
}

describe('handleRegisterInactive', () => {
  afterAll(() => {
    mock.restore();
  });

  test('Сценарий 1: Успешное массовое зачисление (все 3 без активных записей)', async () => {
    const state: TestState = { users: new Map(), students: [] };
    const { facade, studentRepo } = createMocks(state, 773084180);
    const ctx = createMockCtx(773084180);

    // Регистрируем всех трёх как пользователей
    for (const entry of TEST_STUDENT_LIST) {
      state.users.set(entry.uuid, {
        uuid: entry.uuid,
        name: entry.name,
        telegramId: entry.telegramId,
        roles: ['GUEST'],
        createdAt: '2026-06-01T00:00:00.000Z',
      });
    }

    await handleRegisterInactive(
      ctx as never,
      STREAM_UUID,
      GROUP_ID,
      TEST_STUDENT_LIST,
      testSnapshot,
      facade,
      studentRepo as never,
    );

    expect(studentRepo._saved.length).toBe(3);
    // Все с p1-l5
    for (const s of studentRepo._saved) {
      expect(s.currentStepId).toBe('s5-1');
      expect(s.status).toBe('active');
      expect(s.streamId).toBe(STREAM_UUID);
    }
    // Отчёт
    const replyText = ctx.replies.join(' ');
    expect(replyText).toContain('Добавлено: 3');
    expect(replyText).toContain('Пропущено');
    expect(replyText).toContain('Ошибки: 0');
  });

  test('Сценарий 2: Часть уже имеет активные записи', async () => {
    const state: TestState = { users: new Map(), students: [] };
    const { facade, studentRepo } = createMocks(state, 773084180);
    const ctx = createMockCtx(773084180);

    // Все три пользователя в системе
    for (const entry of TEST_STUDENT_LIST) {
      state.users.set(entry.uuid, {
        uuid: entry.uuid,
        name: entry.name,
        telegramId: entry.telegramId,
        roles: ['GUEST'],
        createdAt: '2026-06-01T00:00:00.000Z',
      });
    }

    // Первый уже активный студент
    const [first] = TEST_STUDENT_LIST;
    state.students.push({
      uuid: crypto.randomUUID(),
      streamId: STREAM_UUID,
      userId: first!.uuid,
      enrolledAt: '2026-06-01T00:00:00.000Z',
      status: 'active',
      currentStepId: 's1-1',
      steps: [{ stepId: 's1-1', status: 'issued', issuedAt: '2026-06-01T00:00:00.000Z' }],
      createdAt: '2026-06-01T00:00:00.000Z',
    });

    await handleRegisterInactive(
      ctx as never,
      STREAM_UUID,
      GROUP_ID,
      TEST_STUDENT_LIST,
      testSnapshot,
      facade,
      studentRepo as never,
    );

    expect(studentRepo._saved.length).toBe(2);
    const replyText = ctx.replies.join(' ');
    expect(replyText).toContain('Добавлено: 2');
    expect(replyText).toContain('Пропущено');
  });

  test('Сценарий 3: Отказ не-админа', async () => {
    const state: TestState = { users: new Map(), students: [] };
    const { facade, studentRepo } = createMocks(state, 773084180);
    // Обычный пользователь (не админ)
    const ctx = createMockCtx(5167204720);

    await handleRegisterInactive(
      ctx as never,
      STREAM_UUID,
      GROUP_ID,
      TEST_STUDENT_LIST,
      testSnapshot,
      facade,
      studentRepo as never,
    );

    const replyText = ctx.replies.join(' ');
    expect(replyText).toContain('Только администратор');
    expect(studentRepo._saved.length).toBe(0);
  });

  test('Сценарий 4: Пользователь не в системе и не в группе', async () => {
    const state: TestState = { users: new Map(), students: [] };
    const { facade, studentRepo } = createMocks(state, 773084180);
    const ctx = createMockCtx(773084180);

    // Не добавляем пользователей в state.users
    // Мокаем getChatMember → 'left'
    ctx.api.getChatMember = mock(async () => ({ status: 'left' }));

    await handleRegisterInactive(
      ctx as never,
      STREAM_UUID,
      GROUP_ID,
      TEST_STUDENT_LIST,
      testSnapshot,
      facade,
      studentRepo as never,
    );

    const replyText = ctx.replies.join(' ');
    expect(replyText).toContain('Добавлено: 0');
    expect(replyText).toContain('Ошибки: 3');
    expect(studentRepo._saved.length).toBe(0);
  });
});
