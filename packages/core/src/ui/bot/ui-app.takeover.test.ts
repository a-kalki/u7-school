import { describe, expect, mock, test } from 'bun:test';
import { BotController } from './bot-controller';
import type { BotCommand, BotResponse, SessionData } from './types';
import { BotUiApp } from './ui-app';

/**
 * Takeover — явный перехват ввода (spec FR-5).
 *
 * Маркер-префикс в callback_data кодируется/снимаются на уровне uiApp:
 * транспорт, контроллеры и стори работают с «нативным» кодом.
 */

// ── Тестовый контроллер (образец: ui-app.test.ts) ──

type TestActor = { id: string };

class TestController extends BotController<
  import('#domain/types').AppMeta,
  TestActor
> {
  name = '';
  private _callbackResult: BotResponse = {};
  private _messageResult: BotResponse = {};

  callbackDatas: string[] = [];

  withCallbackResult(res: BotResponse): this {
    this._callbackResult = res;
    return this;
  }

  withMessageResult(res: BotResponse): this {
    this._messageResult = res;
    return this;
  }

  override async handleCallback(data: string): Promise<BotResponse> {
    this.callbackDatas.push(data);
    return this._callbackResult;
  }

  override async handleMessage(): Promise<BotResponse> {
    return this._messageResult;
  }
}

function makeActor(): TestActor {
  return { id: 'u1' };
}

function makeResolve(actor: TestActor) {
  return {
    appApi: {} as never,
    eventBus: {} as never,
    actorResolver: async () => actor,
  };
}

/** Takeover-кнопка в ответе контроллера. */
function takeoverResponse(code: string): BotResponse {
  return {
    sendMessage: {
      text: 'Приглашение',
      keyboard: {
        rows: [[{ text: '▶️ Продолжить', code, takeover: true }]],
        isMultiple: false,
      },
    },
  };
}

// ── Кодирование маркера при отправке ──

describe('BotUiApp takeover — кодирование маркера при отправке', () => {
  test('интерактивный ответ: code takeover-кнопки получает маркер-префикс', async () => {
    const ctrl = new TestController();
    ctrl.name = 'questionnaire';
    ctrl.withCallbackResult(takeoverResponse('questionnaire:fill:resume:c1'));

    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(makeActor()));

    const res = await app.handleCallback('questionnaire:fill:view', 1, {
      activeHandler: null,
    });

    const btn = res.sendMessage?.keyboard?.rows[0]?.[0];
    expect(btn?.code).toBe('!questionnaire:fill:resume:c1');
    // Структурное поле сохраняется — транспорт рендерит по нему предупреждение
    expect(btn?.takeover).toBe(true);
  });

  test('проактивный send: code takeover-кнопки получает маркер-префикс', async () => {
    const ctrl = new TestController();
    ctrl.name = 'questionnaire';

    const app = new BotUiApp([ctrl]);
    const transport = {
      send: mock(async () => {}),
      notify: mock(async () => {}),
    };
    app.init(makeResolve(makeActor()), transport);

    const command: BotCommand = takeoverResponse(
      'questionnaire:fill:resume:c1',
    );
    await app.send(456, command);

    const [, sent] = (transport.send as ReturnType<typeof mock>).mock
      .calls[0] as [number, BotCommand];
    const btn = sent.sendMessage?.keyboard?.rows[0]?.[0];
    expect(btn?.code).toBe('!questionnaire:fill:resume:c1');
    expect(btn?.takeover).toBe(true);
  });

  test('обычные кнопки маркер не получают', async () => {
    const ctrl = new TestController();
    ctrl.name = 'questionnaire';
    ctrl.withCallbackResult({
      sendMessage: {
        text: 'Обычное',
        keyboard: {
          rows: [[{ text: 'Ок', code: 'questionnaire:fill:view' }]],
          isMultiple: false,
        },
      },
    });

    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(makeActor()));

    const res = await app.handleCallback('questionnaire:fill:view', 1, {
      activeHandler: null,
    });

    expect(res.sendMessage?.keyboard?.rows[0]?.[0]?.code).toBe(
      'questionnaire:fill:view',
    );
  });

  test('editMessage и sendMessages тоже кодируются', async () => {
    const ctrl = new TestController();
    ctrl.name = 'questionnaire';
    ctrl.withCallbackResult({
      editMessage: {
        messageId: 5,
        text: 'Редактируем',
        keyboard: {
          rows: [
            [
              {
                text: '▶️',
                code: 'questionnaire:fill:resume:c1',
                takeover: true,
              },
            ],
          ],
          isMultiple: false,
        },
      },
      sendMessages: [
        {
          text: 'Первое',
          keyboard: {
            rows: [
              [
                {
                  text: '▶️',
                  code: 'questionnaire:fill:resume:c2',
                  takeover: true,
                },
              ],
            ],
            isMultiple: false,
          },
        },
      ],
    });

    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(makeActor()));

    const res = await app.handleCallback('questionnaire:fill:view', 1, {
      activeHandler: null,
    });

    expect(res.editMessage?.keyboard?.rows[0]?.[0]?.code).toBe(
      '!questionnaire:fill:resume:c1',
    );
    expect(res.sendMessages?.[0]?.keyboard?.rows[0]?.[0]?.code).toBe(
      '!questionnaire:fill:resume:c2',
    );
  });
});

