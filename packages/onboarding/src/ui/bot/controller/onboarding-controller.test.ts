import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { U7BotApp, User } from '@u7-scl/app/domain';
import { ApiApp } from '@u7-scl/core/api';
import { BaseJsonDb } from '@u7-scl/core/infra';
import type { Logger } from '@u7-scl/core/shared';
import type {
  CbMainMenuAction,
  SendMessageDescription,
  SessionData,
} from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role, type UserFacade } from '@u7-scl/user/domain';
import { UserJsonRepo } from '@u7-scl/user/infra';
import { OnboardingApiModule } from '#api/module';
import type { OnboardingApiModuleResolver } from '#domain/module';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import { QuestionnaireJsonRepo } from '#infra/db/questionnaire-json-repo';
import type { MessageDescription } from '../types';
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
  let apiApp: U7BotApp;
  let controller: OnboardingController;
  const botAdminUuid = crypto.randomUUID();
  let modResolve: OnboardingApiModuleResolver;
  const logger = {
    error: () => {},
    info: () => {},
    warn: () => {},
  } as unknown as Logger;

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

    modResolve = {
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
      } as unknown as UserFacade,
      db,
      appResolver: { logger, mode: 'test' as const },
    };

    mod = new OnboardingApiModule(modResolve);

    // Seed admin после инициализации модуля
    await userRepo.save({
      uuid: botAdminUuid,
      name: 'Admin',
      telegramId: 1,
      roles: [Role.ADMIN],
      createdAt: '2024-01-01T00:00',
    });

    apiApp = new ApiApp([mod]) as U7BotApp;
    controller = new OnboardingController(mod);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const actor: User = {
    uuid: botAdminUuid,
    name: 'Test',
    telegramId: 12345,
    roles: [Role.GUEST],
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  /** Чистая сессия */
  function emptySession(): SessionData {
    return { activeHandler: null };
  }

  /** Сессия с captureInput и опциональным messageId */
  function capSession(messageId?: number): SessionData {
    return {
      activeHandler: {
        path: 'onboarding/questionnaire',
        context: messageId !== undefined ? { messageId } : undefined,
        expiresAt: Date.now() + 600_000,
      },
    };
  }

  // ── Базовые тесты ──

  test('handleStart: возвращает кнопку «Заполнить анкету»', async () => {
    const items = (await controller.handleStart(actor)) as CbMainMenuAction[];

    expect(items).toHaveLength(1);
    expect(items[0]!.text).toBe('📝 Заполнить анкету');
    expect(items[0]!.action).toBe('onboarding:start_questionnaire');
    expect(items[0]!.priority).toBe(50);
    expect(items[0]!.description).toContain('Заполнить анкету');
  });

  test('start_questionnaire начинает новую анкету', async () => {
    const response = await controller.handleCallback(
      'start_questionnaire',
      actor,
      emptySession(),
    );
    assertResponseMarkdownSafe(response);

    // Приветствие + первый вопрос через sendMessages
    const messages = response.sendMessages as SendMessageDescription[];
    expect(messages).toBeDefined();
    expect(messages.length).toBe(2);
    expect(messages[0]!.text).toContain('Заполни анкету');
    expect(messages[1]!.text).toContain('Первый вопрос');
    expect(messages[1]!.keyboard).toBeDefined();
    // Захват ввода
    expect(response.captureInput).toBeDefined();
    expect(response.captureInput!.path).toBe('questionnaire');
  });

  test('start_questionnaire продолжает активную анкету', async () => {
    // Начинаем анкету
    await controller.handleCallback(
      'start_questionnaire',
      actor,
      emptySession(),
    );

    // Повторный вызов — должен вернуть текущий вопрос
    const response = await controller.handleCallback(
      'start_questionnaire',
      actor,
      emptySession(),
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Первый вопрос');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  test('ответ на вопрос завершает анкету', async () => {
    // Начинаем анкету
    await controller.handleCallback(
      'start_questionnaire',
      actor,
      emptySession(),
    );

    // Отвечаем на вопрос (callback)
    const response = await controller.handleCallback(
      'answer:yes',
      actor,
      capSession(1),
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Спасибо');
    expect(response.questionnaireCompleted).toBe(true);
    expect(response.releaseInput).toBe(true);
  });

  test('cancel прерывает анкету', async () => {
    // Начинаем анкету
    await controller.handleCallback(
      'start_questionnaire',
      actor,
      emptySession(),
    );

    // Прерываем
    const response = await controller.handleCancel(actor, capSession(1));
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('прервана');
    expect(response.sendMessage?.text).toContain('Заполнить анкету');
    expect(response.questionnaireCompleted).toBe(true);
    expect(response.releaseInput).toBe(true);
  });

  test('сообщение без активной анкеты возвращает ошибку', async () => {
    const response = await controller.handleMessage(
      { type: 'message', text: 'привет', telegramId: 999 },
      actor,
      emptySession(),
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text.toLowerCase()).toContain('неизвестное');
  });

  test('cancel без активной анкеты — просто releaseInput', async () => {
    const response = await controller.handleCancel(actor, emptySession());
    assertResponseMarkdownSafe(response);

    expect(response.releaseInput).toBe(true);
    expect(response.sendMessage).toBeUndefined();
  });

  // ── Тесты с несколькими вопросами (переход new_question) ──

  test('new_question: edit использует previousQuestion, без клавиатуры', async () => {
    const poolService = new QuestionPoolService(
      [
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
      ],
      ['q1', 'q2'],
    );

    const mod2 = new OnboardingApiModule({
      questionnaireRepo,
      questionPoolService: poolService,
      userFacade: modResolve.userFacade,
      db,
      appResolver: { logger, mode: 'test' as const },
    });

    const app2 = new ApiApp([mod2]) as U7BotApp;
    const ctrl2 = new OnboardingController(mod2);
    const actor2: User = {
      uuid: botAdminUuid,
      name: 'Test2',
      telegramId: 777,
      roles: [Role.GUEST],
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Начинаем анкету
    await ctrl2.handleCallback('start_questionnaire', actor2, emptySession());

    // Отвечаем на q1 (callback) — должен быть переход на q2
    const response = await ctrl2.handleCallback(
      'answer:yes',
      actor2,
      capSession(42),
    );
    assertResponseMarkdownSafe(response);

    // Edit: должен содержать текст первого вопроса с [x] на 'Да' и БЕЗ клавиатуры
    expect(response.editMessage).toBeDefined();
    const editMessage = response.editMessage as MessageDescription & {
      messageId: number;
    };
    expect(editMessage.messageId).toBe(42);
    expect(editMessage.text).toContain('Первый вопрос');
    expect(editMessage.text).toContain('\\(x\\)');
    expect(editMessage.keyboard).toBeUndefined();

    // Send: должен содержать текст второго вопроса
    const sendMessage = response.sendMessage as MessageDescription & {
      messageId: number;
    };
    expect(sendMessage).toBeDefined();
    expect(sendMessage.text).toContain('Второй вопрос');
  });

  test('new_question: send использует question (новый вопрос)', async () => {
    const poolService = new QuestionPoolService(
      [
        {
          question: 'Первый вопрос',
          questionCode: 'q1',
          type: 'choice',
          multiple: false,
          answers: [{ answer: 'Да', answerCode: 'yes' }],
        },
        {
          question: 'Второй вопрос',
          questionCode: 'q2',
          type: 'text',
        },
      ],
      ['q1', 'q2'],
    );

    const mod2 = new OnboardingApiModule({
      questionnaireRepo,
      questionPoolService: poolService,
      userFacade: modResolve.userFacade,
      db,
      appResolver: { logger, mode: 'test' as const },
    });

    const app2 = new ApiApp([mod2]) as U7BotApp;
    const ctrl2 = new OnboardingController(mod2);
    const actor2: User = {
      uuid: botAdminUuid,
      name: 'Test3',
      telegramId: 888,
      roles: [Role.GUEST],
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    await ctrl2.handleCallback('start_questionnaire', actor2, emptySession());

    const response = await ctrl2.handleCallback(
      'answer:yes',
      actor2,
      capSession(10),
    );
    assertResponseMarkdownSafe(response);

    // Send — новый вопрос, edit — старый. Текст нового вопроса НЕ должен быть в edit
    const editMessage = response.editMessage as MessageDescription & {
      messageId: number;
    };
    const sendMessage = response.sendMessage as MessageDescription & {
      messageId: number;
    };
    expect(editMessage.text).toContain('Первый вопрос');
    expect(sendMessage.text).toContain('Второй вопрос');
    // Новый вопрос не должен содержать [x] (черновиков нет)
    expect(sendMessage.text).not.toContain('[x]');
  });

  test('new_question: multiple choice с next — edit без клавиатуры', async () => {
    const poolService = new QuestionPoolService(
      [
        {
          question: 'Множественный выбор',
          questionCode: 'q1',
          type: 'choice',
          multiple: true,
          answers: [
            { answer: 'A', answerCode: 'a' },
            { answer: 'B', answerCode: 'b' },
          ],
        },
        {
          question: 'Текстовый вопрос',
          questionCode: 'q2',
          type: 'text',
        },
      ],
      ['q1', 'q2'],
    );

    const mod2 = new OnboardingApiModule({
      questionnaireRepo,
      questionPoolService: poolService,
      userFacade: modResolve.userFacade,
      db,
      appResolver: { logger, mode: 'test' as const },
    });

    const app2 = new ApiApp([mod2]) as U7BotApp;
    const ctrl2 = new OnboardingController(mod2);
    const actor2: User = {
      uuid: botAdminUuid,
      name: 'Test4',
      telegramId: 999,
      roles: [Role.GUEST],
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Начинаем анкету
    await ctrl2.handleCallback('start_questionnaire', actor2, emptySession());

    // Выбираем ответ 'a' (wait_next)
    await ctrl2.handleCallback('answer:a', actor2, capSession(55));

    // Нажимаем «Далее» — переход на q2
    const response = await ctrl2.handleCallback(
      'next:q1',
      actor2,
      capSession(55),
    );
    assertResponseMarkdownSafe(response);

    // Edit: предыдущий вопрос с [x] на 'a', БЕЗ клавиатуры
    const editMessage = response.editMessage as MessageDescription & {
      messageId: number;
    };
    const sendMessage = response.sendMessage as MessageDescription & {
      messageId: number;
    };
    expect(editMessage).toBeDefined();
    expect(editMessage.messageId).toBe(55);
    expect(editMessage.text).toContain('Множественный выбор');
    expect(editMessage.text).toContain('*\\[x\\]*');
    expect(editMessage.keyboard).toBeUndefined();

    // Send: новый вопрос
    expect(sendMessage).toBeDefined();
    expect(sendMessage.text).toContain('Текстовый вопрос');
  });

  test('completed: edit последнего вопроса, без клавиатуры', async () => {
    const poolService = new QuestionPoolService(
      [
        {
          question: 'Последний вопрос',
          questionCode: 'q1',
          type: 'choice',
          multiple: false,
          answers: [{ answer: 'Готово', answerCode: 'done' }],
        },
      ],
      ['q1'],
    );

    const mod2 = new OnboardingApiModule({
      questionnaireRepo,
      questionPoolService: poolService,
      userFacade: modResolve.userFacade,
      db,
      appResolver: { logger, mode: 'test' as const },
    });

    const app2 = new ApiApp([mod2]) as U7BotApp;
    const ctrl2 = new OnboardingController(mod2);
    const actor2: User = {
      uuid: botAdminUuid,
      name: 'Test5',
      telegramId: 111,
      roles: [Role.GUEST],
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Начинаем анкету
    await ctrl2.handleCallback('start_questionnaire', actor2, emptySession());

    // Отвечаем на последний вопрос (callback) — completed
    const response = await ctrl2.handleCallback(
      'answer:done',
      actor2,
      capSession(77),
    );
    assertResponseMarkdownSafe(response);

    // Edit предыдущего сообщения: последний вопрос с [x], без клавиатуры
    const editMessage = response.editMessage as MessageDescription & {
      messageId: number;
    };
    const sendMessage = response.sendMessage as MessageDescription & {
      messageId: number;
    };
    expect(editMessage).toBeDefined();
    expect(editMessage.messageId).toBe(77);
    expect(editMessage.text).toContain('Последний вопрос');
    expect(editMessage.text).toContain('\\(x\\)');
    expect(editMessage.keyboard).toBeUndefined();

    // Send: сообщение о завершении
    expect(sendMessage.text).toContain('Спасибо');
    expect(response.questionnaireCompleted).toBe(true);
    expect(response.releaseInput).toBe(true);
  });

  test('wait_next: callback без перехода использует currentQuestion (без изменений)', async () => {
    const poolService = new QuestionPoolService(
      [
        {
          question: 'Множественный выбор',
          questionCode: 'q1',
          type: 'choice',
          multiple: true,
          answers: [
            { answer: 'A', answerCode: 'a' },
            { answer: 'B', answerCode: 'b' },
          ],
        },
      ],
      ['q1'],
    );

    const mod2 = new OnboardingApiModule({
      questionnaireRepo,
      questionPoolService: poolService,
      userFacade: modResolve.userFacade,
      db,
      appResolver: { logger, mode: 'test' as const },
    });

    const app2 = new ApiApp([mod2]) as U7BotApp;
    const ctrl2 = new OnboardingController(mod2);
    const actor2: User = {
      uuid: botAdminUuid,
      name: 'Test6',
      telegramId: 222,
      roles: [Role.GUEST],
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Начинаем анкету
    await ctrl2.handleCallback('start_questionnaire', actor2, emptySession());

    // Переключаем чекбокс (wait_next) — должно редактировать текущее сообщение
    const response = await ctrl2.handleCallback(
      'answer:a',
      actor2,
      capSession(33),
    );
    assertResponseMarkdownSafe(response);

    // Edit должен быть (wait_next — редактируем текущее сообщение)
    const editMessage = response.editMessage as MessageDescription & {
      messageId: number;
    };
    expect(editMessage).toBeDefined();
    expect(editMessage.messageId).toBe(33);
    expect(editMessage.text).toContain('Множественный выбор');
    expect(editMessage.text).toContain('*\\[x\\]*');
    // В wait_next клавиатура ДОЛЖНА быть (это режим редактирования чекбоксов)
    expect(editMessage.keyboard).toBeDefined();
    // Send не должно быть (wait_next не отправляет новое сообщение)
    expect(response.sendMessage).toBeUndefined();
  });

  test('wait_next: start рендерит sendMessage с Далее', async () => {
    const poolService = new QuestionPoolService(
      [
        {
          question: 'Множественный выбор',
          questionCode: 'q1',
          type: 'choice',
          multiple: true,
          answers: [
            { answer: 'A', answerCode: 'a' },
            { answer: 'B', answerCode: 'b' },
          ],
        },
      ],
      ['q1'],
    );

    const mod2 = new OnboardingApiModule({
      questionnaireRepo,
      questionPoolService: poolService,
      userFacade: modResolve.userFacade,
      db,
      appResolver: { logger, mode: 'test' as const },
    });

    const app2 = new ApiApp([mod2]) as U7BotApp;
    const ctrl2 = new OnboardingController(mod2);
    const actor2: User = {
      uuid: botAdminUuid,
      name: 'Test7',
      telegramId: 333,
      roles: [Role.GUEST],
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Начинаем анкету
    await ctrl2.handleCallback('start_questionnaire', actor2, emptySession());

    // Выбираем ответ → состояние wait_next
    await ctrl2.handleCallback('answer:a', actor2, capSession(10));

    // Повторный start (без messageId в сессии)
    const response = await ctrl2.handleCallback(
      'start_questionnaire',
      actor2,
      emptySession(),
    );
    assertResponseMarkdownSafe(response);

    // sendMessage с текущим вопросом и клавиатурой
    expect(response.editMessage).toBeUndefined();
    expect(response.sendMessage).toBeDefined();
    expect(response.sendMessage?.text).toContain('Множественный выбор');
    expect(response.sendMessage?.text).toContain('*\\[x\\]*');
    // Клавиатура с ответами и кнопкой Далее
    expect(response.sendMessage?.keyboard).toBeDefined();
    expect(response.sendMessage?.keyboard?.rows.length).toBe(2);
    expect(response.sendMessage?.keyboard?.rows[1]?.[0]?.text).toBe(
      'Далее -->',
    );
    expect(response.sendMessage?.parseMode).toBe('MarkdownV2');
  });

  // ══════════════════════════════════════════════════
  // Edge case тесты
  // ══════════════════════════════════════════════════

  test('пустой ответ на текстовый вопрос возвращает ошибку', async () => {
    // Пул с одним текстовым вопросом
    const poolService = new QuestionPoolService(
      [
        {
          question: 'Текстовый вопрос',
          questionCode: 'q1',
          type: 'text' as const,
        },
      ],
      ['q1'],
    );

    const mod2 = new OnboardingApiModule({
      questionnaireRepo,
      questionPoolService: poolService,
      userFacade: modResolve.userFacade,
      db,
      appResolver: { logger, mode: 'test' as const },
    });

    const app2 = new ApiApp([mod2]) as U7BotApp;
    const ctrl2 = new OnboardingController(mod2);
    const actor2: User = {
      uuid: botAdminUuid,
      name: 'Test8',
      telegramId: 444,
      roles: [Role.GUEST],
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Начинаем анкету
    await ctrl2.handleCallback('start_questionnaire', actor2, emptySession());

    // Отправляем пустой текстовый ответ
    const response = await ctrl2.handleMessage(
      { type: 'message', text: '', telegramId: 999 },
      actor2,
      capSession(1),
    );
    assertResponseMarkdownSafe(response);

    // Должен вернуть сообщение с описанием ошибки валидации
    expect(response.sendMessage?.text).toContain('⚠️');
    expect(response.sendMessage?.text.toLowerCase()).toContain(
      'некорректные данные',
    );
  });

  test('очень длинный текстовый ответ принимается без ошибок', async () => {
    const poolService = new QuestionPoolService(
      [
        {
          question: 'Текстовый вопрос',
          questionCode: 'q1',
          type: 'text' as const,
        },
      ],
      ['q1'],
    );

    const mod2 = new OnboardingApiModule({
      questionnaireRepo,
      questionPoolService: poolService,
      userFacade: modResolve.userFacade,
      db,
      appResolver: { logger, mode: 'test' as const },
    });

    const app2 = new ApiApp([mod2]) as U7BotApp;
    const ctrl2 = new OnboardingController(mod2);
    const actor2: User = {
      uuid: botAdminUuid,
      name: 'Test9',
      telegramId: 555,
      roles: [Role.GUEST],
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Начинаем анкету
    await ctrl2.handleCallback('start_questionnaire', actor2, emptySession());

    // Отправляем очень длинный текст (2000+ символов)
    const longText = 'A'.repeat(2000);
    const response = await ctrl2.handleMessage(
      { type: 'message', text: longText, telegramId: 999 },
      actor2,
      capSession(1),
    );
    assertResponseMarkdownSafe(response);

    // Длинный текст должен быть принят (нет maxLength валидации)
    expect(response.sendMessage?.text).toContain('Спасибо');
    expect(response.questionnaireCompleted).toBe(true);
  });

  test('множественный выбор: нажатие «Далее» без выбора опций возвращает ошибку', async () => {
    const poolService = new QuestionPoolService(
      [
        {
          question: 'Множественный выбор',
          questionCode: 'q1',
          type: 'choice' as const,
          multiple: true,
          answers: [
            { answer: 'A', answerCode: 'a' },
            { answer: 'B', answerCode: 'b' },
          ],
        },
      ],
      ['q1'],
    );

    const mod2 = new OnboardingApiModule({
      questionnaireRepo,
      questionPoolService: poolService,
      userFacade: modResolve.userFacade,
      db,
      appResolver: { logger, mode: 'test' as const },
    });

    const app2 = new ApiApp([mod2]) as U7BotApp;
    const ctrl2 = new OnboardingController(mod2);
    const actor2: User = {
      uuid: botAdminUuid,
      name: 'Test10',
      telegramId: 666,
      roles: [Role.GUEST],
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    // Начинаем анкету
    await ctrl2.handleCallback('start_questionnaire', actor2, emptySession());

    // Пытаемся нажать «Далее» без выбора опций
    const response = await ctrl2.handleCallback(
      'next:q1',
      actor2,
      capSession(1),
    );
    assertResponseMarkdownSafe(response);

    // Должен вернуть ошибку (minLength валидация не пройдена)
    expect(response.sendMessage?.text).toContain('⚠️');
    expect(response.sendMessage?.text.toLowerCase()).toContain('ошибк');
  });
});
