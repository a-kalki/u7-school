import type { BotResponse, KeyboardDescription } from '@u7-scl/core/ui';
import type {
  InviteResponse,
  Question,
  QuestionnaireActionResponse,
  QuestionnaireBotFacade,
} from '@u7-scl/questionnaire/domain';
import type { User } from '@u7-scl/user/domain';
import type { U7BotUiApp } from '../core/ui-app';

/**
 * Реализация QuestionnaireBotFacade для Telegram.
 *
 * Рендерит экраны анкеты (S01-S04) через uiApp.send().
 * Рендеринг вынесен из OnboardingController.
 */
export class TelegramQuestionnaireBotFacade implements QuestionnaireBotFacade {
  private readonly uiApp: U7BotUiApp;

  constructor(uiApp: U7BotUiApp) {
    this.uiApp = uiApp;
  }

  /**
   * S01 — Приглашение заполнить анкету.
   */
  async sendQuestionnaireInvite(
    user: User,
    response: InviteResponse,
  ): Promise<void> {
    const qId = response.questionnaireId;
    const buttons = [
      {
        text: '▶️ Начать заполнение',
        code: `questionnaire:fill:start:${qId}`,
      },
    ];

    if (response.whyText) {
      buttons.push({
        text: '❔ Зачем это нужно?',
        code: `questionnaire:fill:why:${qId}`,
      });
    }

    buttons.push({
      text: '⏭️ Пропустить',
      code: `questionnaire:fill:decline:${qId}`,
    });

    await this.uiApp.send(user.telegramId, {
      sendMessage: {
        text: `📋 *Анкета*\n\n${response.inviteText ?? 'Заполните, пожалуйста, анкету.'}\n\nДля отмены в любой момент нажмите /cancel\\.`,
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: buttons.map((b) => [b]),
          isMultiple: false,
        },
      },
    });
  }

  /**
   * S02-S04 — Вопросы анкеты / завершение.
   */
  async startQuestionnaire(
    user: User,
    response: QuestionnaireActionResponse,
  ): Promise<void> {
    const botRes = this.#renderActionResponse(response);
    await this.uiApp.send(user.telegramId, botRes);
  }

  // ── Рендеринг (из OnboardingController) ──

  #renderActionResponse(response: QuestionnaireActionResponse): BotResponse {
    const botRes: BotResponse = {};
    const qId = response.questionnaireId;

    if (response.type === 'wait_next') {
      botRes.sendMessage = {
        text: this.#formatQuestionMd(
          response.currentQuestion,
          response.selectedAnswers,
        ),
        keyboard: this.#getKeyboard(
          response.currentQuestion,
          response.nextButton
            ? this.#makeNextCode(qId, response.nextButton)
            : undefined,
        ),
        parseMode: 'MarkdownV2',
      };
      botRes.captureInput = { path: 'questionnaire/fill' };
      return botRes;
    }

    if (response.type === 'new_question') {
      botRes.sendMessage = {
        text: this.#formatQuestionMd(
          response.question,
          response.selectedAnswers ?? [],
        ),
        keyboard: this.#getKeyboard(response.question),
        parseMode: 'MarkdownV2',
      };
      botRes.captureInput = { path: 'questionnaire/fill' };
      return botRes;
    }

    if (response.type === 'completed') {
      botRes.releaseInput = true;
      botRes.questionnaireCompleted = true;
      botRes.sendMessage = {
        text: 'Спасибо! Ваша анкета принята.',
        keyboard: {
          rows: [[{ text: '↩️ Главное меню', code: 'app:main-menu' }]],
          isMultiple: false,
        },
      };
      return botRes;
    }

    return botRes;
  }

  /** Преобразует next:questionCode → questionnaire:fill:next:qId:questionCode */
  #makeNextCode(qId: string, nextButton: string): string {
    const questionCode = nextButton.startsWith('next:')
      ? nextButton.slice(5)
      : nextButton;
    return `questionnaire:fill:next:${qId}:${questionCode}`;
  }

  /** Форматирует вопрос и ответы в MarkdownV2 */
  #formatQuestionMd(question: Question, selected: string[]): string {
    const esc = (t: string) => t.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

    if (question.type !== 'choice') {
      return `*${esc(question.question)}*`;
    }

    const lines = [`*${esc(question.question)}*`, ''];
    let idx = 0;
    for (const a of question.answers) {
      idx++;
      const checked = selected.includes(a.answerCode);
      const marker = question.multiple
        ? checked
          ? '*\\[x\\]*'
          : '\\[ \\]'
        : checked
          ? '\\(x\\)'
          : '\\( \\)';
      lines.push(`${idx}\\. ${marker} ${esc(a.answer)}`);
    }
    return lines.join('\n');
  }

  #getKeyboard(
    question: Question,
    nextButton?: string,
  ): KeyboardDescription | undefined {
    if (question.type !== 'choice') return undefined;

    const buttons = question.answers.map((a, i) => ({
      text: String(i + 1),
      code: `questionnaire:fill:answer:${a.answerCode}`,
    }));

    const rows = [buttons];
    if (nextButton) {
      rows.push([{ text: 'Далее -->', code: nextButton }]);
    }

    return { rows, isMultiple: question.multiple };
  }
}
