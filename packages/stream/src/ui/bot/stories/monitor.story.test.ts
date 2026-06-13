import { describe, expect, mock, test } from 'bun:test';
import type { ApiApp } from '@u7-scl/core/api';
import type { SessionData } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';
import { MonitorStory } from './monitor.story';

describe('MonitorStory', () => {
  const actor = { uuid: 'mentor-1', roles: ['MENTOR'] };
  const session: SessionData = { activeHandler: null };

  test('handleCallback("students:<id>") показывает список с прогрессом', async () => {
    const mockApi = {
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
    } as unknown as ApiApp<StreamAppMeta>;

    const story = new MonitorStory();
    story.init(mockApi);
    const response = await story.handleCallback('students:s1', actor, session);

    expect(response.sendMessage?.text).toContain('Студенты');
    expect(response.sendMessage?.text).toContain('50');
  });

  test('handleStart возвращает null', async () => {
    const story = new MonitorStory();
    expect(await story.handleStart(actor)).toBeNull();
  });
});
