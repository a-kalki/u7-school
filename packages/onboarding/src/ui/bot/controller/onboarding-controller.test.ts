import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ApiApp } from '@u7/core/api';
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
    const poolService = new QuestionPoolService(
      [
        {
          question: 'Первый вопрос',
          questionCode: 'q1',
          type: 'choice',
          multiple: false,
          answers: [{ answer: 'Да', answerCode: 'yes' }],
        },
      ],
      ['q1'],
    );

    mod = new OnboardingApiModule({
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
      },
      db,
    });

    // Seed admin после инициализации модуля
    await userRepo.save({
      uuid: botAdminUuid,
      name: 'Admin',
      telegramId: 1,
      roles: [Role.ADMIN],
      createdAt: '2024-01-01T00:00',
    });

    apiApp = new ApiApp([mod]) as OnboardingBotApp;
    controller = new OnboardingController(apiApp);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('команда start начинает новую анкету', async () => {
    const response = await controller.handleUpdate(
      {
        type: 'command',
        command: 'start',
        telegramId: 12345,
        name: 'Иван',
      },
      botAdminUuid,
    );

    expect(response.sendMessage?.text).toContain('Первый вопрос');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  test('команда start продолжает активную анкету', async () => {
    // Начинаем анкету
    await controller.handleUpdate(
      {
        type: 'command',
        command: 'start',
        telegramId: 12345,
        name: 'Иван',
      },
      botAdminUuid,
    );

    // Повторный вызов — должен вернуть текущий вопрос
    const response = await controller.handleUpdate(
      {
        type: 'command',
        command: 'start',
        telegramId: 12345,
        name: 'Иван',
      },
      botAdminUuid,
    );

    expect(response.sendMessage?.text).toContain('Первый вопрос');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  test('ответ на вопрос завершает анкету', async () => {
    // Начинаем анкету
    await controller.handleUpdate(
      {
        type: 'command',
        command: 'start',
        telegramId: 12345,
        name: 'Иван',
      },
      botAdminUuid,
    );

    // Отвечаем на вопрос (callback)
    const response = await controller.handleUpdate(
      {
        type: 'callback',
        data: 'yes',
        telegramId: 12345,
        messageId: 1,
      },
      botAdminUuid,
    );

    expect(response.sendMessage?.text).toContain('Спасибо');
    expect(response.questionnaireCompleted).toBe(true);
  });

  test('команда cancel прерывает анкету', async () => {
    // Начинаем анкету
    await controller.handleUpdate(
      {
        type: 'command',
        command: 'start',
        telegramId: 12345,
        name: 'Иван',
      },
      botAdminUuid,
    );

    // Прерываем
    const response = await controller.handleUpdate(
      {
        type: 'command',
        command: 'cancel',
        telegramId: 12345,
        name: 'Иван',
      },
      botAdminUuid,
    );

    expect(response.sendMessage?.text).toContain('прервана');
    expect(response.questionnaireCompleted).toBe(true);
  });

  test('сообщение без активной анкеты возвращает ошибку', async () => {
    const response = await controller.handleUpdate(
      {
        type: 'message',
        text: 'привет',
        telegramId: 999,
        name: 'Иван',
      },
      botAdminUuid,
    );

    expect(response.sendMessage?.text).toContain('Ошибка');
  });
});
