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
import type { Questionnaire } from '#domain/questionnaire/entity';
import type { Question } from '#domain/questionnaire/question';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import { QuestionnaireJsonRepo } from '#infra/db/questionnaire-json-repo';
import type { OnboardingBotApp } from '../app';
import { OnboardingController } from './onboarding-controller';

let tmpDir: string;

function nextPath(prefix: string): string {
  return join(tmpDir, `${prefix}-${crypto.randomUUID()}.json`);
}

function makeUser(overrides?: Partial<User>): User {
  return {
    uuid: crypto.randomUUID(),
    name: 'Тест',
    telegramId: 1,
    roles: [Role.GUEST],
    createdAt: '2024-01-01T00:00',
    ...overrides,
  };
}

const testPool: Question[] = [
  {
    question: 'Первый вопрос',
    questionCode: 'q1',
    type: 'choice',
    multiple: false,
    answers: [
      { answer: 'Да', answerCode: 'yes' },
      { answer: 'Нет', answerCode: 'no' },
    ],
  },
  {
    question: 'Второй вопрос',
    questionCode: 'q2',
    type: 'text',
  },
];

describe('OnboardingController', () => {
  let db: BaseJsonDb;
  let questionnaireRepo: QuestionnaireJsonRepo;
  let userRepo: UserJsonRepo;
  let mod: OnboardingApiModule;
  let apiApp: OnboardingBotApp;
  let controller: OnboardingController;

  beforeEach(() => {
    tmpDir = mkdtempSync('/tmp/onboarding-controller-test-');
    db = new BaseJsonDb();
    questionnaireRepo = new QuestionnaireJsonRepo(
      nextPath('questionnaires'),
      db,
    );
    userRepo = new UserJsonRepo(nextPath('users'), undefined, db);
    mod = new OnboardingApiModule();
    const poolService = new QuestionPoolService(testPool);
    mod.init({
      questionnaireRepo,
      questionPoolService: poolService,
      includedQuestionCodes: testPool.map((q) => q.questionCode),
      userFacade: {
        getUserByUuid: async (uuid: string) => userRepo.getByUuid(uuid),
        userExists: async (uuid: string) => {
          const u = await userRepo.getByUuid(uuid);
          return u !== undefined;
        },
        addRoleToUser: async (userId: string, role: Role) => {
          const user = await userRepo.getByUuid(userId);
          if (!user) return undefined;
          const updated = {
            ...user,
            roles: user.roles.includes(role)
              ? user.roles
              : [...user.roles, role],
          };
          await userRepo.save(updated);
          return updated;
        },
      },
      db,
    });
    apiApp = new ApiApp<AppMeta>() as OnboardingBotApp;
    apiApp.register(mod);
    controller = new OnboardingController(apiApp, poolService);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('start', () => {
    test('создаёт анкету и возвращает первый вопрос', async () => {
      const user = makeUser();
      await userRepo.save(user);

      const result = await controller.start(user.uuid, user.uuid);

      expect(result.questionnaireUuid).toBeTruthy();
      expect(result.firstQuestion).not.toBeNull();
      expect(result.firstQuestion?.questionCode).toBe('q1');
    });
  });

  describe('submitAnswer', () => {
    test('обрабатывает ответ и возвращает следующий вопрос', async () => {
      const user = makeUser();
      await userRepo.save(user);

      const { questionnaireUuid } = await controller.start(
        user.uuid,
        user.uuid,
      );

      const result = await controller.submitAnswer(
        questionnaireUuid,
        'q1',
        'yes',
        user.uuid,
      );

      expect(result.status).toBe('in_progress');
      expect(result.isCompleted).toBe(false);
      expect(result.nextQuestion?.questionCode).toBe('q2');
    });

    test('завершает анкету и добавляет роль', async () => {
      const user = makeUser();
      await userRepo.save(user);

      const { questionnaireUuid } = await controller.start(
        user.uuid,
        user.uuid,
      );

      await controller.submitAnswer(questionnaireUuid, 'q1', 'yes', user.uuid);
      const result = await controller.submitAnswer(
        questionnaireUuid,
        'q2',
        'hello',
        user.uuid,
      );

      expect(result.status).toBe('completed');
      expect(result.isCompleted).toBe(true);
      expect(result.nextQuestion).toBeNull();

      const updated = await userRepo.getByUuid(user.uuid);
      expect(updated?.roles).toContain(Role.CANDIDATE);
    });
  });

  describe('abandon', () => {
    test('прерывает анкету', async () => {
      const user = makeUser();
      await userRepo.save(user);

      const { questionnaireUuid } = await controller.start(
        user.uuid,
        user.uuid,
      );
      await controller.abandon(questionnaireUuid, user.uuid);

      const result = await apiApp.execute(
        'get-questionnaire',
        { uuid: questionnaireUuid },
        user.uuid,
      );
      expect((result as { status: string }).status).toBe('abandoned');
    });
  });

  describe('getCurrentQuestion', () => {
    test('возвращает текущий вопрос', async () => {
      const user = makeUser();
      await userRepo.save(user);

      const { questionnaireUuid } = await controller.start(
        user.uuid,
        user.uuid,
      );
      const question = await controller.getCurrentQuestion(
        questionnaireUuid,
        user.uuid,
      );

      expect(question?.questionCode).toBe('q1');
    });
  });

  describe('getAnswersPreview', () => {
    test('возвращает предпросмотр ответов', async () => {
      const user = makeUser();
      await userRepo.save(user);

      const { questionnaireUuid } = await controller.start(
        user.uuid,
        user.uuid,
      );
      await controller.submitAnswer(questionnaireUuid, 'q1', 'yes', user.uuid);

      const preview = await controller.getAnswersPreview(
        questionnaireUuid,
        user.uuid,
      );
      expect(preview).toContain('q1');
      expect(preview).toContain('yes');
    });

    test('возвращает сообщение при отсутствии ответов', async () => {
      const user = makeUser();
      await userRepo.save(user);

      const { questionnaireUuid } = await controller.start(
        user.uuid,
        user.uuid,
      );
      const preview = await controller.getAnswersPreview(
        questionnaireUuid,
        user.uuid,
      );
      expect(preview).toBe('Пока нет ответов.');
    });
  });

  describe('canRestart', () => {
    test('возвращает true, если нет активной анкеты', async () => {
      const user = makeUser();
      await userRepo.save(user);

      const canRestart = await controller.canRestart(user.uuid, user.uuid);
      expect(canRestart).toBe(true);
    });

    test('возвращает false, если есть активная анкета', async () => {
      const user = makeUser();
      await userRepo.save(user);

      await controller.start(user.uuid, user.uuid);
      const canRestart = await controller.canRestart(user.uuid, user.uuid);
      expect(canRestart).toBe(false);
    });
  });

  describe('getKeyboard', () => {
    test('строит клавиатуру для choice-вопроса', () => {
      const question: Question = {
        question: 'Тест?',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        answers: [
          { answer: 'Да', answerCode: 'yes' },
          { answer: 'Нет', answerCode: 'no' },
        ],
      };

      const keyboard = controller.getKeyboard(question);

      expect(keyboard).not.toBeNull();
      expect(keyboard?.isMultiple).toBe(false);
      expect(keyboard?.rows).toHaveLength(2);
      expect(keyboard?.rows[0]?.[0]?.code).toBe('yes');
    });

    test('добавляет галочки для выбранных значений', () => {
      const question: Question = {
        question: 'Тест?',
        questionCode: 'q1',
        type: 'choice',
        multiple: true,
        answers: [
          { answer: 'A', answerCode: 'a' },
          { answer: 'B', answerCode: 'b' },
        ],
      };

      const keyboard = controller.getKeyboard(question, ['a']);

      expect(keyboard?.rows[0]?.[0]?.text).toBe('✅ A');
      expect(keyboard?.rows[1]?.[0]?.text).toBe('B');
    });

    test('возвращает null для text-вопроса', () => {
      const question: Question = {
        question: 'Тест?',
        questionCode: 'q1',
        type: 'text',
      };

      const keyboard = controller.getKeyboard(question);
      expect(keyboard).toBeNull();
    });
  });

  describe('getStartFlow', () => {
    test("возвращает 'candidate' если есть роль CANDIDATE", () => {
      const user = makeUser({ roles: [Role.GUEST, Role.CANDIDATE] });
      const flow = controller.getStartFlow(user, []);
      expect(flow).toBe('candidate');
    });

    test("возвращает 'candidate' если есть CANDIDATE и SUBSCRIBER", () => {
      const user = makeUser({
        roles: [Role.GUEST, Role.SUBSCRIBER, Role.CANDIDATE],
      });
      const flow = controller.getStartFlow(user, []);
      expect(flow).toBe('candidate');
    });

    test("возвращает 'subscriber' если есть SUBSCRIBER, но нет CANDIDATE", () => {
      const user = makeUser({ roles: [Role.GUEST, Role.SUBSCRIBER] });
      const flow = controller.getStartFlow(user, []);
      expect(flow).toBe('subscriber');
    });

    test("возвращает 'guest' если только GUEST", () => {
      const user = makeUser({ roles: [Role.GUEST] });
      const flow = controller.getStartFlow(user, []);
      expect(flow).toBe('guest');
    });
  });

  describe('restartQuestionnaire', () => {
    test('создаёт новую анкету, если нет активной', async () => {
      const user = makeUser();
      await userRepo.save(user);

      const result = await controller.restartQuestionnaire(
        user.uuid,
        user.uuid,
      );

      expect(result.questionnaireUuid).toBeTruthy();
      expect(result.firstQuestion).not.toBeNull();
    });

    test('пробрасывает ошибку QUESTIONNAIRE_ACTIVE при активной анкете', async () => {
      const user = makeUser();
      await userRepo.save(user);

      await controller.start(user.uuid, user.uuid);

      await expect(
        controller.restartQuestionnaire(user.uuid, user.uuid),
      ).rejects.toThrow('У пользователя уже есть активная анкета');
    });
  });
});
