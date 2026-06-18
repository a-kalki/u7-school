import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { U7BotApp } from '@u7-scl/app/domain';
import { ApiApp } from '@u7-scl/core/api';
import { BaseJsonDb } from '@u7-scl/core/infra';
import { ConsoleLogger } from '@u7-scl/core/shared';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, BotRouter } from '@u7-scl/core/ui';
import type { OnboardingApiModuleResolver } from '@u7-scl/onboarding';
import {
  OnboardingApiModule,
  OnboardingController,
  QuestionnaireJsonRepo,
  QuestionPoolService,
} from '@u7-scl/onboarding';
import { UserApiModule } from '@u7-scl/user/api';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import { UserJsonRepo } from '@u7-scl/user/infra';

// ══ Упрощённый пул вопросов для E2E тестов (без ветвления) ══
const E2E_QUESTION_POOL = [
  {
    question: 'Первый вопрос',
    questionCode: 'q1',
    type: 'choice' as const,
    multiple: false,
    answers: [
      { answer: 'Да', answerCode: 'yes' },
      { answer: 'Нет', answerCode: 'no' },
    ],
  },
  {
    question: 'Второй вопрос',
    questionCode: 'q2',
    type: 'text' as const,
  },
];

const E2E_INCLUDED_CODES = ['q1', 'q2'];

const NO_SESSION: SessionData = { activeHandler: null };

/** Сессия с captureInput и messageId */
function capSession(messageId?: number): SessionData {
  return {
    activeHandler: {
      path: 'onboarding/questionnaire',
      context: messageId !== undefined ? { messageId } : undefined,
      expiresAt: Date.now() + 600_000,
    },
  };
}

/** Находит кнопку в клавиатуре ответа по вхождению подстроки в текст */
function findButton(
  response: BotResponse,
  textContains: string,
): { text: string; code: string } {
  const btn = response.sendMessage?.keyboard?.rows
    .flat()
    .find((b) => b.text.includes(textContains));
  if (!btn) {
    const allTexts =
      response.sendMessage?.keyboard?.rows
        .flat()
        .map((b) => b.text)
        .join(', ') ?? '(нет клавиатуры)';
    throw new Error(
      `Кнопка с текстом «${textContains}» не найдена. Доступны: ${allTexts}`,
    );
  }
  return btn;
}