// ── Снятие маркера при приёме + обход блокировки ──

describe('BotUiApp takeover — снятие маркера и обход блокировки', () => {
  test('маркер снимается: контроллер получает нативный код', async () => {
    const ctrl = new TestController();
    ctrl.name = 'questionnaire';

    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(makeActor()));

    await app.handleCallback('!questionnaire:fill:resume:c1', 1, {
      activeHandler: null,
    });

    expect(ctrl.callbackDatas[0]).toBe('fill:resume:c1');
  });

  test('чужой activeHandler + takeover → callback НЕ блокируется, захват перезаписывается', async () => {
    const lesson = new TestController();
    lesson.name = 'learning';
    const questionnaire = new TestController();
    questionnaire.name = 'questionnaire';
    questionnaire.withCallbackResult({
      sendMessage: { text: 'Вопрос анкеты' },
      captureInput: { path: 'fill', context: { questionnaireId: 'q1' } },
    });

    const app = new BotUiApp([lesson, questionnaire]);
    app.init(makeResolve(makeActor()));

    const session: SessionData = {
      activeHandler: { path: 'learning/hub', context: undefined },
    };
    const res = await app.handleCallback(
      '!questionnaire:fill:resume:c1',
      1,
      session,
    );

    // Контроллер анкеты получил callback (не блокировка)
    expect(res.sendMessage?.text).toBe('Вопрос анкеты');
    expect(questionnaire.callbackDatas).toEqual(['fill:resume:c1']);
    // Захват ввода перезаписан новой стори
    expect(session.activeHandler?.path).toBe('questionnaire/fill');
  });

  test('чужой activeHandler БЕЗ takeover → прежняя блокировка', async () => {
    const lesson = new TestController();
    lesson.name = 'learning';
    const questionnaire = new TestController();
    questionnaire.name = 'questionnaire';

    const app = new BotUiApp([lesson, questionnaire]);
    app.init(makeResolve(makeActor()));

    const session: SessionData = {
      activeHandler: { path: 'learning/hub' },
    };
    const res = await app.handleCallback(
      'questionnaire:fill:resume:c1',
      1,
      session,
    );

    expect(res.sendMessage?.text).toContain('завершите текущее действие');
    expect(questionnaire.callbackDatas).toHaveLength(0);
    // Захват не изменился
    expect(session.activeHandler?.path).toBe('learning/hub');
  });

  test('повторное кодирование не дублирует маркер', async () => {
    const ctrl = new TestController();
    ctrl.name = 'questionnaire';
    ctrl.withCallbackResult(takeoverResponse('!questionnaire:fill:resume:c1'));

    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(makeActor()));

    const res = await app.handleCallback('questionnaire:fill:view', 1, {
      activeHandler: null,
    });

    expect(res.sendMessage?.keyboard?.rows[0]?.[0]?.code).toBe(
      '!questionnaire:fill:resume:c1',
    );
  });
});

// ── handleMessage: ответ тоже кодируется ──

describe('BotUiApp takeover — кодирование в handleMessage', () => {
  test('ответ текстового шага с takeover-кнопкой получает маркер', async () => {
    const ctrl = new TestController();
    ctrl.name = 'questionnaire';
    ctrl.withMessageResult(takeoverResponse('questionnaire:fill:resume:c3'));

    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(makeActor()));

    const res = await app.handleMessage(
      { type: 'message', text: 'ответ', telegramId: 1 },
      1,
      { activeHandler: { path: 'questionnaire/fill' } },
    );

    expect(res?.sendMessage?.keyboard?.rows[0]?.[0]?.code).toBe(
      '!questionnaire:fill:resume:c3',
    );
  });
});
