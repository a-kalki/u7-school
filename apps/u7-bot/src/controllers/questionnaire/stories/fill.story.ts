import type { User } from '@u7-scl/app/domain';
import {
  type BotResponse,
  type BotUpdate,
  eventSubscription,
  type KeyboardDescription,
  type SessionData,
  type UiEventSubscription,
} from '@u7-scl/core/ui';
import type {
  QuestionnaireAbandonEvent,
  QuestionnaireAbandonWarningEvent,
  QuestionnaireActionResponse,
  QuestionnaireContinueInviteEvent,
  QuestionnaireStartEvent,
} from '@u7-scl/questionnaire/domain';
import { U7BotUiStory } from '../../../core/u7-bot-ui-story';
import { buttons } from '../../shared/buttons';
import { Routes } from '../../shared/routes';
import { renderActionResponse } from './render';

/**
 * FillStory — сценарий заполнения анкеты (S02–S05, S07–S09).
 *
 * Вопросы, ответы, отмена и жизненный цикл брошенной анкеты
 * (предупреждение, приглашение продолжить, закрытие по таймауту).
 * Вызовы UC — через this.appApi (объект приложения, канон BotUiStory).
 * Хранит questionnaireId в контексте сессии (activeHandler.context).
 */
export class FillStory extends U7BotUiStory {
  readonly name = 'fill';

  // ── Подписки на доменные события ──

  override getEventSubscriptions(): UiEventSubscription[] {
    return [
      eventSubscription<QuestionnaireStartEvent>(
        'questionnaire:start',
        (event) => this.#handleStartEvent(event),
      ),
      eventSubscription<QuestionnaireAbandonWarningEvent>(
        'questionnaire:abandon-warning',
        (event) => this.#handleWarningEvent(event),
      ),
      eventSubscription<QuestionnaireContinueInviteEvent>(
        'questionnaire:continue-invite',
        (event) => this.#handleContinueInviteEvent(event),
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
    const command = renderActionResponse(response);

    if (response.type === 'wait_next' || response.type === 'new_question') {
      command.captureInput = {
        path: 'fill',
        context: { questionnaireId: response.questionnaireId },
      };
    }

    await this.proactiveSender.send(telegramId, command);
  }

  /**
   * questionnaire:continue-invite — приглашение продолжить брошенную анкету
   * (ступень 3ч планировщика). Takeover-кнопка перехватывает ввод у чужого
   * флоу без alert-блокировки (spec FR-4/FR-5).
   */
  async #handleContinueInviteEvent(
    event: QuestionnaireContinueInviteEvent,
  ): Promise<void> {
    const { telegramId, questionnaireId } = event.payload;
    const courseId = event.ownerInfo.courseId;

    const rows: KeyboardDescription['rows'] = [];
    if (typeof courseId === 'string') {
      rows.push([
        {
          text: '▶️ Продолжить анкету',
          code: Routes.questionnaire.resume(courseId),
          takeover: true, // Takeover: перехват ввода
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
        text: '📋 *Анкета*\n\nВы начали заполнять анкету — продолжим?',
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    });
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
          takeover: true, // Takeover: перехват ввода
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
    // fill:resume:{courseId}
    if (action.startsWith('resume:')) {
      const courseId = action.slice(7);
      return this.#handleResume(courseId, actor);
    }

    // fill:cancel-confirm:{qId}
    if (action.startsWith('cancel-confirm:')) {
      const qId = action.slice(15);
      return this.#handleCancelConfirmed(qId, actor);
    }

    // fill:current
    if (action === 'current') {
      const qId = this.#getQId(session);
      try {
        const response = await this.appApi.execute(
          'get-current',
          { questionnaireId: qId },
          actor.uuid,
        );
        return this.#renderUc(response, { questionnaireId: qId });
      } catch (err) {
        return this.handleError(err);
      }
    }

    // fill:answer:{qId}:{aCode}
    if (action.startsWith('answer:')) {
      const rest = action.slice(7);
      const colonIdx = rest.indexOf(':');
      if (colonIdx === -1) return this.sendUnknownError();
      const qId = rest.slice(0, colonIdx);
      const aCode = rest.slice(colonIdx + 1);
      try {
        const response = await this.appApi.execute(
          'handle-action',
          // Протокол UC: выбор и «Далее» — callback (value = код ответа / 'next:{qCode}')
          { questionnaireId: qId, type: 'callback', value: aCode },
          actor.uuid,
        );
        return this.#renderUc(response, {
          questionnaireId: qId,
          session,
          editPrev: true,
        });
      } catch (err) {
        return this.handleError(err);
      }
    }

    // fill:next:{qId}:{qCode}
    if (action.startsWith('next:')) {
      const rest = action.slice(5);
      const colonIdx = rest.indexOf(':');
      if (colonIdx === -1) return this.sendUnknownError();
      const qId = rest.slice(0, colonIdx);
      const qCode = rest.slice(colonIdx + 1);
      try {
        const response = await this.appApi.execute(
          'handle-action',
          {
            questionnaireId: qId,
            type: 'callback',
            value: `next:${qCode}`,
          },
          actor.uuid,
        );
        return this.#renderUc(response, {
          questionnaireId: qId,
          session,
          editPrev: true,
        });
      } catch (err) {
        return this.handleError(err);
      }
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
    try {
      const response = await this.appApi.execute(
        'handle-action',
        { questionnaireId: qId, type: 'text', value: update.text },
        actor.uuid,
      );
      return this.#renderUc(response, {
        questionnaireId: qId,
        session,
        editPrev: true,
      });
    } catch (err) {
      return this.handleError(err);
    }
  }

  // ── Отмена ──

  override async handleCancel(
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    try {
      const qId = this.#getQId(session);
      const current = await this.appApi.execute(
        'get-current',
        { questionnaireId: qId },
        actor.uuid,
      );
      // cancelWarning есть у всех вариантов ответа, кроме completed
      const warningRaw =
        current.type === 'completed' ? undefined : current.cancelWarning;
      const warning = warningRaw
        ? `\n\n${this.escapeMarkdown(warningRaw)}`
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
      const states = await this.appApi.execute(
        'get-questionnaires-by-user',
        { userId: actor.uuid },
        actor.uuid,
      );

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

      const response = await this.appApi.execute(
        'get-current',
        { questionnaireId: active.uuid },
        actor.uuid,
      );
      return this.#renderUc(response, {
        questionnaireId: active.uuid,
        captureInput: true,
      });
    } catch (err) {
      return this.handleError(err);
    }
  }

  async #handleCancelConfirmed(qId: string, actor: User): Promise<BotResponse> {
    try {
      await this.appApi.execute(
        'abandon',
        { questionnaireId: qId },
        actor.uuid,
      );

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

  /** Рендеринг ответа UC + опциональный captureInput */
  #renderUc(
    response: QuestionnaireActionResponse,
    opts: {
      questionnaireId: string;
      session?: SessionData;
      captureInput?: boolean;
      /** Редактировать предыдущий вопрос (история «вопрос → ответ») */
      editPrev?: boolean;
    },
  ): BotResponse {
    const rendered = renderActionResponse(response, {
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
}