describe('Onboarding E2E', () => {
  let tmpDir: string;
  let apiApp: U7BotApp;
  let router: BotRouter;
  let guest: User & { telegramId: number };
  let userRepo: UserJsonRepo;

  beforeAll(async () => {
    tmpDir = mkdtempSync('/tmp/onboarding-e2e-');

    const usersPath = join(tmpDir, 'users.json');
    const questionnairePath = join(tmpDir, 'questionnaires.json');

    const db = new BaseJsonDb();
    const logger = new ConsoleLogger();
    const appResolver = { logger, mode: 'development' as const };

    // Репозитории
    userRepo = new UserJsonRepo(usersPath, '', db);

    const questionnaireRepo = new QuestionnaireJsonRepo(questionnairePath, db);

    // Сервис пула вопросов
    const questionPoolService = new QuestionPoolService(
      E2E_QUESTION_POOL,
      E2E_INCLUDED_CODES,
    );

    // Фасад пользователей
    const userFacade = {
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
          createdAt: '2026-01-01T00:00',
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
    };

    // Модули
    const userModule = new UserApiModule({ userRepo, appResolver });

    const onboardingResolver: OnboardingApiModuleResolver = {
      questionnaireRepo,
      questionPoolService,
      userFacade,
      db,
      appResolver,
    };
    const onboardingModule = new OnboardingApiModule(onboardingResolver);

    apiApp = new ApiApp([userModule, onboardingModule]) as U7BotApp;

    // Контроллер и роутер
    const onboardingController = new OnboardingController(onboardingModule);
    onboardingController.init(apiApp);

    router = new BotRouter([onboardingController]);
    router.init(apiApp);

    // Seed: гость с telegramId=2001
    guest = {
      uuid: crypto.randomUUID(),
      name: 'Тестовый Гость',
      telegramId: 2001,
      roles: [Role.GUEST],
      createdAt: '2026-01-01T00:00',
    };
    await userRepo.save(guest);
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // ═══════════════════════════════════════════════════════════════
  // FR-1: Полный сценарий анкетирования
  // ═══════════════════════════════════════════════════════════════
  test('полный цикл: /start → анкета → все вопросы → завершение → роль CANDIDATE', async () => {
    // 1. Главное меню: есть кнопка «Заполнить анкету»
    const menu = await router.collectMainMenu(guest);
    const onboardBtn = menu.find((i) => i.text === '📝 Заполнить анкету');
    expect(onboardBtn).toBeDefined();
    expect(onboardBtn!.action).toBe('onboarding:start_questionnaire');

    // 2. Начинаем анкету
    const startResp = await router.handleCallback(
      'onboarding:start_questionnaire',
      guest,
      NO_SESSION,
    );
    assertBotResponseValid(startResp);

    // Приветствие + первый вопрос через sendMessages
    const messages = startResp.sendMessages;
    expect(messages).toBeDefined();
    expect(messages!.length).toBe(2);
    expect(messages![0]!.text).toContain('Заполни анкету');
    expect(messages![1]!.text).toContain('Первый вопрос');
    expect(messages![1]!.keyboard).toBeDefined();

    // 3. Отвечаем на q1 (выбор «Да»)
    const answerQ1 = await router.handleCallback(
      'onboarding:answer:yes',
      guest,
      capSession(1),
    );
    assertBotResponseValid(answerQ1);

    // После q1 должен быть переход к q2 (new_question)
    expect(answerQ1.sendMessage?.text).toContain('Второй вопрос');

    // 4. Отвечаем на q2 (текстовый ответ)
    const answerQ2 = await router.handleMessage(
      {
        type: 'message',
        text: 'Хочу научиться программировать',
        telegramId: 2001,
      },
      guest,
      capSession(2),
    );
    assertBotResponseValid(answerQ2!);

    // После q2 анкета должна завершиться
    expect(answerQ2!.sendMessage?.text).toContain('Спасибо');
    expect(answerQ2!.questionnaireCompleted).toBe(true);
    expect(answerQ2!.releaseInput).toBe(true);

    // 5. Проверяем, что роль изменилась на CANDIDATE
    const updatedUser = await userRepo.getByUuid(guest.uuid);
    expect(updatedUser).toBeDefined();
    expect(updatedUser!.roles).toContain(Role.CANDIDATE);
  });

  // ═══════════════════════════════════════════════════════════════
  // FR-2: Прерывание анкеты
  // ═══════════════════════════════════════════════════════════════
  test('прерывание анкеты: /cancel → abandoned', async () => {
    // Регистрируем нового гостя для этого теста
    const guest2: User & { telegramId: number } = {
      uuid: crypto.randomUUID(),
      name: 'Гость для отмены',
      telegramId: 2002,
      roles: [Role.GUEST],
      createdAt: '2026-01-01T00:00',
    };
    await userRepo.save(guest2);

    // Начинаем анкету
    await router.handleCallback(
      'onboarding:start_questionnaire',
      guest2,
      NO_SESSION,
    );

    // Прерываем
    const cancelResp = await router.handleCancel(guest2, capSession(3));
    assertBotResponseValid(cancelResp!);

    expect(cancelResp!.sendMessage?.text).toContain('прервана');
    expect(cancelResp!.sendMessage?.text).toContain('Заполнить анкету');
    expect(cancelResp!.questionnaireCompleted).toBe(true);
    expect(cancelResp!.releaseInput).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════
  // FR-3: Возобновление анкеты (без отмены — повторный вход в активную)
  // ═══════════════════════════════════════════════════════════════
  test('возобновление анкеты: ответ → повторный «Заполнить анкету» → продолжение с того же места', async () => {
    // Регистрируем нового гостя
    const guest3: User & { telegramId: number } = {
      uuid: crypto.randomUUID(),
      name: 'Гость для возобновления',
      telegramId: 2003,
      roles: [Role.GUEST],
      createdAt: '2026-01-01T00:00',
    };
    await userRepo.save(guest3);

    // Начинаем анкету
    await router.handleCallback(
      'onboarding:start_questionnaire',
      guest3,
      NO_SESSION,
    );

    // Отвечаем на q1 → анкета переходит к q2 (всё ещё in_progress)
    await router.handleCallback(
      'onboarding:answer:yes',
      guest3,
      capSession(10),
    );

    // Снова нажимаем «Заполнить анкету» (без /cancel — анкета активна)
    const resumeResp = await router.handleCallback(
      'onboarding:start_questionnaire',
      guest3,
      NO_SESSION,
    );
    assertBotResponseValid(resumeResp);

    // Должен показать q2 (продолжение с места остановки)
    expect(resumeResp.sendMessage?.text).toContain('Второй вопрос');
    expect(resumeResp.sendMessage?.keyboard).toBeUndefined(); // текстовый вопрос без клавиатуры
  });
});
