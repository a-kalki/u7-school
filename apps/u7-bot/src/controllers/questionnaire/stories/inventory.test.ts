import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { U7BotApp } from '@u7-scl/bot/u7-bot-app-meta';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { FillStory } from './fill.story';
import { InviteStory } from './invite.story';
import { renderActionResponse } from './render';

/**
 * ИНВЕНТАРИЗАЦИЯ кнопок и реплик анкетных стори (протокол «миграция без
 * потери функциональности», решение владельца ревью трека 3): точные
 * ассерты текста и кода КАЖДОЙ кнопки каждого экрана на контракте
 * «Диалог и Экран» (DialogResponse). Миграция обязана воспроизвести
 * каждую кнопку — этот файл — канонический список.
 *
 * Коды кнопок в ответах стори — без префикса контроллера (префиксует
 * контроллер); в проактивном invite-канале (подписки) — полные коды
 * `questionnaire:…` (транспорт проактивы не префиксует).
 */

// ══ Хелперы ══

const actor = { uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } as User;

/** Сессия активного fill-диалога (ожидание ввода с анкетой). */
function fillSession(qId = 'q-1'): BotSession {
  return {
    dialog: {
      path: 'questionnaire/fill',
      seq: 3,
      input: { context: { questionnaireId: qId } },
    },
  };
}

/** Мок proactiveSender нового контракта (notify/invite, send удалён). */
function makeSender() {
  return {
    notify: mock(async () => {}),
    invite: mock(async () => {}),
    kickFromGroup: mock(async () => {}),
  };
}

function makeFillStory(
  execute: (name: string, cmd: unknown, actorId: string) => Promise<unknown>,
) {
  const appApi = { execute: mock(execute) } as unknown as U7BotApp;
  const story = new FillStory();
  const sender = makeSender();
  story.init({ appApi } as never, sender);
  return { story, appApi, sender };
}

function makeInviteStory(
  execute: (name: string, cmd: unknown, actorId: string) => Promise<unknown> = async () => ({}),
) {
  const appApi = { execute: mock(execute) } as unknown as U7BotApp;
  const story = new InviteStory();
  const sender = makeSender();
  story.init({ appApi } as never, sender);
  return { story, appApi, sender };
}

/** Одиночный выбор: три варианта. */
const radioQuestion = {
  questionCode: 'qc1',
  type: 'choice' as const,
  multiple: false,
  question: 'Какой у тебя опыт?',
  answers: [
    { answer: 'Новичок', answerCode: 'novice' },
    { answer: 'Средний', answerCode: 'mid' },
    { answer: 'Senior', answerCode: 'senior' },
  ],
};

/** Множественный выбор: два варианта. */
const multiQuestion = {
  questionCode: 'qc1',
  type: 'choice' as const,
  multiple: true,
  question: 'Что интересно?',
  answers: [
    { answer: 'Фронтенд', answerCode: 'fe' },
    { answer: 'Бэкенд', answerCode: 'be' },
  ],
};

/** Текстовый вопрос. */
const textQuestion = {
  questionCode: 'qc2',
  type: 'text' as const,
  question: 'Расскажи о себе',
};

/** Плоский список [текст, код] всех кнопок ответа. */
function flatButtons(res: DialogResponse): Array<[string, string]> {
  return (res.screen?.keyboard?.rows ?? []).flat().map((b) => [b.text, b.code]);
}

// ══ FillStory — инвентаризация экранов ══

