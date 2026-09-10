import { escapeMarkdown, type MdText, mdRaw } from '@u7-scl/core/shared';
import type { DialogResponse, KeyboardDescription } from '@u7-scl/core/ui';
import type {
  Question,
  QuestionnaireActionResponse,
} from '@u7-scl/questionnaire/domain';
import { buttons } from '../../shared/buttons';

/**
 * Общий рендер-слой questionnaire-контроллера: преобразует ответы
 * движка анкеты (QuestionnaireActionResponse) в декларативный
 * DialogResponse контракта «Диалог и Экран».
 *
 * Ответы стори несут маршруты БЕЗ префикса контроллера (его добавляет
 * контроллер при отправке); полные коды invite-канала (проактивы) —
 * только в Routes (канон кросс-адресов).
 *
 * Рендер-политика (§5 материнского дока):
 * - `wait_next` (тоггл мультивыбора) — только screen: транспорт владеет
 *   экраном и редактирует его на месте (маркеры обновляются, клавиатура жива);
 * - `stale_answer` — warn-реплика (notify), экран и ввод не трогаем:
 *   экран и так показывает актуальный вопрос (spec FR-1);
 * - `new_question` — finalize предыдущего вопроса (финальные маркеры,
 *   клавиатуру снимает транспорт) + screen нового;
 * - `completed` — finalize + финальный screen + release (ввод отпущен).
 */

/** Клавиатура приглашения S01 (обработчики в invite-стори). */
export function inviteKeyboard(
  qId: string,
  whyText?: string,
): KeyboardDescription | undefined {
  const rows: { text: string; code: string }[][] = [
    [{ text: '▶️ Начать заполнение', code: `invite:start:${qId}` }],
  ];

  if (whyText) {
    rows.push([{ text: '❔ Зачем это нужно?', code: `invite:why:${qId}` }]);
  }

  rows.push([{ text: '⏭️ Пропустить', code: `invite:decline:${qId}` }]);

  return { rows, isMultiple: false };
}

/**
 * Рендерит ответ движка анкеты в DialogResponse.
 */
export function renderActionResponse(
  response: QuestionnaireActionResponse,
): DialogResponse {
  if (response.type === 'wait_next') {
    return {
      screen: {
        text: formatQuestionMd(response.currentQuestion, {
          selected: response.selectedAnswers,
          progress: progressOf(response),
        }),
        keyboard: getKeyboard(
          response.currentQuestion,
          response.questionnaireId,
          response.nextButton
            ? makeNextCode(response.questionnaireId, response.nextButton)
            : undefined,
        ),
      },
    };
  }

  if (response.type === 'stale_answer') {
    // Реплика-подсказка по reason (spec FR-1), без перерисовки.
    const hint =
      response.reason === 'stale_button'
        ? '⚠️ Эта кнопка относится к предыдущему вопросу\\.'
        : '⚠️ Сначала выбери хотя бы один вариант\\.';
    return { notify: { text: mdRaw(hint), kind: 'warn' } };
  }

  if (response.type === 'new_question') {
    const result: DialogResponse = {
      screen: {
        text: formatQuestionMd(response.question, {
          selected: response.selectedAnswers ?? [],
          progress: progressOf(response),
          isFirstQuestion: response.previousQuestion === undefined,
        }),
        keyboard: getKeyboard(response.question, response.questionnaireId),
      },
    };
    if (response.previousQuestion) {
      result.finalize = {
        text: formatQuestionMd(response.previousQuestion, {
          selected: response.previousSelectedAnswers ?? [],
        }),
      };
    }
    return result;
  }

  if (response.type === 'completed') {
    const result: DialogResponse = {
      screen: {
        text: mdRaw(
          escapeMarkdown(
            response.completionText ?? 'Спасибо! Твоя анкета принята.',
          ),
        ),
        keyboard: { rows: [[buttons.mainMenu()]], isMultiple: false },
      },
      release: true,
    };
    if (response.previousQuestion) {
      result.finalize = {
        text: formatQuestionMd(response.previousQuestion, {
          selected: response.previousSelectedAnswers ?? [],
        }),
      };
    }
    return result;
  }

  // invited — рендерим как приглашение
  return {
    screen: {
      text: mdRaw(
        `📋 *Анкета*\n\n${escapeMarkdown(response.inviteText ?? 'Заполните, пожалуйста, анкету.')}`,
      ),
      keyboard: inviteKeyboard(response.questionnaireId, response.whyText),
    },
  };
}

function makeNextCode(qId: string, nextButton: string): string {
  const questionCode = nextButton.startsWith('next:')
    ? nextButton.slice(5)
    : nextButton;
  return `fill:next:${qId}:${questionCode}`;
}

function formatQuestionMd(
  question: Question,
  options: {
    selected: string[];
    progress?: { questionIndex: number; poolSize: number };
    isFirstQuestion?: boolean;
  },
): MdText {
  const esc = (t: string) => t.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

  const header = options.progress
    ? `*Вопрос ${options.progress.questionIndex} из ${options.progress.poolSize}*\n\n`
    : '';

  const cancelHint = options.isFirstQuestion
    ? '\n\nВ любой момент можно нажать /cancel — вернёшься в главное меню.'
    : '';

  if (question.type !== 'choice') {
    // Подсказка текстового ввода (ui-spec S03)
    return mdRaw(
      `${header}*${esc(question.question)}*\n\nВведите ваш ответ текстом\\.\\.\\.${esc(cancelHint)}`,
    );
  }

  const lines = [`${header}*${esc(question.question)}*`, ''];
  let idx = 0;
  for (const a of question.answers) {
    idx++;
    const checked = options.selected.includes(a.answerCode);
    const marker = question.multiple
      ? checked
        ? '*\\[x\\]*'
        : '\\[ \\]'
      : checked
        ? '\\(x\\)'
        : '\\( \\)';
    lines.push(`${idx}\\. ${marker} ${esc(a.answer)}`);
  }
  return mdRaw(`${lines.join('\n')}${esc(cancelHint)}`);
}

/** Достаёт прогресс из ответа UC (поля опциональны). */
function progressOf(response: {
  questionIndex?: number;
  poolSize?: number;
}): { questionIndex: number; poolSize: number } | undefined {
  if (response.questionIndex === undefined || response.poolSize === undefined) {
    return undefined;
  }
  return {
    questionIndex: response.questionIndex,
    poolSize: response.poolSize,
  };
}

function getKeyboard(
  question: Question,
  questionnaireId: string,
  nextButton?: string,
): KeyboardDescription | undefined {
  if (question.type !== 'choice') return undefined;

  // Код кнопки обязан нести questionnaireId: handle-action без него
  // не знает, к какой анкете относится выбор (см. fill-стори, 'answer:').
  const buttons = question.answers.map((a, i) => ({
    text: String(i + 1),
    code: `fill:answer:${questionnaireId}:${a.answerCode}`,
  }));

  const rows = [buttons];
  if (nextButton) {
    rows.push([{ text: 'Далее -->', code: nextButton }]);
  }

  return { rows, isMultiple: question.multiple };
}
