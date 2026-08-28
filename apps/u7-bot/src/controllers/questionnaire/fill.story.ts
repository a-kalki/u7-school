import type { User } from '@u7-scl/app/domain';
import {
  type BotCommand,
  type BotResponse,
  type BotUpdate,
  eventSubscription,
  type KeyboardDescription,
  type SessionData,
  type UiEventSubscription,
} from '@u7-scl/core/ui';
import type { QuestionnaireApiModule } from '@u7-scl/questionnaire/api';
import type {
  InviteResponse,
  Question,
  QuestionnaireActionResponse,
  QuestionnaireInviteEvent,
  QuestionnaireStartEvent,
  QuestionnaireState,
} from '@u7-scl/questionnaire/domain';
import { U7BotUiStory } from '../../core/u7-bot-ui-story';
import { buttons } from '../shared/buttons';

/**
 * FillStory — сценарий заполнения анкеты.
 *
 * Использует QuestionnaireApiModule напрямую (standalone-модуль).
 * Хранит questionnaireId в контексте сессии (activeHandler.context).
 */
export class FillStory extends U7BotUiStory {
  readonly name = 'fill';
  readonly #qmod: QuestionnaireApiModule;

  constructor(qmod: QuestionnaireApiModule) {
    super();
    this.#qmod = qmod;
  }

  // ── Подписки на доменные события ──

  override getEventSubscriptions(): UiEventSubscription[] {
    return [
      eventSubscription<QuestionnaireStartEvent>(
        'questionnaire:start',
        (event) => this.#handleStartEvent(event),
      ),
      eventSubscription<QuestionnaireInviteEvent>(
        'questionnaire:invite',
        (event) => this.#handleInviteEvent(event),
      ),
    ];
  }

  /** questionnaire:start — рендерит S02–S04 и запускает диалог проактивно */
  async #handleStartEvent(event: QuestionnaireStartEvent): Promise<void> {
    const { telegramId, response } = event.payload;
    const command = this.#renderActionResponse(response);

    if (response.type === 'wait_next' || response.type === 'new_question') {
      command.captureInput = {
        path: 'fill',
        context: { questionnaireId: response.questionnaireId },
      };
    }

