import type {
  BotResponse,
  EditMessageDescription,
  KeyboardDescription,
  MessageDescription,
  SessionData,
} from '@u7-scl/core/ui';
import type {
  Question,
  QuestionnaireActionResponse,
} from '@u7-scl/questionnaire/domain';
import { buttons } from '../../shared/buttons';

/**
 * Общий рендер-слой questionnaire-контроллера: преобразует ответы
 * движка анкеты (QuestionnaireActionResponse) в команды транспорта.
 *
 * Коды кнопок — литеральные маршруты стори (канон Routes/buttons):
 * вопросные клавиатуры принадлежат fill-стори, клавиатура приглашения —
 * invite-стори. Префикс контроллера добавляется при отправке.
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
 * Рендерит ответ движка анкеты в команду транспорту.
 *
 * UX-контракт (spec FR-1/FR-2):
 * - `wait_next` (тоггл мультивыбора) — editMessage вопроса на месте
 *   (маркеры обновляются, клавиатура жива); fallback — sendMessage.
 * - `new_question` — предыдущий вопрос редактируется (финальные маркеры,
 *   клавиатура удаляется), новый вопрос отправляется новым сообщением.
 * - `completed` — аналогично new_question + финальное сообщение.
 *
 * Редактирование возможно только при `editPrev` (ответ в активном флоу)
 * и наличии `session.lastBotMessage` — проактивные сценарии (старт,
 * resume) всегда шлют sendMessage.
 */
export function renderActionResponse(
  response: QuestionnaireActionResponse,
  opts: { session?: SessionData; editPrev?: boolean } = {},
): BotResponse {
  const lastMsg = opts.session?.lastBotMessage;
  const canEditPrev = opts.editPrev === true && lastMsg !== undefined;

  if (response.type === 'wait_next') {
    return editOrSend(
      {
        text: formatQuestionMd(response.currentQuestion, {
          selected: response.selectedAnswers,
          progress: progressOf(response),
        }),
        parseMode: 'MarkdownV2',
        keyboard: getKeyboard(
          response.currentQuestion,
          response.questionnaireId,
          response.nextButton
            ? makeNextCode(response.questionnaireId, response.nextButton)
            : undefined,
        ),
      },
      canEditPrev ? lastMsg : undefined,
    );
  }

  if (response.type === 'new_question') {
    const nextMessage = {
      text: formatQuestionMd(response.question, {
        selected: response.selectedAnswers ?? [],
        progress: progressOf(response),
        isFirstQuestion: response.previousQuestion === undefined,
      }),
      parseMode: 'MarkdownV2' as const,
      keyboard: getKeyboard(response.question, response.questionnaireId),
    };

    const prevEdit = renderPreviousQuestion(
      response.previousQuestion,
      response.previousSelectedAnswers ?? [],
      canEditPrev ? lastMsg : undefined,
    );
    if (!prevEdit) return { sendMessage: nextMessage };
    return { editMessage: prevEdit, sendMessage: nextMessage };
  }

  if (response.type === 'completed') {
    const doneCommand: BotResponse = {
      releaseInput: true,
      sendMessage: {
        text: response.completionText ?? 'Спасибо! Твоя анкета принята.',
        keyboard: {
          rows: [[buttons.mainMenu()]],
          isMultiple: false,
        },
      },
    };

    const prevEdit = renderPreviousQuestion(
      response.previousQuestion,
      response.previousSelectedAnswers ?? [],
      canEditPrev ? lastMsg : undefined,
    );
    if (!prevEdit) return doneCommand;
    return { ...doneCommand, editMessage: prevEdit };
  }

  // invited — рендерим как приглашение
  return {
    sendMessage: {
      text: `📋 *Анкета*\n\n${response.inviteText ?? 'Заполните, пожалуйста, анкету.'}`,
      parseMode: 'MarkdownV2',
      keyboard: inviteKeyboard(response.questionnaireId, response.whyText),
    },
  };
}

/**
 * Рендер предыдущего вопроса для истории «вопрос → выбранный ответ»:
 * editMessage с финальными маркерами и БЕЗ клавиатуры.
 * Возвращает undefined, если редактировать нечем (нет сообщения/вопроса).
 */
function renderPreviousQuestion(
  previousQuestion: Question | undefined,
  selectedAnswers: string[],
  lastMsg: SessionData['lastBotMessage'],
): EditMessageDescription | undefined {
  if (!previousQuestion || !lastMsg) return undefined;
  return {
    messageId: lastMsg.messageId,
    text: formatQuestionMd(previousQuestion, {
      selected: selectedAnswers,
    }),
    parseMode: 'MarkdownV2',
  };
}

/** editMessage, если есть последнее сообщение бота; иначе sendMessage. */
function editOrSend(
  message: MessageDescription,
  lastMsg: SessionData['lastBotMessage'],
): BotResponse {
  if (lastMsg) {
    return {
      editMessage: {
        messageId: lastMsg.messageId,
        text: message.text,
        keyboard: message.keyboard,
        parseMode: message.parseMode,
      },
    };
  }
  return { sendMessage: message };
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
): string {
  const esc = (t: string) => t.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

  const header = options.progress
    ? `*Вопрос ${options.progress.questionIndex} из ${options.progress.poolSize}*\n\n`
    : '';

  const cancelHint = options.isFirstQuestion
    ? `\n\n${esc('В любой момент можно нажать /cancel — вернёшься в главное меню.')}`
    : '';

  if (question.type !== 'choice') {
    return `${header}*${esc(question.question)}*${cancelHint}`;
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
  return `${lines.join('\n')}${cancelHint}`;
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
