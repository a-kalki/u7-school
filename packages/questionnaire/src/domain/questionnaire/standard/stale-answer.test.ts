import { describe, expect, test } from 'bun:test';
import type { Question, QuestionnairePool } from '../question';
import { QuestionnaireFactory } from '../questionnaire-factory';
import type { QuestionnaireAr } from './questionnaire-ar';

/**
 * Graceful-обработка неактуальных ответов (spec FR-1):
 * - чужой код кнопки (устаревшая клавиатура) → stale_answer (stale_button),
 *   состояние анкеты не меняется;
 * - «Далее» без выбора на multiple → stale_answer (empty_selection);
 * - валидные ответы работают без изменений.
 */

const RESPONDENT_ID = '00000000-0000-0000-0000-000000000007';

/** Пул: single (q1) → multiple (q2) → text (q3). */
function pool(): QuestionnairePool {
  return {
    inviteText: 'Приглашаем пройти опрос',
    questions: [
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
        question: 'Что интересно?',
        questionCode: 'q2',
        type: 'choice' as const,
        multiple: true,
        answers: [
          { answer: 'Фронтенд', answerCode: 'fe' },
          { answer: 'Бэкенд', answerCode: 'be' },
        ],
      },
      {
        question: 'Расскажи о себе',
        questionCode: 'q3',
        type: 'text' as const,
      },
    ] satisfies Question[],
  };
}

/** Анкета, запущенная и стоящая на первом вопросе (q1, single). */
function startedAr(): QuestionnaireAr {
  const ar = QuestionnaireFactory.createStandard(RESPONDENT_ID, pool());
  ar.start();
  return ar;
}

/** Снимок состояния для проверки «ничего не изменилось». */
function snapshot(ar: QuestionnaireAr) {
  return {
    status: ar.state.status,
    currentQuestionCode: ar.state.currentQuestionCode,
    draftAnswers: { ...ar.state.draftAnswers },
    answers: ar.state.answers.map((a) => ({ ...a })),
  };
}

