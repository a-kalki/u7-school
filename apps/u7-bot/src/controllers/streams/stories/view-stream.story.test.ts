import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { ViewStreamStory } from './view-stream.story';

describe('ViewStreamStory (S02-S04)', () => {
  const session: SessionData = { activeHandler: null };
  const guestActor: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const studentActor: User = {
    uuid: 'user-2',
    name: 'Студент',
    telegramId: 456,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const mentorActor: User = {
    uuid: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
    name: 'Алексей Смирнов',
    telegramId: 999,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const SAMPLE_ID = 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s';

  const sampleStream = {
    uuid: SAMPLE_ID,
    title: 'Python Advanced',
    description: 'Продвинутый курс',
    moduleId: 'mod-1',
    status: 'enrollment',
    startDate: '2026-06-01T00:00:00.000Z',
    mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
  };

  function makeStory(
    streamOverrides: Record<string, unknown> = {},
    studentCount = 0,
    mentorName = 'Алексей Смирнов',
  ) {
    const stream = { ...sampleStream, ...streamOverrides };

    const mockAppApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return stream;
        if (name === 'list-stream-students')
          return Array.from({ length: studentCount }, (_, i) => ({
            uuid: `student-${i}`,
          }));
        if (name === 'get-user')
          return { uuid: 'm1', name: mentorName, roles: [Role.MENTOR] };
        if (name === 'get-steps-by-lessons') return {};
        return undefined;
      }),
    };

    const mockUiApp = {
      getAction: mock((_name: string) => {
        throw new Error(`Действие «${_name}» не найдено`);
      }),
    };

    const story = new ViewStreamStory();
    story.init(mockAppApi as never, mockUiApp as never);
    return { story, mockAppApi, mockUiApp };
  }

  // ── S02: Карточка потока ──

  test('view: показывает карточку потока', async () => {
    const { story } = makeStory({}, 0);

    const response = await story.handleCallback(
      `view:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Python Advanced');
    expect(response.sendMessage?.text).toContain('Продвинутый курс');
  });

  test('view: показывает имя ментора', async () => {
    const { story } = makeStory({}, 0);

    const response = await story.handleCallback(
      `view:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Алексей Смирнов');
  });

  test('view: показывает количество студентов', async () => {
    const { story } = makeStory({}, 5);

    const response = await story.handleCallback(
      `view:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('5');
  });

  test('view: строчка «📚 Курс: Fullstack JS»', async () => {
    const { story } = makeStory({}, 0);

    const response = await story.handleCallback(
      `view:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('📚 Курс: Fullstack JS');
  });

  test('S02: публичные кнопки — Программа, Студенты, Детали, Назад к списку', async () => {
    const { story } = makeStory({ status: 'enrollment' }, 0);

    const response = await story.handleCallback(
      `view:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Программа курса'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Студенты'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Детали'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад к списку'))).toBe(true);
  });

  // TODO(Трек 5): вернуть тест после миграции EnrollStory
  // test('view: на enrollment — кнопка «Записаться»', async () => {
  //   ... getAction<EnrollActions>('start')
  // });

  // TODO(Трек 6): вернуть тест после миграции MonitorStory
  // test('S02: кнопка «👥 Студенты»', async () => {
  //   ... getAction<MonitorActions>('students')
  // });

  test('MENTOR на своём enrollment — НЕ видит lifecycle-кнопок', async () => {
    const { story } = makeStory({ status: 'enrollment' }, 5);

    const response = await story.handleCallback(
      `view:${SAMPLE_ID}`,
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);

    expect(btnTexts.some((t) => t.includes('Детали'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Программа курса'))).toBe(true);
  });

  // ── S03: Программа курса ──

  test('program: показывает contentSnapshot', async () => {
    const streamWithContent = {
      ...sampleStream,
      contentSnapshot: [
        {
          projectTitle: 'Основы',
          lessons: [
            { lessonTitle: 'Введение', lessonId: 'l1', stepIds: ['s1', 's2'] },
            { lessonTitle: 'Переменные', lessonId: 'l2', stepIds: ['s3'] },
          ],
        },
        {
          projectTitle: 'Продвинутый',
          lessons: [
            { lessonTitle: 'Асинхронность', lessonId: 'l3', stepIds: ['s4'] },
          ],
        },
      ],
    };

    const mockAppApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return streamWithContent;
        if (name === 'get-steps-by-lessons') return {};
        return undefined;
      }),
    };

    const mockUiApp = {
      getAction: mock((_name: string) => {
        throw new Error(`Действие «${_name}» не найдено`);
      }),
    };

    const story = new ViewStreamStory();
    story.init(mockAppApi as never, mockUiApp as never);

    const response = await story.handleCallback(
      `program:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Программа курса');
    expect(response.sendMessage?.text).toContain('Основы');
    expect(response.sendMessage?.text).toContain('Введение');
    expect(response.sendMessage?.text).toContain('Переменные');
    expect(response.sendMessage?.text).toContain('Продвинутый');
    expect(response.sendMessage?.text).toContain('Асинхронность');
  });

  test('program: пустой contentSnapshot — заглушка', async () => {
    const streamNoContent = { ...sampleStream, contentSnapshot: [] };

    const mockAppApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return streamNoContent;
        return undefined;
      }),
    };
    const mockUiApp = {
      getAction: mock((_name: string) => {
        throw new Error(`Действие «${_name}» не найдено`);
      }),
    };

    const story = new ViewStreamStory();
    story.init(mockAppApi as never, mockUiApp as never);

    const response = await story.handleCallback(
      `program:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Программа пока не загружена');
  });

  // ── S04: Детали ──

  test('details: показывает заполненные поля', async () => {
    const { story } = makeStory(
      {
        goal: 'Научиться программировать',
        result: 'Свой проект',
        rules: 'Без списывания',
        targetAudience: 'Новички',
        additional: 'Дополнительно',
      },
      1,
    );

    const response = await story.handleCallback(
      `details:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Детали');
    expect(response.sendMessage?.text).toContain('Научиться программировать');
    expect(response.sendMessage?.text).toContain('Свой проект');
    expect(response.sendMessage?.text).toContain('Без списывания');
    expect(response.sendMessage?.text).toContain('Новички');
    expect(response.sendMessage?.text).toContain('Дополнительно');
  });

  test('details: без полей — заглушка', async () => {
    const { story } = makeStory({}, 1);

    const response = await story.handleCallback(
      `details:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Расширенная информация');
  });

  test('details: кнопка «Назад к потоку»', async () => {
    const { story } = makeStory({}, 1);

    const response = await story.handleCallback(
      `details:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });

  // ── Краевые случаи ──

  test('неизвестная команда', async () => {
    const { story } = makeStory({}, 0);

    const response = await story.handleCallback(
      'unknown:cmd',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });

  test('view без streamId — ошибка', async () => {
    const { story } = makeStory({}, 0);

    const response = await story.handleCallback('view', guestActor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });

  test('handleMessage без активного контекста — заглушка', async () => {
    const { story } = makeStory({}, 0);
    const response = await story.handleMessage(
      { type: 'message', text: 'тест', telegramId: 123 },
      guestActor,
      { activeHandler: null },
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестное');
  });

  test('handleStart возвращает null (нет кнопки в главном меню)', async () => {
    const { story } = makeStory({}, 0);
    const item = await story.handleStart(guestActor);
    expect(item).toBeNull();
  });
});
