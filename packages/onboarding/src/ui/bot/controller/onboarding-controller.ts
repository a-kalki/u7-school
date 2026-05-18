import type { AppException } from '@u7/core/domain';
import { escapeMarkdown } from '@u7/core/shared';
import type { Logger } from '@u7/core/shared';
import type { Question } from '#domain/questionnaire/question';
import type { QuestionnaireActionResponse } from '#domain/questionnaire/types';
import type { OnboardingBotApp } from '../app';
import type { BotResponse, BotUpdate, KeyboardDescription } from '../types';

/**
 * Контроллер onboarding для Telegram-бота.
 * Stateless — на каждый запрос получает актуальное состояние из API или выполняет действие.
 * botUuid передаётся в handleUpdate (не в конструктор) и используется как actorId.
 */
export class OnboardingController {
  readonly #app: OnboardingBotApp;
  readonly #logger: Logger | undefined;

  constructor(app: OnboardingBotApp, logger?: Logger) {
    this.#app = app;
    this.#logger = logger;
  }

  /**
   * Основной обработчик событий.
   * @param botUuid — UUID бота, используется как actorId для всех API-вызовов
   */
  async handleUpdate(update: BotUpdate, botUuid: string): Promise<BotResponse> {
    try {
      if (update.type === 'command') {
        return this.#handleCommand(update, botUuid);
      }

      // message или callback — форвардим в handle-action
      return this.#handleAction(update, botUuid);
    } catch (err) {
      this.#logger?.error(
        'onboarding-controller',
        'Необработанная ошибка в handleUpdate',
        {
          error: String(err),
          telegramId: 'telegramId' in update ? update.telegramId : undefined,
        },
      );
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
      return { sendMessage: { text: `⚠️ Произошла ошибка: ${message}` } };
    }
  }

  // ── Обработка команд ──

  async #handleCommand(
    update: BotUpdate & { type: 'command' },
    botUuid: string,
  ): Promise<BotResponse> {
    switch (update.command) {
      case 'start':
        return this.#startOrResumeOnboarding(update.telegramId, botUuid);

      case 'cancel':
        return this.#cancelOnboarding(update.telegramId, botUuid);

      default:
        return {};
    }
  }

  /** Начинает новую анкету или продолжает активную */
  async #startOrResumeOnboarding(
    telegramId: number,
    botUuid: string,
  ): Promise<BotResponse> {
    try {
      // Пробуем получить текущий вопрос активной анкеты
      const response = await this.#app.execute(
        'get-current-question',
        { telegramId },
        botUuid,
      );

      return this.#renderActionResponse(response);
    } catch (err) {
      const ex = err as AppException;
      if (ex.error?.name === 'QUESTIONNAIRE_NOT_FOUND') {
        // Нет активной анкеты — начинаем новую
        const startResponse = await this.#app.execute(
          'start',
          { telegramId },
          botUuid,
        );

        return this.#renderActionResponse(startResponse);
      }

      return { sendMessage: { text: `Ошибка: ${ex.message}` } };
    }
  }

  /** Прерывает активную анкету */
  async #cancelOnboarding(
    telegramId: number,
    botUuid: string,
  ): Promise<BotResponse> {
    try {
      await this.#app.execute('abandon', { telegramId }, botUuid);

      return {
        questionnaireCompleted: true,
        sendMessage: {
          text: escapeMarkdown(
            'Анкета прервана. Ты можешь начать заново через /start-onboarding',
          ),
          parseMode: 'MarkdownV2',
        },
      };
    } catch (err) {
      const ex = err as AppException;
      return { sendMessage: { text: `Ошибка: ${ex.message}` } };
    }
  }

  // ── Обработка действий (сообщения / callback'и) ──

  async #handleAction(
    update: BotUpdate & ({ type: 'message' } | { type: 'callback' }),
    botUuid: string,
  ): Promise<BotResponse> {
    try {
      const actionValue = update.type === 'message' ? update.text : update.data;
      const actionType = update.type === 'message' ? 'text' : 'callback';

      const response = await this.#app.execute(
        'handle-action',
        {
          telegramId: update.telegramId,
          type: actionType,
          value: actionValue,
        },
        botUuid,
      );

      return this.#renderActionResponse(
        response,
        update.type === 'callback' ? update.messageId : undefined,
      );
    } catch (err) {
      const ex = err as AppException;
      this.#logger?.error('onboarding-controller', 'Ошибка в handleAction', {
        error: String(err),
        telegramId: update.telegramId,
        type: update.type,
      });
      return { sendMessage: { text: `Ошибка: ${ex.message}` } };
    }
  }

  // ── Рендеринг ──

  /** Рендерит результат действия из домена в инструкции для бота */
  #renderActionResponse(
    response: QuestionnaireActionResponse,
    messageId?: number,
  ): BotResponse {
    const botRes: BotResponse = {};

    // Для wait_next — только редактируем сообщение (переключение чекбоксов)
    if (response.type === 'wait_next') {
      if (messageId) {
        const text = this.#formatQuestionMd(
          response.currentQuestion,
          response.selectedAnswers,
        );
        const keyboard = this.#getKeyboard(
          response.currentQuestion,
          response.nextButton,
        );

        botRes.editMessage = {
          messageId,
          text,
          keyboard,
          parseMode: 'MarkdownV2',
        };
      }
      return botRes;
    }

    // Для new_question — редактируем предыдущее (если есть) и отправляем новое
    if (response.type === 'new_question') {
      // Edit: рендерим предыдущий вопрос с отмеченными ответами, БЕЗ клавиатуры
      if (
        response.previousQuestion &&
        response.previousSelectedAnswers &&
        messageId
      ) {
        const text = this.#formatQuestionMd(
          response.previousQuestion,
          response.previousSelectedAnswers,
        );

        botRes.editMessage = {
          messageId,
          text,
          parseMode: 'MarkdownV2',
        };
      }

      // Send: новый вопрос
      const selected = response.selectedAnswers ?? [];
      const text = this.#formatQuestionMd(response.question, selected);
      const keyboard = this.#getKeyboard(response.question);

      botRes.sendMessage = {
        text,
        keyboard,
        parseMode: 'MarkdownV2',
      };
      return botRes;
    }

    // Для completed — сигнал завершения
    // Edit: последний вопрос с отмеченными ответами, БЕЗ клавиатуры
    if (
      response.previousQuestion &&
      response.previousSelectedAnswers &&
      messageId
    ) {
      const text = this.#formatQuestionMd(
        response.previousQuestion,
        response.previousSelectedAnswers,
      );

      botRes.editMessage = {
        messageId,
        text,
        parseMode: 'MarkdownV2',
      };
    }

    botRes.questionnaireCompleted = true;
    botRes.sendMessage = {
      text: 'Спасибо! Твоя анкета принята.',
    };

    return botRes;
  }

  /** Форматирует вопрос и ответы в MarkdownV2 */
  #formatQuestionMd(question: Question, selected: string[]): string {
    if (question.type !== 'choice') {
      return `*${escapeMarkdown(question.question)}*`;
    }

    const lines = [`*${escapeMarkdown(question.question)}*`, ''];
    let idx = 0;
    for (const a of question.answers) {
      idx++;
      const marker = selected.includes(a.answerCode) ? '*[x]*' : '[ ]';
      lines.push(`${idx}\\. ${marker} ${escapeMarkdown(a.answer)}`);
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
      code: a.answerCode,
    }));

    const rows = [buttons];
    if (nextButton) {
      rows.push([{ text: 'Далее -->', code: nextButton }]);
    }

    return { rows, isMultiple: question.multiple };
  }
}
