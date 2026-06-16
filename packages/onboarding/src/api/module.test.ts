import { describe, expect, test } from 'bun:test';
import { BaseJsonDb } from '@u7-scl/core/infra';
import type { UserFacade } from '@u7-scl/user/domain';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import { QuestionnaireJsonRepo } from '#infra/db/questionnaire-json-repo';
import { OnboardingApiModule } from './module';

const appResolver = { logger: console, mode: 'test' as const };

const mockUserFacade = {
  getUserByUuid: async () => ({ uuid: 'admin-uuid', roles: ['ADMIN'] }),
  getUserByTelegramId: async () => ({ uuid: 'user-uuid', roles: ['GUEST'] }),
  addRoleToUser: async () => {},
  userExists: async () => true,
  registerGuest: async () => ({ uuid: 'guest-uuid', roles: ['GUEST'] }),
  updateUserRole: async () => {},
  removeRoleFromUser: async () => {},
} as unknown as UserFacade;

function setupModule(dbPath: string) {
  const db = new BaseJsonDb();
  const repo = new QuestionnaireJsonRepo(dbPath, db);
  const poolService = new QuestionPoolService(
    [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'Yes', answerCode: 'yes' }],
      },
    ],
    ['q1'],
  );

  const module = new OnboardingApiModule({
    questionnaireRepo: repo,
    questionPoolService: poolService,
    userFacade: mockUserFacade,
    db,
    appResolver,
  });

  return { module, repo, db };
}

describe('OnboardingApiModule', () => {
  test('start: создаёт анкету', async () => {
    const { module, db } = setupModule('/tmp/onboarding-test-1.json');
    db.begin();

    const result = (await module.execute('start', {
      telegramId: 10001,
    })) as any;

    expect(result.type).toBe('new_question');
    expect(result.question.questionCode).toBe('q1');

    db.rollback();
  });

  test('handle-action: обрабатывает ответ и завершает анкету', async () => {
    const { module, db } = setupModule('/tmp/onboarding-test-2.json');
    db.begin();

    await module.execute('start', { telegramId: 10002 });

    const result = (await module.execute('handle-action', {
      telegramId: 10002,
      type: 'callback',
      value: 'yes',
    })) as any;

    expect(result.type).toBe('completed');

    db.rollback();
  });

  test('abandon: прерывает анкету по telegramId', async () => {
    const { module, db } = setupModule('/tmp/onboarding-test-4.json');
    db.begin();

    await module.execute('start', { telegramId: 10004 });

    const abandonResult = (await module.execute('abandon', {
      telegramId: 10004,
    })) as any;

    expect(abandonResult.type).toBe('completed');

    db.rollback();
  });
});