describe('Инвентаризация FillStory', () => {
  test('S02a single: кнопки-варианты в одном ряду, коды fill:answer:{qId}:{aCode}', async () => {
    const { story } = makeFillStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: radioQuestion,
      questionIndex: 1,
      poolSize: 3,
    }));

    const res = await story.handleCallback(
      'current:q-1',
      actor,
      fillSession(),
    );

    expect(flatButtons(res)).toEqual([
      ['1', 'fill:answer:q-1:novice'],
      ['2', 'fill:answer:q-1:mid'],
      ['3', 'fill:answer:q-1:senior'],
    ]);
    expect(res.screen?.keyboard?.isMultiple).toBe(false);
  });

  test('S02b multiple: варианты + «Далее -->» отдельным рядом, код fill:next:{qId}:{qCode}', async () => {
    const { story } = makeFillStory(async () => ({
      type: 'wait_next',
      questionnaireId: 'q-1',
      currentQuestion: multiQuestion,
      selectedAnswers: ['fe'],
      nextButton: 'next:qc1',
    }));

    const res = await story.handleCallback(
      'answer:q-1:be',
      actor,
      fillSession(),
    );

    expect(res.screen?.keyboard?.rows.map((r) => r.map((b) => [b.text, b.code]))).toEqual([
      [
        ['1', 'fill:answer:q-1:fe'],
        ['2', 'fill:answer:q-1:be'],
      ],
      [['Далее -->', 'fill:next:q-1:qc1']],
    ]);
    expect(res.screen?.keyboard?.isMultiple).toBe(true);
  });

  test('S03 text: без клавиатуры, подсказка «Введите ваш ответ текстом...»', async () => {
    const { story } = makeFillStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: textQuestion,
      questionIndex: 2,
      poolSize: 3,
    }));

    const res = await story.handleCallback(
      'current:q-1',
      actor,
      fillSession(),
    );

    expect(res.screen?.keyboard).toBeUndefined();
    expect(String(res.screen?.text)).toContain('Введите ваш ответ текстом');
  });

  test('S04 completed: кнопка «↩️ Главное меню» (app:main-menu) + release', async () => {
    const { story } = makeFillStory(async () => ({
      type: 'completed',
      questionnaireId: 'q-1',
      previousQuestion: radioQuestion,
      previousSelectedAnswers: ['novice'],
      completionText: 'Спасибо! Анкета принята.',
    }));

    const res = await story.handleCallback(
      'answer:q-1:novice',
      actor,
      fillSession(),
    );

    expect(flatButtons(res)).toEqual([['↩️ Главное меню', 'app:main-menu']]);
    expect(res.release).toBe(true);
  });

  test('S05a cancel: confirm-кнопки «Да, прервать» / «Нет, продолжить» с qId', async () => {
    const { story } = makeFillStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: radioQuestion,
      cancelWarning: 'Данные не сохранятся.',
    }));

    const res = await story.handleCallback('cancel:q-1', actor, fillSession());

    expect(String(res.screen?.text)).toContain('Вы уверены, что хотите прервать анкету?');
    expect(String(res.screen?.text)).toContain('Данные не сохранятся');
    expect(flatButtons(res)).toEqual([
      ['✅ Да, прервать', 'fill:cancel-confirm:q-1'],
      ['❌ Нет, продолжить', 'fill:current:q-1'],
    ]);
  });

  test('S05b cancel-confirm: «Анкета прервана.» + главное меню + release', async () => {
    const { story } = makeFillStory(async () => undefined);

    const res = await story.handleCallback(
      'cancel-confirm:q-1',
      actor,
      fillSession(),
    );

    expect(String(res.screen?.text)).toContain('Анкета прервана');
    expect(flatButtons(res)).toEqual([['↩️ Главное меню', 'app:main-menu']]);
    expect(res.release).toBe(true);
  });

  test('fill:resume:{courseId}: экран вопроса + awaitInput с questionnaireId', async () => {
    const { story } = makeFillStory(async (name) => {
      if (name === 'get-questionnaires-by-user') {
        return [
          {
            kind: 'standard',
            uuid: 'q-1',
            status: 'in_progress',
            ownerInfo: { courseId: 'course-1' },
          },
        ];
      }
      if (name === 'get-current') {
        return {
          type: 'new_question',
          questionnaireId: 'q-1',
          question: textQuestion,
        };
      }
      throw new Error(`Неожиданный UC: ${name}`);
    });

    const res = await story.handleCallback('resume:course-1', actor, fillSession());

    expect(String(res.screen?.text)).toContain('Расскажи о себе');
    expect(res.awaitInput?.context).toEqual({ questionnaireId: 'q-1' });
  });

  test('fill:resume — анкета не найдена: экран с главным меню', async () => {
    const { story } = makeFillStory(async () => []);

    const res = await story.handleCallback('resume:course-1', actor, fillSession());

    expect(String(res.screen?.text)).toContain('Анкета не найдена');
    expect(flatButtons(res)).toEqual([['↩️ Главное меню', 'app:main-menu']]);
  });

  test('fill:current:{qId}: экран вопроса + awaitInput (восстановление флоу)', async () => {
    const { story } = makeFillStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: textQuestion,
    }));

    const res = await story.handleCallback('current:q-1', actor, {
      dialog: { path: 'app/menu', seq: 5 },
    });

    expect(String(res.screen?.text)).toContain('Расскажи о себе');
    expect(res.awaitInput?.context).toEqual({ questionnaireId: 'q-1' });
  });

  test('неизвестный action: экран «⚠️ Неизвестная команда» без кнопок', async () => {
    const { story } = makeFillStory(async () => ({}));

    const res = await story.handleCallback('nonsense:1', actor, fillSession());

    expect(String(res.screen?.text)).toContain('Неизвестная команда');
    expect(res.screen?.keyboard).toBeUndefined();
  });
});

// ══ InviteStory — инвентаризация экранов ══

