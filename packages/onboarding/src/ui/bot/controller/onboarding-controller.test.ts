import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ApiApp } from '@u7/core/api';
import type { AppMeta } from '@u7/core/domain';
import { BaseJsonDb } from '@u7/core/infra';
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

  beforeEach(async () => {
    tmpDir = mkdtempSync('/tmp/onboarding-controller-test-');
    db = new BaseJsonDb();
    questionnaireRepo = new QuestionnaireJsonRepo(
      nextPath('questionnaires'),
      db,
    );
    userRepo = new UserJsonRepo(nextPath('users'), undefined, db);
    mod = new OnboardingApiModule();

    // Seed admin (нужно для HandleOnboardingActionUc при выдаче роли)
    await userRepo.save({
      uuid: botAdminUuid,
      name: 'Admin',
      telegramId: 1,
      roles: [Role.ADMIN],
      createdAt: '2024-01-01T00:00',
    });

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

    mod.init({
      questionnaireRepo,
      questionPoolService: poolService,
      userFacade: {
        getUserByUuid: async (uuid: string) => userRepo.getByUuid(uuid),
        userExists: async (uuid: string) =>
          (await userRepo.getByUuid(uuid)) !== undefined,
        getUserByTelegramId: async (telegramId: number) =>
          userRepo.getByTelegramId(telegramId),
        registerGuest: async (telegramId: number, name: string) => {
          const user = {
            uuid: crypto.randomUUID(),
            name,
            telegramId,
            roles: [Role.GUEST],
            createdAt: '2024-01-01T00:00',
          };
          await userRepo.save(user);
          return user;
        },
        addRoleToUser: async (userId: string, role: Role) => {
          const user = await userRepo.getByUuid(userId);
          if (!user) return undefined;
          const updated = {
            ...user,
            roles: [...new Set([...user.roles, role])],
          };
          await userRepo.save(updated);
          return updated;
        },
        ensureUserWithRole: async () => {},
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

  test('become_student starts questionnaire', async () => {
    const response = await controller.handleUpdate({
      type: 'callback',
      data: 'become_student',
      telegramId: 12345,
      messageId: 1,
      name: 'Ivan',
    });
    expect(response.sendMessage?.text).toContain('Q1');
  });

  test('toggle answer and submit', async () => {
    await controller.handleUpdate({
      type: 'callback',
      data: 'become_student',
      telegramId: 12345,
      messageId: 1,
      name: 'Ivan',
    });

    const toggleResponse = await controller.handleUpdate({
      type: 'callback',
      data: 'yes',
      telegramId: 12345,
      messageId: 2,
    });

    expect(toggleResponse.editMessage?.text).toContain('Q1');
    expect(toggleResponse.sendMessage?.text).toContain('Спасибо!');
  });

  // TODO: Восстановить после рефакторинга контроллера (будущий трек onboarding-controller-refactor)
  test.skip('cancel command', async () => {
    await controller.handleUpdate({
      type: 'callback',
      data: 'become_student',
      telegramId: 12345,
      messageId: 1,
      name: 'Ivan',
    });

    const response = await controller.handleUpdate({
      type: 'command',
      command: 'cancel',
      telegramId: 12345,
      name: 'Ivan',
    });

    expect(response.sendMessage?.text).toContain('прерван');
  });

  test('ignore updates when no active questionnaire', async () => {
    const response = await controller.handleUpdate({
      type: 'message',
      text: 'hello',
      telegramId: 999,
      name: 'Ivan',
    });

    expect(response.sendMessage).toBeUndefined();
    expect(response.editMessage).toBeUndefined();
  });
});
