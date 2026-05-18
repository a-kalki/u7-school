import type { AppException } from '@u7/core/domain';
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

  constructor(app: OnboardingBotApp) {
    this.#app = app;
  }

  /**
   * Основной обработчик событий.
   * @param botUuid — UUID бота, используется как actorId для всех API-вызовов
   */
  async handleUpdate(update: BotUpdate, botUuid: string): Promise<BotResponse> {
    if (update.type === 'command') {
      return this.#handleCommand(update, botUuid);
    }

    // message или callback — форвардим в handle-action
    return this.#handleAction(update, botUuid);
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
      const response = (await this.#app.execute(
        'get-current-question' as any,
        { telegramId },
        botUuid,
      )) as QuestionnaireActionResponse;

      return this.#renderActionResponse(response);
    } catch (err) {
      const ex = err as AppException;
      if (ex.error?.name === 'QUESTIONNAIRE_NOT_FOUND') {
        // Нет активной анкеты — начинаем новую
        const startResponse = (await this.#app.execute(
          'start' as any,
          { telegramId },
          botUuid,
        )) as QuestionnaireActionResponse;

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
      await this.#app.execute(
        'abandon' as any,
        { telegramId },
        botUuid,
      );

      return {
        questionnaireCompleted: true,
        sendMessage: { text: 'Анкета прервана. Ты можешь начать заново через /start\\-onboarding', parseMode: 'MarkdownV2' },
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
      const actionValue =
        update.type === 'message' ? update.text : update.data;
      const actionType =
        update.type === 'message' ? 'text' : 'callback';

    const response = (await this.#app.execute(
        'handle-action' as any,
        {
          telegramId: update.telegramId,
          type: actionType,
          value: actionValue,
        } as any,
        botUuid,
      )) as QuestionnaireActionResponse;

      return this.#renderActionResponse(
        response,
        update.type === 'callback' ? update.messageId : undefined,
        undefined /* lastQuestion больше не нужен — ответы рендерятся из response.selectedAnswers */,
      );
    } catch (err) {
      const ex = err as AppException;
      return { sendMessage: { text: `Ошибка: ${ex.message}` } };
    }
  }

  // ── Рендеринг ──

  /** Рендерит результат действия из домена в инструкции для бота */
  #renderActionResponse(
    response: QuestionnaireActionResponse,
    messageId?: number,
    _lastQuestion?: Question,
  ): BotResponse {
    const botRes: BotResponse = {};

    // Обновляем предыдущее сообщение, если есть selectedAnswers и messageId
    if (
      response.type !== 'completed' &&
      response.selectedAnswers &&
      response.selectedAnswers.length > 0 &&
      messageId
    ) {
      const question = response.question;
      const text = this.#formatQuestionMd(question, response.selectedAnswers);
      const keyboard = this.#getKeyboard(question, response.selectedAnswers);

      botRes.editMessage = {
        messageId,
        text,
        keyboard,
        parseMode: 'MarkdownV2',
      };
    }

    // Формируем новое сообщение
    if (response.type === 'completed') {
      botRes.questionnaireCompleted = true;
      botRes.sendMessage = {
        text: 'Спасибо! Твоя заявка принята. Присоединяйся к группе @u7_news',
      };
    } else {
      const { question } = response;
      const selected = response.selectedAnswers ?? [];
      const text = this.#formatQuestionMd(question, selected);
      const keyboard = this.#getKeyboard(question, selected);

      botRes.sendMessage = {
        text,
        keyboard,
        parseMode: 'MarkdownV2',
      };
    }

    return botRes;
  }

  #formatQuestionMd(question: Question, selected: string[]): string {
    const escapeMd = (t: string) =>
      t.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

    if (question.type !== 'choice') {
      return `*${escapeMd(question.question)}*`;
    }

    const lines = [`*${escapeMd(question.question)}*`, ''];
    for (const a of question.answers) {
      const marker = selected.includes(a.answerCode) ? '*\\[x\\]*' : '\\[ \\]';
      lines.push(`${marker} ${escapeMd(a.answer)}`);
    }
    return lines.join('\n');
  }

  #getKeyboard(
    question: Question,
    selected: string[],
  ): KeyboardDescription | undefined {
    if (question.type !== 'choice') return undefined;

    const buttons = question.answers.map((a, i) => ({
      text: String(i + 1),
      code: a.answerCode,
    }));

    const rows = [buttons];
    if (question.multiple && selected.length > 0) {
      rows.push([{ text: 'Далее -->', code: 'next' }]);
    }

    return {
      rows,
      isMultiple: question.multiple,
    };
  }
}
