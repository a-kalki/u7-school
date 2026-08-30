import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import type { QuestionnaireApiModule } from '@u7-scl/questionnaire/api';
import { FillStory } from './fill.story';

/**
 * UX одиночного выбора: маркер (x), удаление клавиатуры, автопереход
 * (см. spec FR-1). Общий рендер с Фазой 1 — new_question.
 */

// ══ Помощники ══

const actor = { uuid: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee' } as User;

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

/** Следующий вопрос (тоже radio — проверка отсутствия «Далее»). */
const nextRadioQuestion = {
  questionCode: 'qc2',
  type: 'choice' as const,
  multiple: false,
  question: 'Как удобнее учиться?',
  answers: [
    { answer: 'Сам', answerCode: 'solo' },
    { answer: 'С ментором', answerCode: 'mentor' },
  ],
};

/** Текстовый вопрос (без клавиатуры). */
const textQuestion = {
  questionCode: 'qc2',
  type: 'text' as const,
  question: 'Опиши свою цель',
};

function fillSession(lastBotMessageId = 42): SessionData {
  return {
    activeHandler: {
      path: 'questionnaire/fill',
      context: { questionnaireId: 'q-1' },
    },
    lastBotMessage: {
      messageId: lastBotMessageId,
      text: 'Какой у тебя опыт?',
      keyboard: {
        rows: [
          [{ text: '1', code: 'x1' }],
          [{ text: '2', code: 'x2' }],
          [{ text: '3', code: 'x3' }],
        ],
        isMultiple: false,
      },
    },
  } as unknown as SessionData;
}

function makeStory(
  execute: (name: string, cmd: unknown, actorId: string) => Promise<unknown>,
) {
  const qmod = {
    execute: mock(execute),
  } as unknown as QuestionnaireApiModule;
  const story = new FillStory(qmod);
  const sender = { send: mock(async () => {}), notify: mock(async () => {}) };
  story.init({} as never, sender);
  return { story, sender };
}

// ══ Тесты ══

describe('FillStory UX — одиночный выбор (radio)', () => {
  test('выбор варианта → editMessage с маркером (x) у выбранного и БЕЗ клавиатуры + sendMessage следующего', async () => {
    const { story } = makeStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: nextRadioQuestion,
      previousQuestion: radioQuestion,
      previousSelectedAnswers: ['mid'],
      questionIndex: 2,
      poolSize: 3,
    }));
    const session = fillSession();

    const res = await story.handleCallback('answer:q-1:mid', actor, session);

    // Комбинированная команда: edit предыдущего + send следующего
    expect(res.editMessage).toBeDefined();
    expect(res.editMessage?.messageId).toBe(42);
    expect(res.sendMessage).toBeDefined();

    // Маркер radio: (x) у выбранного, ( ) у остальных
    expect(res.editMessage?.text).toContain('\\(x\\)');
    expect(res.editMessage?.text).toContain('\\( \\)');
    expect(res.editMessage?.text).toContain('Какой у тебя опыт?');

    // Клавиатура у предыдущего вопроса удалена
    expect(res.editMessage?.keyboard).toBeUndefined();

    // Автопереход: следующий вопрос без кнопки «Далее»
    const texts = res.sendMessage?.keyboard?.rows.flat().map((b) => b.text);
    expect(texts).toEqual(['1', '2']);
    expect(texts).not.toContain('Далее -->');
    expect(res.sendMessage?.text).toContain('Как удобнее учиться?');
  });

  test('история сохраняется: предыдущее сообщение остаётся в чате (edit, не delete+send)', async () => {
    const { story } = makeStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: textQuestion,
      previousQuestion: radioQuestion,
      previousSelectedAnswers: ['senior'],
      questionIndex: 2,
      poolSize: 3,
    }));
    const session = fillSession(777);

    const res = await story.handleCallback('answer:q-1:senior', actor, session);

    // Редактируется именно прежнее сообщение (messageId 777), а не шлётся заново
    expect(res.editMessage?.messageId).toBe(777);
    expect(res.editMessage?.text).toContain('Какой у тебя опыт?');
    expect(res.editMessage?.text).toContain('\\(x\\)');
    // Новый вопрос — отдельным сообщением
    expect(res.sendMessage?.text).toContain('Опиши свою цель');
  });

  test('завершение после radio-ответа → editMessage с маркером + sendMessage completed', async () => {
    const { story } = makeStory(async () => ({
      type: 'completed',
      questionnaireId: 'q-1',
      previousQuestion: radioQuestion,
      previousSelectedAnswers: ['novice'],
      completionText: 'Спасибо!',
    }));
    const session = fillSession();

    const res = await story.handleCallback('answer:q-1:novice', actor, session);

    expect(res.releaseInput).toBe(true);
    expect(res.editMessage?.text).toContain('\\(x\\)');
    expect(res.editMessage?.keyboard).toBeUndefined();
    expect(res.sendMessage?.text).toBe('Спасибо!');
  });

  test('проактивный контекст (без lastBotMessage) — только sendMessage', async () => {
    const { story } = makeStory(async () => ({
      type: 'new_question',
      questionnaireId: 'q-1',
      question: textQuestion,
      previousQuestion: radioQuestion,
      previousSelectedAnswers: ['mid'],
    }));
    const session = { activeHandler: null } as unknown as SessionData;

    const res = await story.handleCallback('answer:q-1:mid', actor, session);

    expect(res.editMessage).toBeUndefined();
    expect(res.sendMessage?.text).toContain('Опиши свою цель');
  });
});