    await this.proactiveSender.send(telegramId, command);
  }

  /** questionnaire:invite — рендерит S01 (приглашение) и шлёт проактивно */
  async #handleInviteEvent(event: QuestionnaireInviteEvent): Promise<void> {
    const { telegramId, response } = event.payload;

    const command: BotCommand = {
      sendMessage: {
        text: `📋 *Анкета*\n\n${response.inviteText ?? 'Заполните, пожалуйста, анкету.'}\n\nДля отмены в любой момент нажмите /cancel\\.`,
        parseMode: 'MarkdownV2',
        keyboard: this.#inviteKeyboard(
          response.questionnaireId,
          response.whyText,
        ),
      },
    };

    await this.proactiveSender.send(telegramId, command);
  }

  // ── Callback ──

  async handleCallback(
    action: string,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    // fill:start:{qId}
    if (action.startsWith('start:')) {
      const qId = action.slice(6);
      return this.#callUc('start-by-invite', { questionnaireId: qId }, actor, {
        questionnaireId: qId,
        captureInput: true,
      });
    }

    // fill:resume:{courseId}
    if (action.startsWith('resume:')) {
      const courseId = action.slice(7);
      return this.#handleResume(courseId, actor);
    }

    // fill:why:{qId}
    if (action.startsWith('why:')) {
      const qId = action.slice(4);
      return this.#handleWhy(qId, actor);
    }

    // fill:invite:{qId}
    if (action.startsWith('invite:')) {
      const qId = action.slice(7);
      return this.#handleInvite(qId, actor);
    }

    // fill:decline:{qId}
    if (action.startsWith('decline:')) {
      const qId = action.slice(8);
      return this.#handleDeclineConfirm(qId, actor);
    }

    // fill:decline-confirm:{qId}
    if (action.startsWith('decline-confirm:')) {
      const qId = action.slice(16);
      return this.#handleDeclineConfirmed(qId, actor);
    }

    // fill:cancel-confirm:{qId}
    if (action.startsWith('cancel-confirm:')) {
      const qId = action.slice(15);
      return this.#handleCancelConfirmed(qId, actor);
    }

    // fill:current
    if (action === 'current') {
      const qId = this.#getQId(session);
      return this.#callUc('get-current', { questionnaireId: qId }, actor, {
        questionnaireId: qId,
      });
    }

    // fill:answer:{qId}:{aCode}
    if (action.startsWith('answer:')) {
      const rest = action.slice(7);
      const colonIdx = rest.indexOf(':');
      if (colonIdx === -1) return this.sendUnknownError();
      const qId = rest.slice(0, colonIdx);
      const aCode = rest.slice(colonIdx + 1);
      return this.#callUc(
        'handle-action',
        { questionnaireId: qId, type: 'select', value: aCode },
        actor,
        { questionnaireId: qId },
      );
    }

    // fill:next:{qId}:{qCode}
    if (action.startsWith('next:')) {
      const rest = action.slice(5);
      const colonIdx = rest.indexOf(':');
      if (colonIdx === -1) return this.sendUnknownError();
      const qId = rest.slice(0, colonIdx);
      return this.#callUc(
        'handle-action',
        { questionnaireId: qId, type: 'next-btn' },
        actor,
        { questionnaireId: qId },
      );
    }

    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  // ── Сообщения ──

  async handleMessage(
    update: BotUpdate,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    if (update.type !== 'message') return this.sendUnknownError();

    const qId = this.#getQId(session);
    return this.#callUc(
      'handle-action',
      { questionnaireId: qId, type: 'text', value: update.text },
      actor,
      { questionnaireId: qId },
    );
  }

  // ── Отмена ──

  override async handleCancel(
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    try {
      const qId = this.#getQId(session);
      const current = (await this.#qmod.execute(
        'get-current',
        { questionnaireId: qId },
        actor.uuid,
      )) as { cancelWarning?: string };
      const warning = current.cancelWarning
        ? `\n\n${this.escapeMarkdown(current.cancelWarning ?? '')}`
        : '';

      return this.confirm(
        'cancel',
        qId,
        `Вы уверены, что хотите прервать анкету?${warning}`,
        {
          confirmButton: '✅ Да, прервать',
          cancelButton: '❌ Нет, продолжить',
          cancelCode: 'questionnaire:fill:current',
        },
      );
    } catch {
      return { releaseInput: true };
    }
  }

  // ── Приватные обработчики ──

  /**
   * Продолжение анкеты по курсу (кнопка «▶️ Продолжить анкету» на W04):
   * ищет активную standard-анкету пользователя с ownerInfo.courseId = courseId
   * и рендерит её текущий вопрос с восстановлением сессии (captureInput).
   */
  async #handleResume(courseId: string, actor: User): Promise<BotResponse> {
    try {
      const states = (await this.#qmod.execute(
        'get-questionnaires-by-user',
        { userId: actor.uuid },
        actor.uuid,
      )) as QuestionnaireState[];

      const active = states.find(
        (s) =>
          s.kind === 'standard' &&
          s.status === 'in_progress' &&
          s.ownerInfo['courseId'] === courseId,
      );

      if (!active) {
        return {
          sendMessage: {
            text: 'Анкета не найдена или уже завершена.',
            keyboard: {
              rows: [[buttons.mainMenu()]],
              isMultiple: false,
            },
          },
        };
      }

      return this.#callUc(
        'get-current',
        { questionnaireId: active.uuid },
        actor,
        { questionnaireId: active.uuid, captureInput: true },
      );
    } catch (err) {
      return this.handleError(err);
    }
  }

  async #handleWhy(qId: string, actor: User): Promise<BotResponse> {
    try {
      const current = (await this.#qmod.execute(
        'get-current',
        { questionnaireId: qId },
        actor.uuid,
      )) as InviteResponse;

      return {
        sendMessage: {
          text: this.escapeMarkdown(
            current.whyText ?? 'Нет дополнительной информации.',
          ),
          parseMode: 'MarkdownV2',
          keyboard: {
            rows: [
              [
                {
                  text: '✅ Хорошо',
                  code: this.cb('invite', qId),
                },
              ],
            ],
            isMultiple: false,
          },
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async #handleInvite(qId: string, actor: User): Promise<BotResponse> {
    try {
      const current = (await this.#qmod.execute(
        'get-current',
        { questionnaireId: qId },
        actor.uuid,
      )) as InviteResponse;

      return {
        sendMessage: {
          text: `📋 *Анкета*\n\n${current.inviteText ?? 'Заполните, пожалуйста, анкету.'}`,
          parseMode: 'MarkdownV2',
          keyboard: this.#inviteKeyboard(qId, current.whyText),
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async #handleDeclineConfirm(qId: string, actor: User): Promise<BotResponse> {
    try {
      const current = (await this.#qmod.execute(
        'get-current',
        { questionnaireId: qId },
        actor.uuid,
      )) as InviteResponse;
      const warning = current.cancelWarning
        ? `\n\n${this.escapeMarkdown(current.cancelWarning ?? '')}`
        : '';

      return this.confirm(
        'decline',
        qId,
        `Вы уверены, что хотите пропустить анкету?${warning}`,
        {
          confirmButton: '✅ Да, пропустить',
          cancelButton: '❌ Нет, вернуться',
          cancelCode: this.cbFor(this.name, 'invite', qId),
        },
      );
    } catch (err) {
      return this.handleError(err);
    }
  }

  async #handleDeclineConfirmed(
    qId: string,
    actor: User,
  ): Promise<BotResponse> {
    try {
      await this.#qmod.execute(
        'decline-invite',
        { questionnaireId: qId },
        actor.uuid,
      );

      return {
        releaseInput: true,
        sendMessage: {
          text: 'Анкета пропущена.',
          keyboard: {
            rows: [[buttons.mainMenu()]],
            isMultiple: false,
          },
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async #handleCancelConfirmed(qId: string, actor: User): Promise<BotResponse> {
    try {
      await this.#qmod.execute('abandon', { questionnaireId: qId }, actor.uuid);

      return {
        releaseInput: true,
        sendMessage: {
          text: 'Анкета прервана.',
          keyboard: {
            rows: [[buttons.mainMenu()]],
            isMultiple: false,
          },
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /** Универсальный вызов UC + рендеринг */
  async #callUc(
    ucName: string,
    cmd: Record<string, unknown>,
    actor: User,
    opts: {
      questionnaireId: string;
      captureInput?: boolean;
    },
  ): Promise<BotResponse> {
    try {
      const response = (await this.#qmod.execute(
        ucName as never,
        cmd as never,
        actor.uuid,
      )) as QuestionnaireActionResponse;

      const rendered = this.#renderActionResponse(response);

      if (opts.captureInput) {
        rendered.captureInput = {
          path: 'fill',
          context: { questionnaireId: opts.questionnaireId },
        };
      }

      return rendered;
    } catch (err) {
      return this.handleError(err);
    }
  }

  /** Извлекает questionnaireId из контекста сессии */
  #getQId(session: SessionData): string {
    const ctx = session.activeHandler?.context as
      | { questionnaireId?: string }
      | undefined;
    if (!ctx?.questionnaireId) {
      throw new Error('questionnaireId не найден в контексте сессии');
    }
    return ctx.questionnaireId;
  }

  // ── Рендеринг ──

  #renderActionResponse(response: QuestionnaireActionResponse): BotResponse {
    if (response.type === 'wait_next') {
      return {
        sendMessage: {
          text: this.#formatQuestionMd(
            response.currentQuestion,
            response.selectedAnswers,
          ),
          parseMode: 'MarkdownV2',
          keyboard: this.#getKeyboard(
            response.currentQuestion,
            response.nextButton
              ? this.#makeNextCode(
                  response.questionnaireId,
                  response.nextButton,
                )
              : undefined,
          ),
        },
      };
    }

    if (response.type === 'new_question') {
      return {
        sendMessage: {
          text: this.#formatQuestionMd(
            response.question,
            response.selectedAnswers ?? [],
          ),
          parseMode: 'MarkdownV2',
          keyboard: this.#getKeyboard(response.question),
        },
      };
    }

    if (response.type === 'completed') {
      return {
        releaseInput: true,
        sendMessage: {
          text: 'Спасибо! Ваша анкета принята.',
          keyboard: {
            rows: [[buttons.mainMenu()]],
            isMultiple: false,
          },
        },
      };
    }

    // invited — рендерим как приглашение
    return {
      sendMessage: {
        text: `📋 *Анкета*\n\n${response.inviteText ?? 'Заполните, пожалуйста, анкету.'}`,
        parseMode: 'MarkdownV2',
        keyboard: this.#inviteKeyboard(
          response.questionnaireId,
          response.whyText,
        ),
      },
    };
  }

  #makeNextCode(qId: string, nextButton: string): string {
    const questionCode = nextButton.startsWith('next:')
      ? nextButton.slice(5)
      : nextButton;
    return this.cb('next', qId, questionCode);
  }

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
      code: this.cb('answer', a.answerCode),
    }));

    const rows = [buttons];
    if (nextButton) {
      rows.push([{ text: 'Далее -->', code: nextButton }]);
    }

    return { rows, isMultiple: question.multiple };
  }

  #inviteKeyboard(
    qId: string,
    whyText?: string,
  ): KeyboardDescription | undefined {
    const rows: { text: string; code: string }[][] = [
      [{ text: '▶️ Начать заполнение', code: this.cb('start', qId) }],
    ];

    if (whyText) {
      rows.push([{ text: '❔ Зачем это нужно?', code: this.cb('why', qId) }]);
    }

    rows.push([{ text: '⏭️ Пропустить', code: this.cb('decline', qId) }]);

    return { rows, isMultiple: false };
  }
}
