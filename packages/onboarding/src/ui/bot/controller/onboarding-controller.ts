// TODO: Удалить после рефакторинга контроллера (будущий трек)
// import type { OnboardingState } from '#domain/questionnaire/commands/get-onboarding-state-cmd';
type OnboardingState = any;

import type { Question } from '#domain/questionnaire/question';
import type { QuestionnaireActionResponse } from '#domain/questionnaire/types';
import type { OnboardingBotApp } from '../app';
import type { BotResponse, BotUpdate, KeyboardDescription } from '../types';

/**
 * Контроллер onboarding для Telegram-бота.
 * Stateless — на каждый запрос получает актуальное состояние из API или выполняет действие.
 */
export class OnboardingController {
  readonly #app: OnboardingBotApp;
  readonly #actorId: string;

  constructor(app: OnboardingBotApp, actorId: string) {
    this.#app = app;
    this.#actorId = actorId;
  }

  /**
   * Основной обработчик событий.
   */
  async handleUpdate(update: BotUpdate): Promise<BotResponse> {
    const { telegramId } = update;

    // 1. Обработка команды отмены
    if (update.type === 'command' && update.command === 'cancel') {
      const state = await this.#getOnboardingState(telegramId);
      if (state.status === 'in_progress') {
        await this.#app.execute(
          'abandon-questionnaire' as any,
          { uuid: state.questionnaireUuid },
          this.#actorId,
        );
        return { sendMessage: { text: 'Опросник прерван.' } };
      }
    }

    // 2. Получаем текущее состояние
    const state = await this.#getOnboardingState(telegramId);

    // Если анкета в процессе — обрабатываем действия
    if (state.status === 'in_progress') {
      return this.#handleInProgress(update, state);
    }

    // Обработка начала анкеты (кнопка в меню)
    if (update.type === 'callback' && update.data === 'become_student') {
      try {
        await this.#app.execute(
          'start-questionnaire' as any,
          { telegramId },
          this.#actorId,
        );
        const newState = await this.#getOnboardingState(telegramId);
        return this.#renderInitialState(newState);
      } catch (err) {
        return { sendMessage: { text: `Ошибка: ${(err as Error).message}` } };
      }
    }

    return {};
  }

  async #handleInProgress(
    update: BotUpdate,
    state: OnboardingState & { status: 'in_progress' },
  ): Promise<BotResponse> {
    const questionCode = state.question.questionCode;

    let actionValue: string | undefined;

    if (update.type === 'callback') {
      actionValue = update.data === 'next' ? 'NEXT' : update.data;
    } else if (update.type === 'message' && state.question.type === 'text') {
      actionValue = update.text;
    }

    if (actionValue !== undefined) {
      try {
        const response = (await this.#app.execute(
          'handle-action' as any,
          {
            telegramId: update.telegramId,
            type: update.type === 'message' ? 'text' : 'callback',
            value: actionValue,
          } as any,
          this.#actorId,
        )) as QuestionnaireActionResponse;

        return this.#renderActionResponse(
          response,
          update.type === 'callback' ? update.messageId : undefined,
          state.question,
        );
      } catch (err) {
        return { sendMessage: { text: `Ошибка: ${(err as Error).message}` } };
      }
    }

    return {};
  }

  async #getOnboardingState(telegramId: number): Promise<OnboardingState> {
    return (await this.#app.execute(
      'get-onboarding-state' as any,
      { telegramId },
      this.#actorId,
    )) as OnboardingState;
  }

  /** Рендерит результат действия из домена в инструкции для бота */
  #renderActionResponse(
    response: QuestionnaireActionResponse,
    messageId?: number,
    lastQuestion?: Question,
  ): BotResponse {
    const botRes: BotResponse = {};

    // 1. Обновляем предыдущее сообщение, если есть selectedAnswers и messageId
    if (
      response.selectedAnswers &&
      response.selectedAnswers.length >= 0 &&
      messageId &&
      lastQuestion
    ) {
      const text = this.#formatQuestionMd(
        lastQuestion,
        response.selectedAnswers,
      );
      const keyboard = this.#getKeyboard(
        lastQuestion,
        response.selectedAnswers,
      );

      botRes.editMessage = {
        messageId,
        text,
        keyboard,
        parseMode: 'MarkdownV2',
      };
    }

    // 2. Формируем новое сообщение
    if (response.type === 'completed') {
      botRes.sendMessage = {
        text: 'Спасибо! Твоя заявка принята. Присоединяйся к группе @u7_news',
      };
    } else if (response.type === 'new_question') {
      const { question } = response;
      const text = this.#formatQuestionMd(question, []);
      const keyboard = this.#getKeyboard(question, []);

      botRes.sendMessage = {
        text,
        keyboard,
        parseMode: 'MarkdownV2',
      };
    }

    return botRes;
  }

  /** Рендерит начальное состояние анкеты */
  #renderInitialState(state: OnboardingState): BotResponse {
    if (state.status !== 'in_progress') return {};

    const { question, draftAnswers } = state;
    const text = this.#formatQuestionMd(question, draftAnswers);
    const keyboard = this.#getKeyboard(question, draftAnswers);

    return {
      sendMessage: {
        text,
        keyboard,
        parseMode: 'MarkdownV2',
      },
    };
  }

  #formatQuestionMd(question: Question, selected: string[]): string {
    const escapeMd = (t: string) =>
      t.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');

    if (question.type !== 'choice') {
      return `*${escapeMd(question.question)}*`;
    }

    const lines = [`*${escapeMd(question.question)}*`, ''];
    question.answers.forEach((a, i) => {
      const marker = selected.includes(a.answerCode) ? '*\\[x\\]*' : '\\[ \\]';
      lines.push(`${marker} ${i + 1}\\. ${escapeMd(a.answer)}`);
    });
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
