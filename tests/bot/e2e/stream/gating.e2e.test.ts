import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type {
  BotResponse,
  CbMainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import { assertBotResponseValid, BotRouter } from '@u7-scl/core/ui';
import { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

// ── Константы фикстур ──

/** Поток Алгоритмики (enrollment) */
const ALGO_STREAM_ID = 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5';
/** Поток Синтаксиса (active) */
const SYNTAX_STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';

// ── Хелперы ──

const NO_SESSION: SessionData = { activeHandler: null };

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

function findMenuItem(
  items: CbMainMenuAction[],
  textContains: string,
): { text: string; action: string } {
  const item = items.find((i) => i.text.includes(textContains));
  if (!item) {
    const all = items.map((i) => i.text).join(', ');
    throw new Error(`Пункт меню «${textContains}» не найден. Доступны: ${all}`);
  }
  return item;
}

// ═══════════════════════════════════════════════════════════════════

describe('Gating E2E (через бота)', () => {
  let app: TestApp;
  let router: BotRouter;
  let advancedUser: User;
  let notAdvancedUser: User;

  beforeAll(async () => {
    app = await createTestApp('e2e-gating-bot');
    const streamController = new StreamController(app.streamModule);
    streamController.init(app.apiApp);
    router = new BotRouter([streamController]);
    advancedUser = (await app.userFacade.getUserByTelegramId(1007))!;
    notAdvancedUser = (await app.userFacade.getUserByTelegramId(1008))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('студент с advanced на Синтаксисе → видит «Записаться» и успешно записывается на Алгоритмику', async () => {
    // 1. Главное меню
    const menu = (await router.collectMainMenu(
      advancedUser,
    )) as CbMainMenuAction[];
    const catalogBtn = findMenuItem(menu, 'Потоки курсов');

    // 2. Каталог → ищем Алгоритмику
    const catalogResp = await router.handleCallback(
      catalogBtn.action,
      advancedUser,
      NO_SESSION,
    );
    assertBotResponseValid(catalogResp);

    const algoBtn = findButton(catalogResp, 'Алгоритмика');
    expect(algoBtn).toBeDefined();

    // 3. Карточка потока Алгоритмики
    const viewResp = await router.handleCallback(
      algoBtn.code,
      advancedUser,
      NO_SESSION,
    );
    assertBotResponseValid(viewResp);

    const text = viewResp.sendMessage?.text ?? '';
    expect(text).toContain('Алгоритмика');
    expect(text).not.toContain('Неизвестная команда');

    // 4. Кнопка «Записаться» — видна (пользователь GUEST + enrollment)
    const enrollBtn = findButton(viewResp, 'Записаться');

    // 5. Нажимаем «Записаться»
    const enrollResp = await router.handleCallback(
      enrollBtn.code,
      advancedUser,
      NO_SESSION,
    );
    assertBotResponseValid(enrollResp);

    // 6. Успешное зачисление — сообщение + делегирование в «Моя учёба»
    const allTexts = [
      enrollResp.sendMessage?.text ?? '',
      ...(enrollResp.sendMessages ?? []).map((m) => m.text),
    ].join(' ');

    expect(allTexts).toContain('успешно записаны');
    expect(allTexts).toContain('Алгоритмика');
  });

  test('студент с not_advanced на Синтаксисе → получает отказ при попытке записаться на Алгоритмику', async () => {
    // 1. Главное меню → каталог
    const menu = (await router.collectMainMenu(
      notAdvancedUser,
    )) as CbMainMenuAction[];
    const catalogBtn = findMenuItem(menu, 'Потоки курсов');

    const catalogResp = await router.handleCallback(
      catalogBtn.action,
      notAdvancedUser,
      NO_SESSION,
    );
    assertBotResponseValid(catalogResp);

    // 2. Алгоритмика
    const algoBtn = findButton(catalogResp, 'Алгоритмика');
    const viewResp = await router.handleCallback(
      algoBtn.code,
      notAdvancedUser,
      NO_SESSION,
    );
    assertBotResponseValid(viewResp);

    // 3. «Записаться»
    const enrollBtn = findButton(viewResp, 'Записаться');

    // 4. Нажимаем — ждём отказ
    const enrollResp = await router.handleCallback(
      enrollBtn.code,
      notAdvancedUser,
      NO_SESSION,
    );
    assertBotResponseValid(enrollResp);

    // 5. Проверяем сообщение об ошибке
    const text = enrollResp.sendMessage?.text ?? '';
    expect(text).toContain('Сначала пройдите модуль');
    // В сообщении должно быть название предыдущего модуля
    expect(text).toContain('JavaScript Основы');
  });

  test('после успешной записи — студент найден в потоке Алгоритмики', async () => {
    const studentRecord = await app.streamModule.execute(
      'get-student-by-user',
      { userId: advancedUser.uuid },
      advancedUser.uuid,
    );
    expect(studentRecord).toBeDefined();
    expect(studentRecord.status).toBe('enrolled');
    expect(studentRecord.streamId).toBe(ALGO_STREAM_ID);
  });
});
