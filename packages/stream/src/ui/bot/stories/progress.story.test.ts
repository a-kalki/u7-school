import { describe, expect, mock, test } from 'bun:test';
import type { ApiApp } from '@u7-scl/core/api';
import type { SessionData } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';
import { ProgressStory } from './progress.story';

describe('ProgressStory', () => {
  const session: SessionData = { activeHandler: null };
  const actor = { uuid: 'user-1', roles: ['STUDENT'] };

  test('handleCallback("progress:<streamId>") показывает прогресс-бар', async () => {
    const mockApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user')
          return {
            uuid: 'st1',
            streamId: 's1',
            userId: 'user-1',
            status: 'active',
            currentStepId: 'step-3',
            steps: [
              { stepId: 'step-1', status: 'completed' },
              { stepId: 'step-2', status: 'completed' },
              { stepId: 'step-3', status: 'issued' },
            ],
          };
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Python',
            status: 'active',
            startDate: '',
            contentSnapshot: [
              {
                projectTitle: 'Основы',
                lessons: [
                  { lessonTitle: 'Введение', stepIds: ['step-1', 'step-2'] },
                  { lessonTitle: 'Продвинутый', stepIds: ['step-3', 'step-4'] },
                ],
              },
            ],
          };
        return undefined;
      }),
    } as unknown as ApiApp<StreamAppMeta>;

    const story = new ProgressStory();
    story.init(mockApi);
    const response = await story.handleCallback('progress:s1', actor, session);

    expect(response.sendMessage?.text).toContain('Прогресс');
    expect(response.sendMessage?.text).toContain('50');
  });

  test('handleStart возвращает null', async () => {
    const story = new ProgressStory();
    const item = await story.handleStart(actor);
    expect(item).toBeNull();
  });
});