describe('Graceful stale-ответы (FR-1)', () => {
  test('single-choice: чужой код ответа → stale_answer (stale_button), состояние не меняется', () => {
    const ar = startedAr();
    const before = snapshot(ar);

    const response = ar.handleAction({ type: 'callback', value: 'alien' });

    expect(response.type).toBe('stale_answer');
    if (response.type === 'stale_answer') {
      expect(response.reason).toBe('stale_button');
      expect(response.questionnaireId).toBe(ar.state.uuid);
      // Актуальный вопрос возвращается — UI перерисует его
      expect(response.question.questionCode).toBe('q1');
      expect(response.selectedAnswers).toEqual([]);
      expect(response.cancelWarning).toBe(ar.state.questionPool.cancelWarning);
    }
    expect(snapshot(ar)).toEqual(before);
  });

  test('single-choice: чужой код кнопки «Далее» → stale_answer (stale_button), состояние не меняется', () => {
    const ar = startedAr();
    const before = snapshot(ar);
    const response = ar.handleAction({ type: 'callback', value: 'next:q9' });

    expect(response.type).toBe('stale_answer');
    if (response.type === 'stale_answer') {
      expect(response.reason).toBe('stale_button');
      expect(response.question.questionCode).toBe('q1');
    }
    expect(snapshot(ar)).toEqual(before);
  });

  test('multiple: тоггл чужого кода → stale_answer (stale_button), драфт не меняется', () => {
    const ar = startedAr();
    ar.handleAction({ type: 'callback', value: 'yes' }); // → q2 (multiple)

    // Валидный тоггл — драфт записан
    const toggle = ar.handleAction({ type: 'callback', value: 'fe' });
    expect(toggle.type).toBe('wait_next');
    expect(ar.state.draftAnswers).toEqual({ q2: 'fe' });

    const before = snapshot(ar);
    const response = ar.handleAction({ type: 'callback', value: 'alien' });

    expect(response.type).toBe('stale_answer');
    if (response.type === 'stale_answer') {
      expect(response.reason).toBe('stale_button');
      expect(response.question.questionCode).toBe('q2');
      // Драфт survives: выбранный ранее вариант виден в ответе
      expect(response.selectedAnswers).toEqual(['fe']);
    }
    expect(snapshot(ar)).toEqual(before);
  });

  test('multiple: «Далее» без единого выбора → stale_answer (empty_selection)', () => {
    const ar = startedAr();
    ar.handleAction({ type: 'callback', value: 'yes' }); // → q2 (multiple)

    const before = snapshot(ar);
    const response = ar.handleAction({ type: 'callback', value: 'next:q2' });

    expect(response.type).toBe('stale_answer');
    if (response.type === 'stale_answer') {
      expect(response.reason).toBe('empty_selection');
      expect(response.question.questionCode).toBe('q2');
      expect(response.selectedAnswers).toEqual([]);
    }
    expect(snapshot(ar)).toEqual(before);
  });

  test('multiple: «Далее» после снятия всех вариантов → stale_answer (empty_selection)', () => {
    const ar = startedAr();
    ar.handleAction({ type: 'callback', value: 'yes' }); // → q2
    ar.handleAction({ type: 'callback', value: 'fe' }); // выбрали
    ar.handleAction({ type: 'callback', value: 'fe' }); // сняли

    const response = ar.handleAction({ type: 'callback', value: 'next:q2' });
    expect(response.type).toBe('stale_answer');
    if (response.type === 'stale_answer') {
      expect(response.reason).toBe('empty_selection');
    }
  });

  // ── Регресс: валидные флоу не сломаны ──

  test('single-choice: валидный ответ → переход к следующему вопросу', () => {
    const ar = startedAr();
    const response = ar.handleAction({ type: 'callback', value: 'yes' });
    expect(response.type).toBe('new_question');
    expect(ar.state.answers.length).toBe(1);
  });

  test('multiple: выбор + «Далее» → переход дальше, драфт очищен', () => {
    const ar = startedAr();
    ar.handleAction({ type: 'callback', value: 'yes' }); // → q2
    ar.handleAction({ type: 'callback', value: 'fe' });
    const response = ar.handleAction({ type: 'callback', value: 'next:q2' });

    expect(response.type).toBe('new_question');
    if (response.type === 'new_question') {
      expect(response.question.questionCode).toBe('q3');
    }
    expect(ar.state.draftAnswers).toEqual({});
    expect(ar.state.answers.length).toBe(2);
  });

  test('text: нажатие устаревшей кнопки (callback) → stale_answer (stale_button), состояние не меняется', () => {
    const ar = startedAr();
    ar.handleAction({ type: 'callback', value: 'yes' }); // → q2
    ar.handleAction({ type: 'callback', value: 'fe' });
    ar.handleAction({ type: 'callback', value: 'next:q2' }); // → q3 (text)

    const before = snapshot(ar);
    const response = ar.handleAction({ type: 'callback', value: 'fe' });

    expect(response.type).toBe('stale_answer');
    if (response.type === 'stale_answer') {
      expect(response.reason).toBe('stale_button');
      expect(response.question.questionCode).toBe('q3');
    }
    expect(snapshot(ar)).toEqual(before);
  });

  test('text: кнопка «Далее» (callback) → stale_answer (stale_button), состояние не меняется', () => {
    const ar = startedAr();
    ar.handleAction({ type: 'callback', value: 'yes' }); // → q2
    ar.handleAction({ type: 'callback', value: 'fe' });
    ar.handleAction({ type: 'callback', value: 'next:q2' }); // → q3 (text)

    const before = snapshot(ar);
    const response = ar.handleAction({ type: 'callback', value: 'next:q2' });

    expect(response.type).toBe('stale_answer');
    if (response.type === 'stale_answer') {
      expect(response.reason).toBe('stale_button');
      expect(response.question.questionCode).toBe('q3');
    }
    expect(snapshot(ar)).toEqual(before);
  });

  test('text: валидный текст → переход к завершению анкеты', () => {
    const ar = startedAr();
    ar.handleAction({ type: 'callback', value: 'yes' }); // → q2
    ar.handleAction({ type: 'callback', value: 'fe' });
    ar.handleAction({ type: 'callback', value: 'next:q2' }); // → q3 (text)

    const response = ar.handleAction({
      type: 'text',
      value: 'Меня зовут Иван',
    });
    expect(response.type).toBe('completed');
    expect(ar.state.status).toBe('completed');
  });
});
