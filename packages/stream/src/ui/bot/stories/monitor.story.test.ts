import { describe, expect, mock, test } from 'bun:test';
import type { SessionData } from '@u7-scl/core/ui';
import type { User } from '@u7-scl/app/domain';
import { MonitorStory } from './monitor.story';

describe('MonitorStory', () => {
  const actor: User = {
    uuid: 'mentor-1',
    name: 'Ментор',
    telegramId: 123,
    roles: ['MENTOR'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const session: SessionData = { activeHandler: null };

  test('handleCallback("students:<id>") показывает список с прогрессом', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'list-stream-students')
          return [
            {
              uuid: 'st1',
              userId: 'user-1',
              status: 'active',
              steps: [
                { stepId: 'step-1', status: 'completed' },
                { stepId: 'step-2', status: 'completed' },
              ],
            },
          ];
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            contentSnapshot: [
              {
                projectTitle: 'P1',
                lessons: [
                  {
                    lessonTitle: 'L1',
                    stepIds: ['step-1', 'step-2', 'step-3', 'step-4'],
                  },
                ],
              },
            ],
          };
        return undefined;
      }),
    };
    const appApi = { execute: mock(() => undefined) };

    const story = new MonitorStory();
    story.init(moduleApi as any, appApi as any);
    const response = await story.handleCallback('students:s1', actor, session);

    expect(response.sendMessage?.text).toContain('Студенты');
    expect(response.sendMessage?.text).toContain('50');
  });

  test('handleStart возвращает null', async () => {
    const story = new MonitorStory();
    expect(await story.handleStart(actor)).toBeNull();
  });
});
