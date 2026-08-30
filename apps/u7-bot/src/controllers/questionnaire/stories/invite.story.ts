import type { User } from '@u7-scl/app/domain';
import {
  type BotCommand,
  type BotResponse,
  type BotUpdate,
  eventSubscription,
  type SessionData,
  type UiEventSubscription,
} from '@u7-scl/core/ui';
import type { QuestionnaireInviteEvent } from '@u7-scl/questionnaire/domain';
import { U7BotUiStory } from '../../../core/u7-bot-ui-story';
import { buttons } from '../../shared/buttons';
import { inviteKeyboard, renderActionResponse } from './render';

/**
 * InviteStory — сценарий приглашения в анкету (S01, S06).
 *
 * Приглашение, пояснение «зачем», отказ от анкеты. Старт заполнения
 * (`invite:start`) передаёт управление fill-стори через captureInput.
 */
export class InviteStory extends U7BotUiStory {
  readonly name = 'invite';

  // ── Подписки на доменные события ──

  override getEventSubscriptions(): UiEventSubscription[] {
    return [
      eventSubscription<QuestionnaireInviteEvent>(
        'questionnaire:invite',
        (event) => this.#handleInviteEvent(event),
      ),
    ];
  }

  /** questionnaire:invite — рендерит S01 (приглашение) и шлёт проактивно */
  async #handleInviteEvent(event: QuestionnaireInviteEvent): Promise<void> {
    const { telegramId, response } = event.payload;

    const command: BotCommand = {
      sendMessage: {
        text: `📋 *Анкета*\n\n${response.inviteText ?? 'Заполните, пожалуйста, анкету.'}\n\nДля отмены в любой момент нажмите /cancel\\.`,
        parseMode: 'MarkdownV2',
        keyboard: inviteKeyboard(response.questionnaireId, response.whyText),
      },
    };

    await this.proactiveSender.send(telegramId, command);
  }

  // ── Callback ──

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    // invite:start:{qId} — старт заполнения, далее вопросами ведёт fill-стори
    if (action.startsWith('start:')) {
      const qId = action.slice(6);
      try {
        const response = await this.appApi.execute(
          'start-by-invite',
          { questionnaireId: qId },
          actor.uuid,
        );
        const rendered = renderActionResponse(response);
        rendered.captureInput = {
          path: 'fill',
          context: { questionnaireId: qId },
        };
        return rendered;
      } catch (err) {
        return this.handleError(err);
      }
    }

    // invite:why:{qId}
    if (action.startsWith('why:')) {
      const qId = action.slice(4);
      return this.#handleWhy(qId, actor);
    }

    // invite:invite:{qId} — повторный показ S01
    if (action.startsWith('invite:')) {
      const qId = action.slice(7);
      return this.#handleInvite(qId, actor);
    }

    // invite:decline:{qId}
    if (action.startsWith('decline:')) {
      const qId = action.slice(8);
      return this.#handleDeclineConfirm(qId, actor);
    }

    // invite:decline-confirm:{qId}
    if (action.startsWith('decline-confirm:')) {
      const qId = action.slice(16);
      return this.#handleDeclineConfirmed(qId, actor);
    }

    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  // ── Сообщения ──

  override async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  // ── Приватные обработчики ──

  async #handleWhy(qId: string, actor: User): Promise<BotResponse> {
    try {
      const current = await this.appApi.execute(
        'get-current',
        { questionnaireId: qId },
        actor.uuid,
      );
      // whyText/inviteText определены только в состоянии invited
      const invited = current.type === 'invited' ? current : undefined;

      return {
        sendMessage: {
          text: this.escapeMarkdown(
            invited?.whyText ?? 'Нет дополнительной информации.',
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
      const current = await this.appApi.execute(
        'get-current',
        { questionnaireId: qId },
        actor.uuid,
      );
      // inviteText/whyText определены только в состоянии invited
      const invited = current.type === 'invited' ? current : undefined;

      return {
        sendMessage: {
          text: `📋 *Анкета*\n\n${invited?.inviteText ?? 'Заполните, пожалуйста, анкету.'}`,
          parseMode: 'MarkdownV2',
          keyboard: inviteKeyboard(qId, invited?.whyText),
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async #handleDeclineConfirm(qId: string, actor: User): Promise<BotResponse> {
    try {
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
        'decline',
        qId,
        `Вы уверены, что хотите пропустить анкету?${warning}`,
        {
          confirmButton: '✅ Да, пропустить',
          cancelButton: '❌ Нет, вернуться',
          cancelCode: this.cb('invite', qId),
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
      await this.appApi.execute(
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
}