describe('Инвентаризация InviteStory', () => {
  test('S01 (подписка questionnaire:invite): invite-канал, ПОЛНЫЕ коды кнопок', async () => {
    const { story, sender } = makeInviteStory();

    const sub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:invite');
    expect(sub).toBeDefined();

    await sub!.handle({
      eventName: 'questionnaire:invite',
      payload: {
        telegramId: 456,
        response: {
          type: 'invited',
          questionnaireId: 'q1',
          inviteText: 'Заполните анкету',
          whyText: 'Для обучения',
        },
      },
    } as never);

    expect(sender.invite).toHaveBeenCalledTimes(1);
    const [telegramId, payload] = sender.invite.mock.calls[0] as [
      number,
      { text: string; keyboard: { rows: { text: string; code: string }[][] } },
    ];
    expect(telegramId).toBe(456);
    expect(payload.text).toContain('Анкета');
    expect(payload.text).toContain('Заполните анкету');
    // Подсказка /start на случай устаревшего экрана (вариант A)
    expect(payload.text).toContain('/start');

    expect(payload.keyboard.rows.map((r) => r.map((b) => [b.text, b.code]))).toEqual([
      [['▶️ Начать заполнение', 'questionnaire:invite:start:q1']],
      [['❔ Зачем это нужно?', 'questionnaire:invite:why:q1']],
      [['⏭️ Пропустить', 'questionnaire:invite:decline:q1']],
    ]);
  });

  test('S01 без whyText: кнопка «Зачем это нужно?» не показывается', async () => {
    const { story, sender } = makeInviteStory();

    const sub = story
      .getEventSubscriptions()
      .find((s) => s.eventName === 'questionnaire:invite')!;

    await sub.handle({
      eventName: 'questionnaire:invite',
      payload: {
        telegramId: 456,
        response: { type: 'invited', questionnaireId: 'q1' },
      },
    } as never);

    const [, payload] = sender.invite.mock.calls[0] as unknown as [
      number,
      { keyboard: { rows: { text: string; code: string }[][] } },
    ];
    expect(payload.keyboard.rows.flat().map((b) => b.text)).toEqual([
      '▶️ Начать заполнение',
      '⏭️ Пропустить',
    ]);
  });

  test('invite:why:{qId}: экран whyText + кнопка «✅ Хорошо» → invite:invite', async () => {
    const { story } = makeInviteStory(async () => ({
      type: 'invited',
      questionnaireId: 'q1',
      whyText: 'Для обучения',
    }));

    const res = await story.handleCallback('why:q1', actor, fillSession());

    expect(String(res.screen?.text)).toContain('Для обучения');
    expect(flatButtons(res)).toEqual([['✅ Хорошо', 'invite:invite:q1']]);
  });

  test('invite:invite:{qId}: повторный S01, кнопки start/why/decline', async () => {
    const { story } = makeInviteStory(async () => ({
      type: 'invited',
      questionnaireId: 'q1',
      inviteText: 'Заполните анкету',
      whyText: 'Для обучения',
    }));

    const res = await story.handleCallback('invite:q1', actor, fillSession());

    expect(String(res.screen?.text)).toContain('Заполните анкету');
    expect(flatButtons(res)).toEqual([
      ['▶️ Начать заполнение', 'invite:start:q1'],
      ['❔ Зачем это нужно?', 'invite:why:q1'],
      ['⏭️ Пропустить', 'invite:decline:q1'],
    ]);
  });

  test('invite:decline:{qId} (S06a): confirm-кнопки с cancelWarning', async () => {
    const { story } = makeInviteStory(async () => ({
      type: 'invited',
      questionnaireId: 'q1',
      cancelWarning: 'Придётся заполнять с начала.',
    }));

    const res = await story.handleCallback('decline:q1', actor, fillSession());

    expect(String(res.screen?.text)).toContain('Вы уверены, что хотите пропустить анкету?');
    expect(String(res.screen?.text)).toContain('Придётся заполнять с начала');
    expect(flatButtons(res)).toEqual([
      ['✅ Да, пропустить', 'invite:decline-confirm:q1'],
      ['❌ Нет, вернуться', 'invite:invite:q1'],
    ]);
  });

  test('invite:decline-confirm:{qId} (S06b): «Анкета пропущена.» + меню + release', async () => {
    const { story } = makeInviteStory(async () => undefined);

    const res = await story.handleCallback('decline-confirm:q1', actor, fillSession());

    expect(String(res.screen?.text)).toContain('Анкета пропущена');
    expect(flatButtons(res)).toEqual([['↩️ Главное меню', 'app:main-menu']]);
    expect(res.release).toBe(true);
  });

  test('invite:start:{qId}: delegate в fill:current:{qId} (диалог fill, не invite)', async () => {
    const { story } = makeInviteStory(async (name) => {
      if (name === 'start-by-invite') return { ok: true };
      if (name === 'get-current') {
        return {
          type: 'new_question',
          questionnaireId: 'q-1',
          question: textQuestion,
        };
      }
      throw new Error(`Неожиданный UC: ${name}`);
    });

    const res = await story.handleCallback('start:q-1', actor, fillSession());

    // Делегат: ввод анкеты адресуется fill-стори, а не invite
    expect(res.delegate?.path).toBe('fill:current:q-1');
  });
});

// ══ renderActionResponse — invited-ветка ══

describe('Инвентаризация render.ts — renderActionResponse(invited)', () => {
  test('invited: экран приглашения с кнопками invite-стори', () => {
    const res = renderActionResponse({
      type: 'invited',
      questionnaireId: 'q1',
      inviteText: 'Заполните анкету',
      whyText: 'Для обучения',
    });

    expect(String(res.screen?.text)).toContain('Заполните анкету');
    expect(flatButtons(res)).toEqual([
      ['▶️ Начать заполнение', 'invite:start:q1'],
      ['❔ Зачем это нужно?', 'invite:why:q1'],
      ['⏭️ Пропустить', 'invite:decline:q1'],
    ]);
  });
});
