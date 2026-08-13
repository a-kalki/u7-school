import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import { ApiApp } from '@u7-scl/core/api';
import { BaseJsonDb, InProcEventBus } from '@u7-scl/core/infra';
import { ConsoleLogger } from '@u7-scl/core/shared';
import { assertBotResponseValid } from '@u7-scl/core/ui';
import type { OnboardingApiModuleResolver } from '@u7-scl/onboarding';
import {
  OnboardingApiModule,
  QuestionnaireJsonRepo,
  QuestionPoolService,
} from '@u7-scl/onboarding';
import { TestBotTransport } from '@u7-scl/test-helpers/test-bot-transport';
import { UserApiModule } from '@u7-scl/user/api';
import type { User, UserFacade } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import { UserJsonRepo } from '@u7-scl/user/infra';
import { OnboardingController } from '../../src/controllers/onboarding/controller';

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

describe('Onboarding E2E', () => {
  let tmpDir: string;
  let apiApp: U7BotApp;
  let transport: TestBotTransport;
  let guest: User;
  let userFacade: UserFacade;
  let userRepo: UserJsonRepo;

  beforeAll(async () => {
    tmpDir = mkdtempSync('/tmp/onboarding-e2e-');

    const usersPath = join(tmpDir, 'users.json');
    const questionnairePath = join(tmpDir, 'questionnaires.json');

    const db = new BaseJsonDb();
    const logger = new ConsoleLogger();
    const appResolver = {
      logger,
      mode: 'development' as const,
      eventBus: new InProcEventBus(),
    };

    // Репозитории
    userRepo = new UserJsonRepo(usersPath, '', db);

    const questionnaireRepo = new QuestionnaireJsonRepo(questionnairePath, db);

    // Сервис пула вопросов
    const questionPoolService = new QuestionPoolService(
      E2E_QUESTION_POOL,
      E2E_INCLUDED_CODES,
    );

    // Фасад пользователей
    userFacade = {
      getUserByUuid: async (uuid: string) => userRepo.getByUuid(uuid),
      userExists: async (uuid: string) =>
        (await userRepo.getByUuid(uuid)) !== undefined,
      getUserByTelegramId: async (telegramId: number) =>
        userRepo.getByTelegramId(telegramId),
      registerGuest: async (
        telegramId: number,
        name: string,
        _actorId?: string,
        nick?: string,
      ) => {
        const user: User = {
          uuid: crypto.randomUUID(),
          name,
          telegramId,
          roles: [Role.GUEST],
          createdAt: '2026-01-01T00:00',
        };
        if (nick) user.nick = nick;
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
    } as unknown as UserFacade;

    // Модули
    const userModule = new UserApiModule({
      userRepo,
      appResolver,
      eventBus: appResolver.eventBus,
    });

    const onboardingResolver: OnboardingApiModuleResolver = {
      questionnaireRepo,
      questionPoolService,
      userFacade,
      db,
      appResolver,
      eventBus: appResolver.eventBus,
    };
    const onboardingModule = new OnboardingApiModule(onboardingResolver);

    apiApp = new ApiApp([userModule, onboardingModule]) as U7BotApp;

    // Контроллер и честный BotTransport
    const onboardingController = new OnboardingController();
    transport = new TestBotTransport(
      apiApp,
      async (tgId: number) => {
        const user = await userRepo.getByTelegramId(tgId);
        if (!user) {
          throw new Error(`Пользователь с telegramId ${tgId} не найден`);
        }
        return user;
      },
      [onboardingController],
    );

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

  beforeEach(() => {
    transport.reset();
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // ═══════════════════════════════════════════════════════════════
  // FR-1: Полный сценарий анкетирования
  // ═══════════════════════════════════════════════════════════════
  test('полный цикл: /start → анкета → все вопросы → завершение → роль CANDIDATE', async () => {
    // 1. Главное меню: кнопка «Заполнить анкету» отключена до Релиза 4
    const menu = await transport.collectMainMenu(guest);
    const onboardBtn = menu.find((i) => i.text === '📝 Заполнить анкету');
    expect(onboardBtn).toBeUndefined();

    // 2. Начинаем анкету напрямую (кнопка отключена, но логика работает)
    const startResp = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: 'onboarding:start_questionnaire',
      }),
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
    const answerQ1 = await transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: 'onboarding:answer:yes',
      }),
    );
    assertBotResponseValid(answerQ1);

    // После q1 должен быть переход к q2 (new_question)
    expect(answerQ1.sendMessage?.text).toContain('Второй вопрос');

    // 4. Отвечаем на q2 (текстовый ответ)
    const answerQ2 = await transport.handleMessage(
      transport.makeBotContext(guest.telegramId, {
        text: 'Хочу научиться программировать',
      }),
    );
    assertBotResponseValid(answerQ2!);

    // После q2 анкета должна завершиться
    expect(answerQ2!.sendMessage?.text).toContain('Спасибо');
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
    const guest2: User = {
      uuid: crypto.randomUUID(),
      name: 'Гость для отмены',
      telegramId: 2002,
      roles: [Role.GUEST],
      createdAt: '2026-01-01T00:00',
    };
    await userRepo.save(guest2);

    // Начинаем анкету
    await transport.handleCallback(
      transport.makeBotContext(guest2.telegramId, {
        callbackData: 'onboarding:start_questionnaire',
      }),
    );

    // Прерываем
    const cancelResp = await transport.handleCancel(
      transport.makeBotContext(guest2.telegramId),
    );
    assertBotResponseValid(cancelResp!);

    expect(cancelResp!.sendMessage?.text).toContain('прервана');
    expect(cancelResp!.sendMessage?.text).toContain('Заполнить анкету');
    expect(cancelResp!.releaseInput).toBe(true);
  });

  // ═══════════════════════════════════════════════════════════════
  // FR-3: Возобновление анкеты (без отмены — повторный вход в активную)
  // ═══════════════════════════════════════════════════════════════
  test('возобновление анкеты: ответ → повторный «Заполнить анкету» → продолжение с того же места', async () => {
    // Регистрируем нового гостя
    const guest3: User = {
      uuid: crypto.randomUUID(),
      name: 'Гость для возобновления',
      telegramId: 2003,
      roles: [Role.GUEST],
      createdAt: '2026-01-01T00:00',
    };
    await userRepo.save(guest3);

    // Начинаем анкету
    await transport.handleCallback(
      transport.makeBotContext(guest3.telegramId, {
        callbackData: 'onboarding:start_questionnaire',
      }),
    );

    // Отвечаем на q1 → анкета переходит к q2 (всё ещё in_progress)
    await transport.handleCallback(
      transport.makeBotContext(guest3.telegramId, {
        callbackData: 'onboarding:answer:yes',
      }),
    );

    // Снова нажимаем «Заполнить анкету» (без /cancel — анкета активна)
    const resumeResp = await transport.handleCallback(
      transport.makeBotContext(guest3.telegramId, {
        callbackData: 'onboarding:start_questionnaire',
      }),
    );
    assertBotResponseValid(resumeResp);

    // Должен показать q2 (продолжение с места остановки)
    expect(resumeResp.sendMessage?.text).toContain('Второй вопрос');
    expect(resumeResp.sendMessage?.keyboard).toBeUndefined(); // текстовый вопрос без клавиатуры
  });

  // ═══════════════════════════════════════════════════════════════
  // Nick: проверка сохранения telegram-username при регистрации
  // ═══════════════════════════════════════════════════════════════
  test('при регистрации гостя nick сохраняется в БД', async () => {
    const nick = 'test_telegram_username';
    const newUser = await userFacade.registerGuest(
      9999,
      'Никнейм Тест',
      'admin-uuid',
      nick,
    );

    // Проверяем, что nick попал в БД
    const fromDb = await userRepo.getByUuid(newUser.uuid);
    expect(fromDb).toBeDefined();
    expect(fromDb!.nick).toBe(nick);
  });
});
