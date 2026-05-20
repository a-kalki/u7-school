import { describe, expect, test } from 'bun:test';
import { BaseJsonDb } from '@u7-scl/core/infra';
import type { UserFacade } from '@u7-scl/user/domain';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import { QuestionnaireJsonRepo } from '#infra/db/questionnaire-json-repo';
import { OnboardingApiModule } from './module';

function setupModule(dbPath: string) {
  const db = new BaseJsonDb();
  const repo = new QuestionnaireJsonRepo(dbPath, db);
  const botAdminUuid = '00000000-0000-0000-0000-000000000000';
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

  const userFacade = {
    getUserByUuid: async () => ({ uuid: 'admin-uuid', roles: ['ADMIN'] }),
    getUserByTelegramId: async () => ({ uuid: 'user-uuid', roles: ['GUEST'] }),
    addRoleToUser: async () => {},
    ensureUserWithRole: async () => {},
  } as unknown as UserFacade;

  const module = new OnboardingApiModule({
    questionnaireRepo: repo,
    questionPoolService: poolService,
    userFacade,
    db,
  });

  return { module, repo, db };
}

describe('OnboardingApiModule', () => {
  test('start: создаёт анкету', async () => {
    const { module, db } = setupModule('/tmp/onboarding-test-1.json');
    db.begin();

    const result = (await module.handle({
      name: 'start',
      attrs: { telegramId: 10001 },
    })) as any;

    expect(result.type).toBe('new_question');
    expect(result.question.questionCode).toBe('q1');

    db.rollback();
  });

  test('handle-action: обрабатывает ответ и завершает анкету', async () => {
    const { module, db } = setupModule('/tmp/onboarding-test-2.json');
    db.begin();

    await module.handle({
      name: 'start',
      attrs: { telegramId: 10002 },
    });

    const result = (await module.handle({
      name: 'handle-action',
      attrs: { telegramId: 10002, type: 'callback', value: 'yes' },
    })) as any;

    expect(result.type).toBe('completed');

    db.rollback();
  });

  test('abandon: прерывает анкету по telegramId', async () => {
    const { module, db } = setupModule('/tmp/onboarding-test-4.json');
    db.begin();

    await module.handle({
      name: 'start',
      attrs: { telegramId: 10004 },
    });

    const abandonResult = (await module.handle({
      name: 'abandon',
      attrs: { telegramId: 10004 },
    })) as any;

    expect(abandonResult.type).toBe('completed');

    db.rollback();
  });
});
