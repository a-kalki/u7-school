import { describe, expect, test } from 'bun:test';
import { BaseJsonDb } from '@u7/core/infra';
import type { UserFacade } from '@u7/user/domain';
import { QuestionnaireJsonRepo } from '#infra/db/questionnaire-json-repo';
import { OnboardingApiModule } from './module';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';

function setupModule() {
  const db = new BaseJsonDb();
  const repo = new QuestionnaireJsonRepo('/tmp/onboarding-test.json', db);
  const poolService = new QuestionPoolService([
    {
      question: 'Q1',
      questionCode: 'q1',
      type: 'choice',
      multiple: false,
      answers: [{ answer: 'Yes', answerCode: 'yes' }],
    },
  ]);

  const userFacade = {
    ensureUserWithRole: async () => {},
  } as unknown as UserFacade;

  const module = new OnboardingApiModule();
  module.init({
    questionnaireRepo: repo,
    questionPoolService: poolService,
    includedQuestionCodes: ['q1'],
    userFacade,
    db,
  });

  return { module, repo, db };
}

describe('OnboardingApiModule', () => {
  test('start-questionnaire: создаёт анкету', async () => {
    const { module, db } = setupModule();
    db.begin();

    const result = await module.handle({
      name: 'start-questionnaire',
      attrs: { telegramId: 12345 },
    }) as any;

    expect(result.telegramId).toBe(12345);
    expect(result.status).toBe('in_progress');

    db.rollback();
  });

  test('submit-answer: обрабатывает ответ и завершает анкету', async () => {
    const { module, db } = setupModule();
    db.begin();

    const startResult = await module.handle({
      name: 'start-questionnaire',
      attrs: { telegramId: 12345 },
    }) as any;

    const submitResult = await module.handle({
      name: 'submit-answer',
      attrs: {
        questionnaireUuid: startResult.uuid,
        questionCode: 'q1',
        value: 'yes',
      },
    }) as any;

    expect(submitResult.status).toBe('completed');

    db.rollback();
  });

  test('get-questionnaire: возвращает анкету', async () => {
    const { module, db } = setupModule();
    db.begin();

    const startResult = await module.handle({
      name: 'start-questionnaire',
      attrs: { telegramId: 12345 },
    }) as any;

    const getResult = await module.handle({
      name: 'get-questionnaire',
      attrs: { uuid: startResult.uuid },
    }) as any;

    expect(getResult.uuid).toBe(startResult.uuid);

    db.rollback();
  });

  test('abandon-questionnaire: прерывает анкету', async () => {
    const { module, db } = setupModule();
    db.begin();

    const startResult = await module.handle({
      name: 'start-questionnaire',
      attrs: { telegramId: 12345 },
    }) as any;

    const abandonResult = await module.handle({
      name: 'abandon-questionnaire',
      attrs: { uuid: startResult.uuid },
    }) as any;

    expect(abandonResult.status).toBe('abandoned');

    db.rollback();
  });
});
