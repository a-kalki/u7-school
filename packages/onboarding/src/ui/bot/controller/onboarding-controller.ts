import type { Question } from '#domain/questionnaire/question';
import type { OnboardingBotApp } from '../app';
import type { OnboardingState } from '#domain/questionnaire/commands/get-onboarding-state-cmd';

/**
 * Входящие события от бота.
 */
export type BotUpdate =
  | { type: 'message'; text: string; telegramId: number }
  | { type: 'callback'; data: string; telegramId: number; messageId: number }
  | { type: 'command'; command: string; telegramId: number };

/**
 * Инструкции для бота.
 */
export type BotResponse =
  | {
      type: 'sendMessage';
      text: string;
      keyboard?: KeyboardDescription;
      parseMode?: 'MarkdownV2' | 'HTML';
    }
  | {
      type: 'editMessage';
      messageId: number;
      text: string;
      keyboard?: KeyboardDescription;
      parseMode?: 'MarkdownV2' | 'HTML';
    }
  | { type: 'answerCallback'; text?: string };

/**
 * Описание inline-клавиатуры.
 */
export interface KeyboardDescription {
  rows: { text: string; code: string }[][];
  isMultiple: boolean;
}

/**
 * Контроллер onboarding для Telegram-бота.
 * Stateless — на каждый запрос получает актуальное состояние из API.
 */
export class OnboardingController {
  readonly #app: OnboardingBotApp;
  readonly #botAdminUuid: string;

  constructor(app: OnboardingBotApp, botAdminUuid: string) {
    this.#app = app;
    this.#botAdminUuid = botAdminUuid;
  }

  /**
   * Основной обработчик событий.
   */
  async handleUpdate(update: BotUpdate): Promise<BotResponse[]> {
    const { telegramId } = update;

    // Получаем текущее состояние
    const state = await this.#getOnboardingState(telegramId);

    // Если анкета в процессе — обрабатываем действия анкеты
    if (state.status === 'in_progress') {
      return this.#handleInProgress(update, state);
    }

    // Если нет активной анкеты — обрабатываем команды меню
    return this.#handleNoActive(update);
  }

  async #handleInProgress(
    update: BotUpdate,
    state: OnboardingState & { status: 'in_progress' },
  ): Promise<BotResponse[]> {
    if (update.type === 'command' && update.command === 'cancel') {
      await this.#app.execute(
        'abandon-questionnaire' as any,
        { uuid: state.questionnaireUuid },
        this.#botAdminUuid,
      );
      return [
        {
          type: 'sendMessage',
          text: 'Опросник прерван. Данные удалены.',
        },
      ];
    }

    if (update.type === 'callback') {
      const { data, messageId } = update;

      if (data === 'next') {
        try {
          await this.#app.execute(
            'submit-answer' as any,
            {
              questionnaireUuid: state.questionnaireUuid,
              questionCode: state.question.questionCode,
            },
            this.#botAdminUuid,
          );
          
          const nextState = await this.#getOnboardingState(update.telegramId);
          return this.#renderState(nextState, messageId);
        } catch (err) {
          return [{ type: 'answerCallback', text: `Ошибка: ${(err as Error).message}` }];
        }
      }

      // Переключение ответа
      try {
        await this.#app.execute(
          'toggle-draft-answer' as any,
          {
            questionnaireUuid: state.questionnaireUuid,
            questionCode: state.question.questionCode,
            answerCode: data,
          },
          this.#botAdminUuid,
        );
        
        // Если одиночный выбор — сразу сабмитим
        if (state.question.type === 'choice' && !state.question.multiple) {
            await this.#app.execute(
                'submit-answer' as any,
                {
                  questionnaireUuid: state.questionnaireUuid,
                  questionCode: state.question.questionCode,
                },
                this.#botAdminUuid,
            );
        }

        const nextState = await this.#getOnboardingState(update.telegramId);
        return this.#renderState(nextState, messageId);
      } catch (err) {
        return [{ type: 'answerCallback', text: `Ошибка: ${(err as Error).message}` }];
      }
    }

    if (update.type === 'message' && state.question.type === 'text') {
      try {
        await this.#app.execute(
          'submit-answer' as any,
          {
            questionnaireUuid: state.questionnaireUuid,
            questionCode: state.question.questionCode,
            value: update.text,
          },
          this.#botAdminUuid,
        );
        const nextState = await this.#getOnboardingState(update.telegramId);
        return this.#renderState(nextState);
      } catch (err) {
        return [{ type: 'sendMessage', text: `Ошибка: ${(err as Error).message}` }];
      }
    }

    return [];
  }

  async #handleNoActive(update: BotUpdate): Promise<BotResponse[]> {
    if (update.type === 'command' && update.command === 'start') {
      // Это должно обрабатываться в боте для показа главного меню
      return [];
    }
    
    if (update.type === 'callback' && update.data === 'become_student') {
      try {
        await this.#app.execute(
          'start-questionnaire' as any,
          { telegramId: update.telegramId },
          this.#botAdminUuid,
        );
        const state = await this.#getOnboardingState(update.telegramId);
        return [
          { type: 'answerCallback' },
          ...await this.#renderState(state)
        ];
      } catch (err) {
        return [{ type: 'answerCallback', text: `Не удалось начать: ${(err as Error).message}` }];
      }
    }

    return [];
  }

  async #getOnboardingState(telegramId: number): Promise<OnboardingState> {
    return (await this.#app.execute(
      'get-onboarding-state' as any,
      { telegramId },
      this.#botAdminUuid,
    )) as OnboardingState;
  }

  async #renderState(state: OnboardingState, editMessageId?: number): Promise<BotResponse[]> {
    if (state.status === 'none_active') {
      if (state.completedCount > 0) {
        return [{ type: 'sendMessage', text: 'Спасибо! Твоя заявка принята. Присоединяйся к группе @u7_news' }];
      }
      return [];
    }

    const { question, draftAnswers } = state;
    const text = this.#formatQuestionMd(question, draftAnswers);
    const keyboard = this.#getKeyboard(question, draftAnswers);

    if (editMessageId) {
      return [
        { type: 'answerCallback' },
        {
          type: 'editMessage',
          messageId: editMessageId,
          text,
          keyboard,
          parseMode: 'MarkdownV2',
        }
      ];
    }

    return [
      {
        type: 'sendMessage',
        text,
        keyboard,
        parseMode: 'MarkdownV2',
      }
    ];
  }

  #formatQuestionMd(question: Question, selected: string[]): string {
    const escapeMd = (t: string) => t.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
    
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

  #getKeyboard(question: Question, selected: string[]): KeyboardDescription | undefined {
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
