import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModule } from 'packages/stream/src/api';
import { ViewStreamMentorStory } from './view-stream-mentor.story';

/**
 * Тесты ViewStreamMentorStory (трек mentor_tools_20260713).
 *
 * ⚠️ ВРЕМЕННО ОТКЛЮЧЕНЫ — `describe.skip`.
 *
 * Чтобы активировать в треке mentor_tools_20260713:
 * 1. Заменить `describe.skip` на `describe`
 * 2. Зарегистрировать ViewStreamMentorStory в MentorController
 * 3. Добавить менторские кнопки («Запустить»/«Завершить»/«В архив») в S02m
 * 4. Убедиться что тесты проходят
 */
describe.skip('ViewStreamMentorStory (трек mentor_tools_20260713)', () => {
  const session: SessionData = { activeHandler: null };
  const mentorActor: User = {
    uuid: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
    name: 'Алексей Смирнов',
    telegramId: 999,
    roles: [Role.MENTOR],
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

  const makeMentorStory = (
    stream: Record<string, unknown>,
  ) => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return stream;
        if (name === 'complete-stream') return undefined;
        if (name === 'archive-stream') return undefined;
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock(() => undefined),
    } as any;
    const story = new ViewStreamMentorStory();
    story.init(moduleApi, appApi);
    return { story, moduleApi };
  };

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

    // Не должен вызывать complete-stream — только показ подтверждения
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
    expect(rows[0]![0]!.code).toBe('catalog:list');
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
    expect(rows[0]![0]!.code).toBe('catalog:list');
  });
});
