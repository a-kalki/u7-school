import type { U7BotAppMeta } from '@u7-scl/app/domain';
import { U7BotController } from '@u7-scl/app/ui';
import type { AppException } from '@u7-scl/core/domain';
import type { Logger } from '@u7-scl/core/shared';
import type {
  BotResponse,
  BotUpdate,
  BotUserStory,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import type { User } from '@u7-scl/user/domain';
import type { OnboardingApiModuleMeta } from '#domain/module';
import type { Question } from '#domain/questionnaire/question';
import type { QuestionnaireActionResponse } from '#domain/questionnaire/types';
import type { KeyboardDescription } from '../types';

/**
 * Контроллер onboarding для Telegram-бота.
 * Вшивает всю логику анкеты напрямую, без UserStory (процесс небольшой).
 */
export class OnboardingController extends U7BotController<OnboardingApiModuleMeta> {
  override readonly name = 'onboarding';
  override readonly stories: BotUserStory<
    U7BotAppMeta,
    OnboardingApiModuleMeta,
    User
  >[] = [];
  readonly #logger: Logger | undefined;

  // ── Главное меню ──

  override async handleStart(_actor: User): Promise<MainMenuAction[]> {
    return [
      {
        kind: 'callback',
        text: '📝 Заполнить анкету',
        action: this.cb('start_questionnaire'),
        priority: 50,
        description: '📝 Заполнить анкету — расскажи о своих ожиданиях от курсов',
      },
    ];
  }

  // ── Callback'и ──

  override async handleCallback(
    data: string,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    try {
      if (data === 'start_questionnaire') {
        return await this.#startOrResumeOnboarding(actor, session);
      }

      // Парсим callback: answer:<code> → code, next:<code> → next:<code>
      let value = data;
      if (data.startsWith('answer:')) {
        value = data.slice(7);
      }

      return await this.#handleOnboardingAction(
        'callback',
        value,
        actor,
        session,
      );
    } catch (err) {
      this.#logger?.error(
        'onboarding-controller',
        'Необработанная ошибка в handleCallback',
        {
          error: String(err),
          telegramId: actor.telegramId,
          data,
        },
      );
      return this.handleError(err);
    }
  }

  // ── Сообщения ──

  override async handleMessage(
    update: BotUpdate,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    try {
      if (
        session.activeHandler?.path?.startsWith('onboarding/') &&
        update.type === 'message'
      ) {
        return await this.#handleOnboardingAction(
          'text',
          update.text,
          actor,
          session,
        );
      }

      return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
    } catch (err) {
      this.#logger?.error(
        'onboarding-controller',
        'Необработанная ошибка в handleMessage',
        {
          error: String(err),
          telegramId: actor.telegramId,
        },
      );
      return this.handleError(err);
    }
  }

  // ── Отмена ──

  override async handleCancel(
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    // Если нет активного обработчика — просто освобождаем ввод
    if (!session.activeHandler?.path?.startsWith('onboarding/')) {
      return { releaseInput: true };
    }

    try {
      await this.moduleApi.execute(
        'abandon',
        { telegramId: actor.telegramId },
        actor.uuid,
      );

      return {
        releaseInput: true,
        questionnaireCompleted: true,
        sendMessage: {
          text: this.escapeMarkdown(
            'Анкета прервана. Ты можешь начать заново через кнопку «Заполнить анкету» в главном меню.',
          ),
          parseMode: 'MarkdownV2',
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  // ── Приватные методы ──

  /** Начинает новую анкету или продолжает активную */
  async #startOrResumeOnboarding(
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    try {
      // Пробуем получить текущий вопрос активной анкеты
      const response = await this.moduleApi.execute(
        'get-current-question',
        { telegramId: actor.telegramId },
        actor.uuid,
      );

      return this.#renderActionResponse(response, session);
    } catch (err) {
      const ex = err as AppException;
      if (ex.error?.name === 'QUESTIONNAIRE_NOT_FOUND') {
        // Нет активной анкеты — начинаем новую
        const startResponse = await this.moduleApi.execute(
          'start',
          { telegramId: actor.telegramId },
          actor.uuid,
        );

        const questionRes = this.#renderActionResponse(startResponse, session);

        // Отделяем приветствие от первого вопроса
        return {
          sendMessages: [
            {
              text: 'Заполни анкету чтобы мы могли понять твои ожидания от курсов. В любой момент можно нажать /cancel для возврата в главное меню.',
            },
            ...(questionRes.sendMessage
              ? [questionRes.sendMessage]
              : (questionRes.sendMessages ?? [])),
          ],
          editMessage: questionRes.editMessage,
          captureInput: { path: 'questionnaire', ttlSeconds: 600 },
        };
      }

      return this.handleError(err);
    }
  }

  /** Обрабатывает действие пользователя внутри анкеты */
  async #handleOnboardingAction(
    type: 'callback' | 'text',
    value: string,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    try {
      const response = await this.moduleApi.execute(
        'handle-action',
        {
          telegramId: actor.telegramId,
          type,
          value,
        },
        actor.uuid,
      );

      return this.#renderActionResponse(response, session);
    } catch (err) {
      return this.handleError(err);
    }
  }

  // ── Рендеринг ──

  /** Рендерит результат действия из домена в инструкции для бота */
  #renderActionResponse(
    response: QuestionnaireActionResponse,
    session: SessionData,
  ): BotResponse {
    const botRes: BotResponse = {};

    // Достаём messageId из сессии (если есть)
    const messageId = (
      session.activeHandler?.context as { messageId?: number } | undefined
    )?.messageId;

    // Для wait_next — переключение чекбоксов или команда start
    if (response.type === 'wait_next') {
      const text = this.#formatQuestionMd(
        response.currentQuestion,
        response.selectedAnswers,
      );
      const keyboard = this.#getKeyboard(
        response.currentQuestion,
        response.nextButton,
      );

      if (messageId) {
        // Было нажатие на кнопку — редактируем текущее сообщение
        botRes.editMessage = {
          messageId,
          text,
          keyboard,
          parseMode: 'MarkdownV2',
        };
      } else {
        // Нет messageId — отправляем новый вопрос (start без активного сообщения)
        botRes.sendMessage = {
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
    botRes.releaseInput = true;
    botRes.sendMessage = {
      text: 'Спасибо! Твоя анкета принята.',
    };

    return botRes;
  }

  /** Форматирует вопрос и ответы в MarkdownV2 */
  #formatQuestionMd(question: Question, selected: string[]): string {
    if (question.type !== 'choice') {
      return `*${this.escapeMarkdown(question.question)}*`;
    }

    const lines = [`*${this.escapeMarkdown(question.question)}*`, ''];
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
      lines.push(`${idx}\\. ${marker} ${this.escapeMarkdown(a.answer)}`);
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
      code: this.cb(`answer:${a.answerCode}`),
    }));

    const rows = [buttons];
    if (nextButton) {
      rows.push([{ text: 'Далее -->', code: this.cb(nextButton) }]);
    }

    return { rows, isMultiple: question.multiple };
  }
}
