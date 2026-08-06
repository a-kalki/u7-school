import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModule } from 'packages/stream/src/api';
import { ViewStreamMentorStory } from './view-stream-mentor.story';

describe('ViewStreamMentorStory', () => {
  const session: SessionData = { activeHandler: null };
  const mentorActor: User = {
    uuid: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
    name: 'Алексей Смирнов',
    telegramId: 999,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const otherMentorActor: User = {
    uuid: 'o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o',
    name: 'Другой Ментор',
    telegramId: 888,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const adminActor: User = {
    uuid: 'admin-1',
    name: 'Админ',
    telegramId: 777,
    roles: [Role.ADMIN],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const sampleStream = {
    uuid: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
    title: 'Python Advanced',
    description: 'Продвинутый курс',
    moduleId: 'mod-1',
    status: 'enrollment',
    startDate: '2026-06-01T00:00:00.000Z',
    mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
  };

  function makeMentorStory(
    stream: Record<string, unknown>,
    studentCount = 0,
    mentorName = 'Алексей Смирнов',
  ) {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return stream;
        if (name === 'list-stream-students')
          return Array.from({ length: studentCount }, (_, i) => ({
            uuid: `student-${i}`,
          }));
        if (name === 'complete-stream') return undefined;
        if (name === 'archive-stream') return undefined;
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user')
          return {
            uuid: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
            name: mentorName,
            roles: [Role.MENTOR],
          };
        if (name === 'get-steps-by-lessons') return {};
        return undefined;
      }),
    } as unknown as U7BotApp;
    const story = new ViewStreamMentorStory();
    story.init(moduleApi, appApi);
    return { story, moduleApi, appApi };
  }

  // ── handleStart ──

  // ═══════════════════════════════════════════════════
  // S02m — карточка потока (view)
  // ═══════════════════════════════════════════════════

  test('view показывает карточку с названием и описанием', async () => {
    const { story } = makeMentorStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Python Advanced');
    expect(response.sendMessage?.text).toContain('Продвинутый курс');
  });

  test('view показывает имя ментора', async () => {
    const { story } = makeMentorStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Алексей Смирнов');
  });

  test('view показывает количество студентов', async () => {
    const { story } = makeMentorStory(sampleStream, 5);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    expect(response.sendMessage?.text).toContain('5');
  });

  // ── Публичные кнопки в S02m ──

  test('view — есть публичные кнопки: Программа, Детали, Студенты', async () => {
    const { story } = makeMentorStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Программа курса'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Детали'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Студенты'))).toBe(true);
  });

  // ── Lifecycle-кнопки: enrollment → «Запустить» ──

  test('enrollment → кнопка «🚀 Запустить» есть', async () => {
    const { story } = makeMentorStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(true);
  });

  test('enrollment — НЕТ кнопок «Завершить» и «В архив»', async () => {
    const { story } = makeMentorStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);
  });

  // ── Lifecycle-кнопки: active → «Завершить» ──

  test('active → кнопка «✅ Завершить» есть', async () => {
    const { story } = makeMentorStory({ ...sampleStream, status: 'active' }, 8);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(true);
  });

  test('active — НЕТ кнопок «Запустить» и «В архив»', async () => {
    const { story } = makeMentorStory({ ...sampleStream, status: 'active' }, 3);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);
  });

  // ── Lifecycle-кнопки: completed → «В архив» ──

  test('completed → кнопка «📁 В архив» есть', async () => {
    const { story } = makeMentorStory(
      { ...sampleStream, status: 'completed' },
      10,
    );

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(true);
  });

  test('completed — НЕТ кнопок «Запустить» и «Завершить»', async () => {
    const { story } = makeMentorStory(
      { ...sampleStream, status: 'completed' },
      2,
    );

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
  });

  // ── Archived — нет lifecycle-кнопок ──

  test('archived — НЕТ lifecycle-кнопок', async () => {
    const { story } = makeMentorStory(
      { ...sampleStream, status: 'archived' },
      0,
    );

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);
  });

  // ── Чужой поток — нет lifecycle-кнопок ──

  test('другой ментор на чужом потоке — НЕТ lifecycle-кнопок', async () => {
    const { story } = makeMentorStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      otherMentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);
  });

  // ── ADMIN видит lifecycle-кнопки на чужих потоках ──

  test('ADMIN на чужом потоке — видит lifecycle-кнопки', async () => {
    const { story } = makeMentorStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      adminActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(true);
  });

  // ── Кнопка «Назад» → mentor-tools:my-streams ──

  test('кнопка «Назад» ведёт на mentor-tools:my-streams (не catalog:list)', async () => {
    const { story } = makeMentorStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const allCodes =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.code) ?? [];

    expect(allCodes.some((c) => c.includes('mentor-tools:my-streams'))).toBe(
      true,
    );
    expect(allCodes.some((c) => c === 'catalog:list')).toBe(false);
  });

  // ═══════════════════════════════════════════════════
  // Программа (program) в S02m
  // ═══════════════════════════════════════════════════

  test('program показывает contentSnapshot', async () => {
    const streamWithContent = {
      ...sampleStream,
      contentSnapshot: [
        {
          projectTitle: 'Основы',
          lessons: [{ lessonTitle: 'Введение', stepIds: ['s1', 's2'] }],
        },
      ],
    };
    const { story } = makeMentorStory(streamWithContent, 0);

    const response = await story.handleCallback(
      'program:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Программа курса');
    expect(response.sendMessage?.text).toContain('Основы');
    expect(response.sendMessage?.text).toContain('Введение');
  });

  test('program без контента — показывает заглушку', async () => {
    const { story } = makeMentorStory(sampleStream, 0);

    const response = await story.handleCallback(
      'program:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Программа');
  });

  test('program — кнопка «Назад к потоку» возвращает в S02m', async () => {
    const { story } = makeMentorStory(sampleStream, 0);

    const response = await story.handleCallback(
      'program:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const btnCodes =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.code) ?? [];

    expect(
      btnCodes.some((c) =>
        c.includes('view-stream-mentor:view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s'),
      ),
    ).toBe(true);
  });

  // ═══════════════════════════════════════════════════
  // Детали (details) в S02m
  // ═══════════════════════════════════════════════════

  test('details показывает заполненные поля', async () => {
    const { story } = makeMentorStory(
      {
        ...sampleStream,
        goal: 'Научиться',
        result: 'Проект',
      },
      0,
    );

    const response = await story.handleCallback(
      'details:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Детали');
    expect(response.sendMessage?.text).toContain('Научиться');
    expect(response.sendMessage?.text).toContain('Проект');
  });

  test('details без полей — показывает заглушку', async () => {
    const { story } = makeMentorStory(sampleStream, 0);

    const response = await story.handleCallback(
      'details:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Расширенная информация');
  });

  // ═══════════════════════════════════════════════════
  // Lifecycle-действия (complete / archive)
  // ═══════════════════════════════════════════════════

  test('кнопка «Завершить» показывает подтверждение', async () => {
    const { story, moduleApi } = makeMentorStory({
      ...sampleStream,
      status: 'active',
    });

    const response = await story.handleCallback(
      'complete:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );

    expect(moduleApi.execute).not.toHaveBeenCalledWith(
      'complete-stream',
      expect.anything(),
      expect.anything(),
    );

    expect(response.sendMessage?.text).toContain('Завершить поток');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Да, завершить'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Отмена'))).toBe(true);
  });

  test('подтверждение «Завершить» вызывает complete-stream', async () => {
    const { story, moduleApi } = makeMentorStory({
      ...sampleStream,
      status: 'active',
    });

    const response = await story.handleCallback(
      'complete-confirm:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );

    expect(moduleApi.execute).toHaveBeenCalledWith(
      'complete-stream',
      { streamId: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s' },
      mentorActor.uuid,
    );

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(rows.length).toBe(1);
    expect(rows[0]![0]!.text).toBe('⬅️ Назад к списку');
    expect(rows[0]![0]!.code).toBe('mentor-tools:my-streams');
  });

  test('кнопка «В архив» показывает подтверждение', async () => {
    const { story, moduleApi } = makeMentorStory(sampleStream);

    const response = await story.handleCallback(
      'archive:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );

    expect(moduleApi.execute).not.toHaveBeenCalledWith(
      'archive-stream',
      expect.anything(),
      expect.anything(),
    );

    expect(response.sendMessage?.text).toContain('архив');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Да, в архив'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Отмена'))).toBe(true);
  });

  test('подтверждение «В архив» вызывает archive-stream', async () => {
    const { story, moduleApi } = makeMentorStory(sampleStream);

    const response = await story.handleCallback(
      'archive-confirm:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );

    expect(moduleApi.execute).toHaveBeenCalledWith(
      'archive-stream',
      { streamId: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s' },
      mentorActor.uuid,
    );

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(rows.length).toBe(1);
    expect(rows[0]![0]!.text).toBe('⬅️ Назад к списку');
    expect(rows[0]![0]!.code).toBe('mentor-tools:my-streams');
  });

  // ── handleMessage ──

  test('handleMessage отдаёт сообщение с подсказкой', async () => {
    const { story } = makeMentorStory(sampleStream);
    const response = await story.handleMessage();
    expect(response.sendMessage?.text).toContain('Неизвестное сообщение');
  });

  // ── Неизвестный action ──

  test('неизвестный callback action возвращает ошибку', async () => {
    const { story } = makeMentorStory(sampleStream);
    const response = await story.handleCallback(
      'unknown-action',
      mentorActor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестная команда');
  });
});
