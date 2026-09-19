import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { md, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { buttons } from '../../shared/buttons';

/**
 * US: Кампания отзывов — S03 список адресатов (ввод S04–S06 — следующими
 * задачами трека peer-review-ui).
 *
 * Вход: `list:<campaignId>` — из приглашения (S01) или хаба «Отзывы» (S02).
 * Адресация и ✅-признак считаются доменом (`get-campaign-recipients`);
 * сторя добывает название потока (карточка кампании → get-stream) и имена
 * адресатов (get-user) для подписей кнопок.
 */
export class CampaignStory extends U7BotUiStory {
  readonly name = 'campaign';

  override async handleCallback(
    action: string,
    actor: User,
    _session: BotSession,
  ): Promise<DialogResponse> {
    const [cmd, campaignId] = action.split(':');
    if (cmd === 'list' && campaignId) {
      return this.#showRecipients(campaignId, actor);
    }
    return this.unknownCommand(action, actor, _session);
  }

  /** S03: список адресатов кампании; ✅ — мой отзыв уже есть. */
  async #showRecipients(
    campaignId: string,
    actor: User,
  ): Promise<DialogResponse> {
    const view = await this.appApi.execute(
      'get-campaign-recipients',
      { campaignId, authorId: actor.uuid },
      actor,
    );
    const cards = await this.appApi.execute(
      'get-my-campaigns',
      { userId: actor.uuid },
      actor,
    );
    const card = cards.find((c) => c.campaignId === campaignId);
    if (!card) {
      return this.screen(
        md`⚠️ Кампания не найдена\\.`,
        this.kb([[buttons.mainMenu()]]),
      );
    }
    const stream = await this.appApi.execute(
      'get-stream',
      { streamId: card.scopeId },
      actor,
    );
    const names = await this.#namesOf(
      view.recipients.map((r) => r.userId),
      actor,
    );

    const rows = view.recipients.map((r) => [
      this.btn(
        `${r.hasMyReview ? '✅ ' : ''}${recipientLabel(r.role)}: ${names.get(r.userId) ?? ''}`,
        this.cb('open', campaignId, r.userId),
      ),
    ]);
    rows.push([buttons.mainMenu()]);

    return this.screen(
      mdJoin([
        md`✍️ Поток «${stream.title}»\\. О ком хотите рассказать? Пишите кому хотите и сколько хотите\\.`,
        md`⏳ Возможность открыта ещё ${view.daysLeft} дн\\.`,
      ]),
      this.kb(rows),
    );
  }

  /** Имена адресатов для подписей кнопок. */
  async #namesOf(userIds: string[], actor: User): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    for (const userId of userIds) {
      const user = await this.appApi.execute(
        'get-user',
        { uuid: userId },
        actor,
      );
      names.set(userId, user.name);
    }
    return names;
  }
}

/** Подпись роли адресата в кнопке S03. */
function recipientLabel(role: 'student' | 'mentor'): string {
  return role === 'mentor' ? 'Ментор' : 'Студент';
}
