import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { QuestionnaireInProcFacade } from './facade';
import type { QuestionnairePool } from './questionnaire/question';

function simplePool(): QuestionnairePool {
  return {
    questions: [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice' as const,
        multiple: false,
        answers: [{ answer: 'A', answerCode: 'a' }],
      },
    ],
  };
}

function mockUser(): User {
  return {
    uuid: 'test-uuid',
    name: 'Test',
    telegramId: 123,
    roles: [],
    createdAt: '2024-01-01T00:00:00.000Z',
  } as User;
}

describe('QuestionnaireInProcFacade', () => {
  test('sendInvite делегирует в module.execute("send-invite", ...)', async () => {
    const calls: Array<[string, any, any]> = [];
    const module = {
      execute: async (name: string, input: any, actor: any) => {
        calls.push([name, input, actor]);
      },
    } as any;
    const facade = new QuestionnaireInProcFacade(module);

    const user = mockUser();
    const pool = simplePool();

    await facade.sendInvite(user, pool);

    expect(calls.length).toBe(1);
    expect(calls[0]?.[0]).toBe('send-invite');
    expect(calls[0]?.[1]).toEqual({ user, pool });
  });

  test('start делегирует в module.execute("start", ...)', async () => {
    const calls: Array<[string, any, any]> = [];
    const module = {
      execute: async (name: string, input: any, actor: any) => {
        calls.push([name, input, actor]);
      },
    } as any;
    const facade = new QuestionnaireInProcFacade(module);

    const user = mockUser();
    const pool = simplePool();

    await facade.start(user, pool);

    expect(calls.length).toBe(1);
    expect(calls[0]?.[0]).toBe('start');
    expect(calls[0]?.[1]).toEqual({ user, pool });
  });
});
