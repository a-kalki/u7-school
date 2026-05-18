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

  // ── Тесты с несколькими вопросами (переход new_question) ──

  test('new_question: edit использует previousQuestion, без клавиатуры', async () => {
    // Создаём контроллер с пулом из 2 вопросов
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
      userFacade: (mod as any).userFacade,
      db,
    });

    const app2 = new ApiApp([mod2]) as OnboardingBotApp;
    const ctrl2 = new OnboardingController(app2);

    // Начинаем анкету
    await ctrl2.handleUpdate(
      { type: 'command', command: 'start', telegramId: 777, name: 'Иван' },
      botAdminUuid,
    );

    // Отвечаем на q1 (callback) — должен быть переход на q2
    const response = await ctrl2.handleUpdate(
      {
        type: 'callback',
        data: 'yes',
        telegramId: 777,
        messageId: 42,
      },
      botAdminUuid,
    );

    // Edit: должен содержать текст первого вопроса с [x] на 'Да' и БЕЗ клавиатуры
    expect(response.editMessage).toBeDefined();
    expect(response.editMessage!.messageId).toBe(42);
    expect(response.editMessage!.text).toContain('Первый вопрос');
    expect(response.editMessage!.text).toContain('\\[x\\]');
    expect(response.editMessage!.keyboard).toBeUndefined();

    // Send: должен содержать текст второго вопроса
    expect(response.sendMessage).toBeDefined();
    expect(response.sendMessage!.text).toContain('Второй вопрос');
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
      userFacade: (mod as any).userFacade,
      db,
    });

    const app2 = new ApiApp([mod2]) as OnboardingBotApp;
    const ctrl2 = new OnboardingController(app2);

    await ctrl2.handleUpdate(
      { type: 'command', command: 'start', telegramId: 888, name: 'Иван' },
      botAdminUuid,
    );

    const response = await ctrl2.handleUpdate(
      {
        type: 'callback',
        data: 'yes',
        telegramId: 888,
        messageId: 10,
      },
      botAdminUuid,
    );

    // Send — новый вопрос, edit — старый. Текст нового вопроса НЕ должен быть в edit
    expect(response.editMessage!.text).toContain('Первый вопрос');
    expect(response.sendMessage!.text).toContain('Второй вопрос');
    // Новый вопрос не должен содержать [x] (черновиков нет)
    expect(response.sendMessage!.text).not.toContain('\\[x\\]');
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
      userFacade: (mod as any).userFacade,
      db,
    });

    const app2 = new ApiApp([mod2]) as OnboardingBotApp;
    const ctrl2 = new OnboardingController(app2);

    // Начинаем анкету
    await ctrl2.handleUpdate(
      { type: 'command', command: 'start', telegramId: 999, name: 'Иван' },
      botAdminUuid,
    );

    // Выбираем ответ 'a' (wait_next)
    await ctrl2.handleUpdate(
      { type: 'callback', data: 'a', telegramId: 999, messageId: 55 },
      botAdminUuid,
    );

    // Нажимаем «Далее» — переход на q2
    const response = await ctrl2.handleUpdate(
      {
        type: 'callback',
        data: 'next:q1',
        telegramId: 999,
        messageId: 55,
      },
      botAdminUuid,
    );

    // Edit: предыдущий вопрос с [x] на 'a', БЕЗ клавиатуры
    expect(response.editMessage).toBeDefined();
    expect(response.editMessage!.messageId).toBe(55);
    expect(response.editMessage!.text).toContain('Множественный выбор');
    expect(response.editMessage!.text).toContain('\\[x\\]');
    expect(response.editMessage!.keyboard).toBeUndefined();

    // Send: новый вопрос
    expect(response.sendMessage).toBeDefined();
    expect(response.sendMessage!.text).toContain('Текстовый вопрос');
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
      userFacade: (mod as any).userFacade,
      db,
    });

    const app2 = new ApiApp([mod2]) as OnboardingBotApp;
    const ctrl2 = new OnboardingController(app2);

    // Начинаем анкету
    await ctrl2.handleUpdate(
      { type: 'command', command: 'start', telegramId: 111, name: 'Иван' },
      botAdminUuid,
    );

    // Отвечаем на последний вопрос (callback) — completed
    const response = await ctrl2.handleUpdate(
      {
        type: 'callback',
        data: 'done',
        telegramId: 111,
        messageId: 77,
      },
      botAdminUuid,
    );

    // Edit предыдущего сообщения: последний вопрос с [x], без клавиатуры
    expect(response.editMessage).toBeDefined();
    expect(response.editMessage!.messageId).toBe(77);
    expect(response.editMessage!.text).toContain('Последний вопрос');
    expect(response.editMessage!.text).toContain('\\[x\\]');
    expect(response.editMessage!.keyboard).toBeUndefined();

    // Send: сообщение о завершении
    expect(response.sendMessage!.text).toContain('Спасибо');
    expect(response.questionnaireCompleted).toBe(true);
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
      userFacade: (mod as any).userFacade,
      db,
    });

    const app2 = new ApiApp([mod2]) as OnboardingBotApp;
    const ctrl2 = new OnboardingController(app2);

    // Начинаем анкету
    await ctrl2.handleUpdate(
      { type: 'command', command: 'start', telegramId: 222, name: 'Иван' },
      botAdminUuid,
    );

    // Переключаем чекбокс (wait_next) — должно редактировать текущее сообщение
    const response = await ctrl2.handleUpdate(
      {
        type: 'callback',
        data: 'a',
        telegramId: 222,
        messageId: 33,
      },
      botAdminUuid,
    );

    // Edit должен быть (wait_next — редактируем текущее сообщение)
    expect(response.editMessage).toBeDefined();
    expect(response.editMessage!.messageId).toBe(33);
    expect(response.editMessage!.text).toContain('Множественный выбор');
    expect(response.editMessage!.text).toContain('\\[x\\]');
    // В wait_next клавиатура ДОЛЖНА быть (это режим редактирования чекбоксов)
    expect(response.editMessage!.keyboard).toBeDefined();
    // Send не должно быть (wait_next не отправляет новое сообщение)
    expect(response.sendMessage).toBeUndefined();
  });
});
