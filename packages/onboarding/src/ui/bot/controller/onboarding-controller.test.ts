import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ApiApp } from '@u7/core/api';
import type { AppMeta } from '@u7/core/domain';
import { BaseJsonDb } from '@u7/core/infra';
import type { User } from '@u7/user/domain';
import { Role } from '@u7/user/domain';
import { UserJsonRepo } from '@u7/user/infra';
import { OnboardingApiModule } from '#api/module';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import { QuestionnaireJsonRepo } from '#infra/db/questionnaire-json-repo';
import type { OnboardingBotApp } from '../app';
import { OnboardingController } from './onboarding-controller';

let tmpDir: string;

function nextPath(prefix: string): string {
  return join(tmpDir, `${prefix}-${crypto.randomUUID()}.json`);
}

describe('OnboardingController', () => {
  let db: BaseJsonDb;
  let questionnaireRepo: QuestionnaireJsonRepo;
  let userRepo: UserJsonRepo;
  let mod: OnboardingApiModule;
  let apiApp: OnboardingBotApp;
  let controller: OnboardingController;
  const botAdminUuid = crypto.randomUUID();

  beforeEach(() => {
    tmpDir = mkdtempSync('/tmp/onboarding-controller-test-');
    db = new BaseJsonDb();
    questionnaireRepo = new QuestionnaireJsonRepo(nextPath('questionnaires'), db);
    userRepo = new UserJsonRepo(nextPath('users'), undefined, db);
    mod = new OnboardingApiModule();
    const poolService = new QuestionPoolService([
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'Yes', answerCode: 'yes' }],
      },
    ]);
    mod.init({
      questionnaireRepo,
      questionPoolService: poolService,
      includedQuestionCodes: ['q1'],
      userFacade: {
        getUserByUuid: async (uuid: string) => userRepo.getByUuid(uuid),
        userExists: async (uuid: string) => (await userRepo.getByUuid(uuid)) !== undefined,
        ensureUserWithRole: async (telegramId: number, role: Role) => {
           const existing = await userRepo.getByTelegramId(telegramId);
           if (existing) {
             if (!existing.roles.includes(role)) {
               await userRepo.save({ ...existing, roles: [...existing.roles, role] });
             }
           } else {
             await userRepo.save({
               uuid: crypto.randomUUID(),
               name: 'Guest',
               telegramId,
               roles: [role],
               createdAt: '2024-01-01T00:00',
             });
           }
        },
        addRoleToUser: async (userId: string, role: Role) => {
          const user = await userRepo.getByUuid(userId);
          if (!user) return undefined;
          const updated = { ...user, roles: [...new Set([...user.roles, role])] };
          await userRepo.save(updated);
          return updated;
        }
      },
      db,
    });
    apiApp = new ApiApp<AppMeta>() as OnboardingBotApp;
    apiApp.register(mod);
    controller = new OnboardingController(apiApp, botAdminUuid);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('handleUpdate: become_student starts questionnaire', async () => {
    const responses = await controller.handleUpdate({
      type: 'callback',
      data: 'become_student',
      telegramId: 12345,
      messageId: 1,
    });

    expect(responses).toContainEqual({ type: 'answerCallback' });
    expect(responses).toContainEqual(expect.objectContaining({
      type: 'sendMessage',
      text: expect.stringContaining('Q1'),
    }));
  });

  test('handleUpdate: toggle answer and submit', async () => {
    // Start
    await controller.handleUpdate({
      type: 'callback',
      data: 'become_student',
      telegramId: 12345,
      messageId: 1,
    });

    // Toggle (should auto-submit for single choice)
    const toggleResponses = await controller.handleUpdate({
      type: 'callback',
      data: 'yes',
      telegramId: 12345,
      messageId: 2,
    });

    expect(toggleResponses).toContainEqual(expect.objectContaining({
      type: 'sendMessage',
      text: expect.stringContaining('Спасибо!'),
    }));
  });
});
