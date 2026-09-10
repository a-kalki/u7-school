import type { User } from '@u7-scl/app/domain';
import { md } from '@u7-scl/core/shared';
import {
  type BotSession,
  type BotUpdate,
  type CommandReaction,
  type CommandUpdate,
  type DialogResponse,
  eventSubscription,
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
 *
 * Контракт «Диалог и Экран»: анкета держит ввод (awaitInput с контекстом
 * { questionnaireId }) с момента входа в диалог (resume/current/start) до
 * завершения (release при completed/abandoned). Прерывание — только после
 * подтверждения (решение владельца 2026-09-10): /cancel и кнопка «Прервать»
 * из S07/S09 показывают confirm-экран S05a.
 */
export class FillStory extends U7BotUiStory {
  readonly name = 'fill';

  // ── Подписки на доменные события (вариант A: invite-канал, ФР-6) ──

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

  /**
   * questionnaire:start (старт из каталога) — вариант A: сервер только
   * зовёт, диалог открывается действием пользователя. Кнопка-мост
   * fill:resume:{courseId}; без courseId — подсказка входа через меню.
   */
  async #handleStartEvent(event: QuestionnaireStartEvent): Promise<void> {
    const { telegramId } = event.payload;
    const courseId = event.ownerInfo.courseId;

    if (typeof courseId !== 'string') {
      await this.proactiveSender.notify(telegramId, {
        text: md`📋 *Анкета*\n\nДля вас подготовлена анкета — откройте её через /start\\.`,
      });
      return;
    }

    await this.proactiveSender.invite(telegramId, {
      text: md`📋 *Анкета*\n\nДля вас подготовлена анкета — заполните, пожалуйста\\.\n\nЕсли кнопки не открываются \\- наберите /start\\.`,
      keyboard: {
        rows: [
          [
            {
              text: '▶️ Заполнить анкету',
              code: Routes.questionnaire.resume(courseId),
            },
          ],
        ],
        isMultiple: false,
      },
    });
  }

  /**
   * questionnaire:abandon-warning (S07, ступень 6ч) — кнопочный проактив
   * через invite-канал: «Продолжить» (кнопка-мост по курсу) / «Прервать»
   * (confirm-экран S05a — прерывание только после подтверждения).
   */
  async #handleWarningEvent(
    event: QuestionnaireAbandonWarningEvent,
  ): Promise<void> {
    const { telegramId, questionnaireId } = event.payload;
    const rows = this.#lifecycleRows(
      event.ownerInfo.courseId,
      questionnaireId,
      '▶️ Продолжить',
    );

    await this.proactiveSender.invite(telegramId, {
      text: md`⏳ *Анкета приостановлена*\n\nМы заметили, что ты давно не заполнял анкету\\. Скоро она будет закрыта\\.\n\nПродолжить?\n\nЕсли кнопки не открываются \\- наберите /start\\.`,
      keyboard: { rows, isMultiple: false },
    });
  }

  /**
   * questionnaire:continue-invite (S09, ступень 3ч) — приглашение
   * продолжить брошенную анкету, канал invite (ФР-6).
   */
  async #handleContinueInviteEvent(
    event: QuestionnaireContinueInviteEvent,
  ): Promise<void> {
    const { telegramId, questionnaireId } = event.payload;
    const rows = this.#lifecycleRows(
      event.ownerInfo.courseId,
      questionnaireId,
      '▶️ Продолжить анкету',
    );

    await this.proactiveSender.invite(telegramId, {
      text: md`📋 *Анкета*\n\nВы начали заполнять анкету — продолжим?\n\nЕсли кнопки не открываются \\- наберите /start\\.`,
      keyboard: { rows, isMultiple: false },
    });
  }

  /**
   * questionnaire:abandon — уведомление о принудительном закрытии (S08).
   * Только reason='timeout': при ручном прерывании пользователь уже
   * получил экран «Анкета прервана» — дублировать не нужно. Без telegramId
   * слать некому.
   */
  async #handleAbandonEvent(event: QuestionnaireAbandonEvent): Promise<void> {
    const { reason, telegramId } = event.payload;
    if (reason !== 'timeout' || telegramId === undefined) {
      return;
    }

    await this.proactiveSender.notify(telegramId, {
      text: md`⏱ Анкета была закрыта из\\-за длительной неактивности\\.`,
    });
  }

  /** Кнопки S07/S09: продолжить (если анкета привязана к курсу) / прервать. */
  #lifecycleRows(
    courseId: unknown,
    questionnaireId: string,
    continueText: string,
  ): { text: string; code: string }[][] {
    const rows: { text: string; code: string }[][] = [];
    if (typeof courseId === 'string') {
      rows.push([
        { text: continueText, code: Routes.questionnaire.resume(courseId) },
      ]);
    }
    rows.push([
      {
        text: '⏭️ Прервать',
        code: Routes.questionnaire.fillCancel(questionnaireId),
      },
    ]);
    return rows;
  }

  // ── Callback ──

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    // fill:resume:{courseId}
    if (action.startsWith('resume:')) {
      const courseId = action.slice(7);
      return this.#handleResume(courseId, actor);
    }

    // fill:cancel-confirm:{qId} — подтверждённое прерывание (S05b)
    if (action.startsWith('cancel-confirm:')) {
      const qId = action.slice(15);
      return this.#handleCancelConfirmed(qId, actor);
    }

    // fill:cancel:{qId} — confirm-экран прерывания (S05a)
    if (action.startsWith('cancel:')) {
      const qId = action.slice(7);
      return this.#cancelConfirmScreen(qId, actor);
    }

    // fill:current:{qId} — восстановление флоу (кнопка «Нет, продолжить»)
    if (action.startsWith('current:')) {
      const qId = action.slice(8);
      return this.#showCurrent(qId, actor);
    }

    // fill:answer:{qId}:{aCode}
    if (action.startsWith('answer:')) {
      const rest = action.slice(7);
      const colonIdx = rest.indexOf(':');
      if (colonIdx === -1) return this.unknownCommand(action, actor, session);
      const qId = rest.slice(0, colonIdx);
      const aCode = rest.slice(colonIdx + 1);
      try {
        const response = await this.appApi.execute(
          'handle-action',
          // Протокол UC: выбор — callback (value = код ответа)
          { questionnaireId: qId, type: 'callback', value: aCode },
          actor.uuid,
        );
        return this.#renderUc(response, qId, aCode);
      } catch (err) {
        return this.errorNotify(err);
      }
    }

    // fill:next:{qId}:{qCode}
    if (action.startsWith('next:')) {
      const rest = action.slice(5);
      const colonIdx = rest.indexOf(':');
      if (colonIdx === -1) return this.unknownCommand(action, actor, session);
      const qId = rest.slice(0, colonIdx);
      const qCode = rest.slice(colonIdx + 1);
      try {
        const response = await this.appApi.execute(
          'handle-action',
          { questionnaireId: qId, type: 'callback', value: `next:${qCode}` },
          actor.uuid,
        );
        return this.#renderUc(response, qId, `next:${qCode}`);
      } catch (err) {
        return this.errorNotify(err);
      }
    }

    return this.unknownCommand(action, actor, session);
  }

  // ── Сообщения (текстовые ответы анкеты) ──

  override async handleMessage(
    update: BotUpdate,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    if (update.type !== 'message') {
      // Анкета ждёт текст: документ/фото/войс — переспрос, ввод живёт
      return {
        notify: {
          text: md`Пожалуйста, введите ваш ответ текстом\.`,
          kind: 'warn',
        },
      };
    }

    const qId = this.#qIdOf(session);
    if (!qId) {
      this.logger?.warn('fill-story', 'Текстовый ввод без контекста анкеты', {
        dialogPath: session.dialog?.path,
      });
      return {
        notify: {
          text: md`Анкета не найдена — начните с /start\\.`,
          kind: 'warn',
        },
        release: true,
      };
    }

    try {
      const response = await this.appApi.execute(
        'handle-action',
        { questionnaireId: qId, type: 'text', value: update.text },
        actor.uuid,
      );
      return this.#renderUc(response, qId, update.text);
    } catch (err) {
      return this.errorNotify(err);
    }
  }

  // ── Команды: /cancel — подтверждение перед прерыванием ──

  override async handleCommand(
    update: CommandUpdate,
    actor: User,
    session: BotSession,
  ): Promise<CommandReaction> {
    if (update.command === 'cancel' && this.isActive(session)) {
      // qId берём из контекста ввода ДО того, как ядро переоткроет меню
      const qId = this.#qIdOf(session);
      if (!qId) {
        return {
          reaction: 'stop',
          response: { notify: { text: md`Отменено\\. Наберите /start` } },
        };
      }
      try {
        return {
          reaction: 'stop',
          response: await this.#cancelConfirmScreen(qId, actor),
        };
      } catch {
        return {
          reaction: 'stop',
          response: { notify: { text: md`Отменено\\. Наберите /start` } },
        };
      }
    }

    return super.handleCommand(update, actor, session);
  }

  // ── Приватные обработчики ──

  /**
   * Продолжение анкеты по курсу (кнопки-мосты «Продолжить»): ищет активную
   * standard-анкету пользователя с ownerInfo.courseId = courseId и
   * рендерит её текущий вопрос с захватом ввода.
   */
  async #handleResume(courseId: string, actor: User): Promise<DialogResponse> {
    try {
      const states = await this.appApi.execute(
        'get-questionnaires-by-user',
        { userId: actor.uuid },
        actor.uuid,
      );

      const active = (
        states as Array<{
          kind: string;
          status: string;
          ownerInfo: { courseId?: string };
          uuid: string;
        }>
      ).find(
        (s) =>
          s.kind === 'standard' &&
          s.status === 'in_progress' &&
          s.ownerInfo.courseId === courseId,
      );

      if (!active) {
        return {
          screen: {
            text: md`Анкета не найдена или уже завершена\\.`,
            keyboard: {
              rows: [[buttons.mainMenu()]],
              isMultiple: false,
            },
          },
        };
      }

      return this.#showCurrent(active.uuid, actor);
    } catch (err) {
      return this.handleError(err);
    }
  }

  /** Показ текущего вопроса с захватом ввода (resume/current/возврат). */
  async #showCurrent(qId: string, actor: User): Promise<DialogResponse> {
    try {
      const response = await this.appApi.execute(
        'get-current',
        { questionnaireId: qId },
        actor.uuid,
      );
      const res = renderActionResponse(response);
      // Ввод ждём только пока есть вопрос; completed сам несёт release
      if (response.type === 'new_question' || response.type === 'wait_next') {
        res.awaitInput = { context: { questionnaireId: qId } };
      }
      return res;
    } catch (err) {
      return this.handleError(err);
    }
  }

  /** Confirm-экран прерывания S05a: вопрос + cancelWarning анкеты. */
  async #cancelConfirmScreen(
    qId: string,
    actor: User,
  ): Promise<DialogResponse> {
    const current = await this.appApi.execute(
      'get-current',
      { questionnaireId: qId },
      actor.uuid,
    );
    // cancelWarning есть у всех вариантов ответа, кроме completed
    const warningRaw =
      current.type === 'completed' ? undefined : current.cancelWarning;

    return this.confirm(
      'cancel',
      qId,
      md`Вы уверены, что хотите прервать анкету?${warningRaw ? `\n\n${warningRaw}` : ''}`,
      {
        confirmButton: '✅ Да, прервать',
        cancelButton: '❌ Нет, продолжить',
        cancelCode: this.cbFor('fill', 'current', qId),
      },
    );
  }

  /** Подтверждённое прерывание (S05b): abandon UC + release. */
  async #handleCancelConfirmed(
    qId: string,
    actor: User,
  ): Promise<DialogResponse> {
    try {
      await this.appApi.execute(
        'abandon',
        { questionnaireId: qId },
        actor.uuid,
      );

      return {
        screen: {
          text: md`Анкета прервана\\.`,
          keyboard: { rows: [[buttons.mainMenu()]], isMultiple: false },
        },
        release: true,
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /** Рендеринг ответа UC: наблюдаемость stale + декларативный рендер. */
  #renderUc(
    response: QuestionnaireActionResponse,
    questionnaireId: string,
    pressed: string,
  ): DialogResponse {
    // Неактуальный ответ — сигнал для наблюдаемости (warn, не error:
    // не должен попадать в критические ошибки Logger Bot, spec FR-1)
    if (response.type === 'stale_answer') {
      this.logger?.warn('fill-story', 'Неактуальный ответ в анкете', {
        questionnaireId,
        pressed,
        questionCode: response.question.questionCode,
        reason: response.reason,
      });
    }

    return renderActionResponse(response);
  }

  /** questionnaireId активного ввода (контекст awaitInput). */
  #qIdOf(session: BotSession): string | undefined {
    const ctx = session.dialog?.input?.context as
      | { questionnaireId?: string }
      | undefined;
    return ctx?.questionnaireId;
  }
}
