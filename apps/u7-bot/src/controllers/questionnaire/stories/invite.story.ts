import type { User } from '@u7-scl/app/domain';
import { md } from '@u7-scl/core/shared';
import {
  type BotSession,
  type DialogResponse,
  eventSubscription,
  type UiEventSubscription,
} from '@u7-scl/core/ui';
import type { QuestionnaireInviteEvent } from '@u7-scl/questionnaire/domain';
import { U7BotUiStory } from '../../../core/u7-bot-ui-story';
import { buttons } from '../../shared/buttons';
import { Routes } from '../../shared/routes';
import { renderActionResponse } from './render';

/**
 * InviteStory — сценарий приглашения в анкету (S01, S06).
 *
 * Приглашение, пояснение «зачем», отказ от анкеты. Старт заполнения
 * (`invite:start`) делегирует fill-стори: диалог с вопросами (и ввод
 * текстовых ответов) принадлежит fill, а не invite.
 *
 * Подписка questionnaire:invite — вариант A (ФР-6): кнопочный проактив
 * через ProactiveSender.invite с ПОЛНЫМИ кодами (транспорт проактивы
 * не префиксует контроллером); в тексте — подсказка /start на случай
 * устаревшего экрана.
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

  /** questionnaire:invite — рендерит S01 (приглашение) в канале invite */
  async #handleInviteEvent(event: QuestionnaireInviteEvent): Promise<void> {
    const { telegramId, response } = event.payload;
    const qId = response.questionnaireId;

    const rows: { text: string; code: string }[][] = [
      [
        {
          text: '▶️ Начать заполнение',
          code: Routes.questionnaire.inviteStart(qId),
        },
      ],
    ];
    if (response.whyText) {
      rows.push([
        {
          text: '❔ Зачем это нужно?',
          code: Routes.questionnaire.inviteWhy(qId),
        },
      ]);
    }
    rows.push([
      {
        text: '⏭️ Пропустить',
        code: Routes.questionnaire.inviteDecline(qId),
      },
    ]);

    await this.proactiveSender.invite(telegramId, {
      text: md`📋 *Анкета*\n\n${response.inviteText ?? 'Заполните, пожалуйста, анкету.'}\n\nДля отмены в любой момент нажмите /cancel\\.\n\nЕсли кнопки не открываются \\- наберите /start\\.`,
      keyboard: { rows, isMultiple: false },
    });
  }

  // ── Callback ──

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    // invite:start:{qId} — старт заполнения: делегат в fill (ввод анкеты
    // адресуется fill-диалогу, не invite)
    if (action.startsWith('start:')) {
      const qId = action.slice(6);
      try {
        await this.appApi.execute(
          'start-by-invite',
          { questionnaireId: qId },
          actor.uuid,
        );
        return {
          delegate: { path: this.cbFor('fill', 'current', qId) },
        };
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

    // invite:decline:{qId} — confirm-экран отказа (S06a)
    if (action.startsWith('decline:')) {
      const qId = action.slice(8);
      return this.#handleDeclineConfirm(qId, actor);
    }

    // invite:decline-confirm:{qId} — подтверждённый отказ (S06b)
    if (action.startsWith('decline-confirm:')) {
      const qId = action.slice(16);
      return this.#handleDeclineConfirmed(qId, actor);
    }

    return this.unknownCommand(action, actor, session);
  }

  // ── Приватные обработчики ──

  async #handleWhy(qId: string, actor: User): Promise<DialogResponse> {
    try {
      const current = await this.appApi.execute(
        'get-current',
        { questionnaireId: qId },
        actor.uuid,
      );
      // whyText/inviteText определены только в состоянии invited
      const invited = current.type === 'invited' ? current : undefined;

      return {
        screen: {
          text: md`${invited?.whyText ?? 'Нет дополнительной информации.'}`,
          keyboard: {
            rows: [[{ text: '✅ Хорошо', code: this.cb('invite', qId) }]],
            isMultiple: false,
          },
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async #handleInvite(qId: string, actor: User): Promise<DialogResponse> {
    try {
      const current = await this.appApi.execute(
        'get-current',
        { questionnaireId: qId },
        actor.uuid,
      );
      // inviteText/whyText определены только в состоянии invited
      const invited = current.type === 'invited' ? current : undefined;

      return renderActionResponse({
        type: 'invited',
        questionnaireId: qId,
        inviteText: invited?.inviteText,
        whyText: invited?.whyText,
      });
    } catch (err) {
      return this.handleError(err);
    }
  }

  async #handleDeclineConfirm(
    qId: string,
    actor: User,
  ): Promise<DialogResponse> {
    try {
      const current = await this.appApi.execute(
        'get-current',
        { questionnaireId: qId },
        actor.uuid,
      );
      // cancelWarning есть у всех вариантов ответа, кроме completed
      const warningRaw =
        current.type === 'completed' ? undefined : current.cancelWarning;

      return this.confirm(
        'decline',
        qId,
        md`Вы уверены, что хотите пропустить анкету?${warningRaw ? `\n\n${warningRaw}` : ''}`,
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
  ): Promise<DialogResponse> {
    try {
      await this.appApi.execute(
        'decline-invite',
        { questionnaireId: qId },
        actor.uuid,
      );

      return {
        screen: {
          text: md`Анкета пропущена\\.`,
          keyboard: {
            rows: [[buttons.mainMenu()]],
            isMultiple: false,
          },
        },
        release: true,
      };
    } catch (err) {
      return this.handleError(err);
    }
  }
}
