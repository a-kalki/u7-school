import type { User } from '@u7-scl/app/domain';
import {
  type BotCommand,
  type BotResponse,
  type BotUpdate,
  type EditMessageDescription,
  eventSubscription,
  type KeyboardDescription,
  type MessageDescription,
  type SessionData,
  type UiEventSubscription,
} from '@u7-scl/core/ui';
import type { QuestionnaireApiModule } from '@u7-scl/questionnaire/api';
import type {
  InviteResponse,
  Question,
  QuestionnaireAbandonEvent,
  QuestionnaireAbandonWarningEvent,
  QuestionnaireActionResponse,
  QuestionnaireInviteEvent,
  QuestionnaireStartEvent,
  QuestionnaireState,
} from '@u7-scl/questionnaire/domain';
import { U7BotUiStory } from '../../core/u7-bot-ui-story';
import { buttons } from '../shared/buttons';
import { Routes } from '../shared/routes';

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
      eventSubscription<QuestionnaireAbandonWarningEvent>(
        'questionnaire:abandon-warning',
        (event) => this.#handleWarningEvent(event),
      ),
      eventSubscription<QuestionnaireAbandonEvent>(
        'questionnaire:abandon',
        (event) => this.#handleAbandonEvent(event),
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

  /**
   * questionnaire:abandon-warning — предупреждение о закрытии брошенной анкеты.
   * Кнопка «Продолжить» возвращается только если анкета привязана к курсу.
   */
  async #handleWarningEvent(
    event: QuestionnaireAbandonWarningEvent,
  ): Promise<void> {
    const { telegramId, questionnaireId } = event.payload;
    const courseId = event.ownerInfo.courseId;

    const rows: KeyboardDescription['rows'] = [];
    if (typeof courseId === 'string') {
      rows.push([
        {
          text: '▶️ Продолжить',
          code: Routes.questionnaire.resume(courseId),
          // Takeover: перехват ввода при активном чужом действии (spec FR-5)
          takeover: true,
        },
      ]);
    }
    rows.push([
      {
        text: '⏭️ Прервать',
        code: this.cb('cancel-confirm', questionnaireId),
      },
    ]);

    await this.proactiveSender.send(telegramId, {
      sendMessage: {
        text: '⏳ *Анкета приостановлена*\n\nМы заметили, что ты давно не заполнял анкету\\. Скоро она будет закрыта\\.\n\nПродолжить?',
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    });
  }

  /**
   * questionnaire:abandon — уведомление о принудительном закрытии.
   * Только reason='timeout': при ручном прерывании (/cancel) пользователь уже
   * получил ответ UC — дублировать не нужно. Без telegramId слать некому.
   */
  async #handleAbandonEvent(event: QuestionnaireAbandonEvent): Promise<void> {
    const { reason, telegramId } = event.payload;
    if (reason !== 'timeout' || telegramId === undefined) {
      return;
    }

    await this.proactiveSender.notify(telegramId, {
      text: '⏱ Анкета была закрыта из\\-за длительной неактивности\\.',
      parseMode: 'MarkdownV2',
    });
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
        // Протокол UC: выбор и «Далее» — callback (value = код ответа / 'next:{qCode}')
        { questionnaireId: qId, type: 'callback', value: aCode },
        actor,
        { questionnaireId: qId, session, editPrev: true },
      );
    }

    // fill:next:{qId}:{qCode}
    if (action.startsWith('next:')) {
      const rest = action.slice(5);
      const colonIdx = rest.indexOf(':');
      if (colonIdx === -1) return this.sendUnknownError();
      const qId = rest.slice(0, colonIdx);
      const qCode = rest.slice(colonIdx + 1);
      return this.#callUc(
        'handle-action',
        {
          questionnaireId: qId,
          type: 'callback',
          value: `next:${qCode}`,
        },
        actor,
        { questionnaireId: qId, session, editPrev: true },
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
      { questionnaireId: qId, session, editPrev: true },
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
          s.ownerInfo.courseId === courseId,
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
      session?: SessionData;
      captureInput?: boolean;
      /** Редактировать предыдущий вопрос (история «вопрос → ответ») */
      editPrev?: boolean;
    },
  ): Promise<BotResponse> {
    try {
      const response = (await this.#qmod.execute(
        ucName as never,
        cmd as never,
        actor.uuid,
      )) as QuestionnaireActionResponse;

      const rendered = this.#renderActionResponse(response, {
        session: opts.session,
        editPrev: opts.editPrev,
      });

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
  #renderActionResponse(
    response: QuestionnaireActionResponse,
    opts: { session?: SessionData; editPrev?: boolean } = {},
  ): BotResponse {
    const lastMsg = opts.session?.lastBotMessage;
    const canEditPrev = opts.editPrev === true && lastMsg !== undefined;

    if (response.type === 'wait_next') {
      return this.#editOrSend(
        {
          text: this.#formatQuestionMd(response.currentQuestion, {
            selected: response.selectedAnswers,
            progress: this.#progressOf(response),
          }),
          parseMode: 'MarkdownV2',
          keyboard: this.#getKeyboard(
            response.currentQuestion,
            response.questionnaireId,
            response.nextButton
              ? this.#makeNextCode(
                  response.questionnaireId,
                  response.nextButton,
                )
              : undefined,
          ),
        },
        canEditPrev ? lastMsg : undefined,
      );
    }

    if (response.type === 'new_question') {
      const nextMessage = {
        text: this.#formatQuestionMd(response.question, {
          selected: response.selectedAnswers ?? [],
          progress: this.#progressOf(response),
          isFirstQuestion: response.previousQuestion === undefined,
        }),
        parseMode: 'MarkdownV2' as const,
        keyboard: this.#getKeyboard(
          response.question,
          response.questionnaireId,
        ),
      };

      const prevEdit = this.#renderPreviousQuestion(
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

      const prevEdit = this.#renderPreviousQuestion(
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
        keyboard: this.#inviteKeyboard(
          response.questionnaireId,
          response.whyText,
        ),
      },
    };
  }

  /**
   * Рендер предыдущего вопроса для истории «вопрос → выбранный ответ»:
   * editMessage с финальными маркерами и БЕЗ клавиатуры.
   * Возвращает undefined, если редактировать нечем (нет сообщения/вопроса).
   */
  #renderPreviousQuestion(
    previousQuestion: Question | undefined,
    selectedAnswers: string[],
    lastMsg: SessionData['lastBotMessage'],
  ): EditMessageDescription | undefined {
    if (!previousQuestion || !lastMsg) return undefined;
    return {
      messageId: lastMsg.messageId,
      text: this.#formatQuestionMd(previousQuestion, {
        selected: selectedAnswers,
      }),
      parseMode: 'MarkdownV2',
    };
  }

  /** editMessage, если есть последнее сообщение бота; иначе sendMessage. */
  #editOrSend(
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

  #makeNextCode(qId: string, nextButton: string): string {
    const questionCode = nextButton.startsWith('next:')
      ? nextButton.slice(5)
      : nextButton;
    return this.cb('next', qId, questionCode);
  }

  #formatQuestionMd(
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
  #progressOf(response: {
    questionIndex?: number;
    poolSize?: number;
  }): { questionIndex: number; poolSize: number } | undefined {
    if (
      response.questionIndex === undefined ||
      response.poolSize === undefined
    ) {
      return undefined;
    }
    return {
      questionIndex: response.questionIndex,
      poolSize: response.poolSize,
    };
  }

  #getKeyboard(
    question: Question,
    questionnaireId: string,
    nextButton?: string,
  ): KeyboardDescription | undefined {
    if (question.type !== 'choice') return undefined;

    // Код кнопки обязан нести questionnaireId: handle-action без него
    // не знает, к какой анкете относится выбор (см. #callUc 'answer:').
    const buttons = question.answers.map((a, i) => ({
      text: String(i + 1),
      code: this.cb('answer', questionnaireId, a.answerCode),
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
