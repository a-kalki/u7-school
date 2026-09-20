import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type {
  BotSession,
  DialogResponse,
  UiEventSubscription,
} from '@u7-scl/core/ui';
import { eventSubscription } from '@u7-scl/core/ui';
import type {
  StudentCampaignCreatedEvent,
  StudentOutcome,
} from '@u7-scl/peer-review/domain';
import { Routes } from '../../shared/routes';

/** Профиль получателя (telegramId может отсутствовать — приглашение пропускается). */
type Profile = { uuid: string; name: string; telegramId?: number };

/**
 * US: Приглашение в кампанию отзывов (S01) — по событию создания кампании.
 *
 * Подписка на student-campaign.created (публикует ER домена по событиям
 * судьбы студента): два персонализированных приглашения — субъекту
 * (текст по его исходу из события, скрыт от пользователя) и ментору
 * скоупа («Выдайте свой отзыв для {Имя}»). Одно приглашение каждому,
 * напоминаний нет (до task-модуля).
 *
 * Доставка — временная механика ProactiveSender.invite (ФР-6): кнопки
 * с ПОЛНЫМИ кодами (транспорт проактивы не префиксует контроллером);
 * `💬 Отзывы` ведёт сразу в кампанию (S03).
 */
export class InviteStory extends U7BotUiStory {
  readonly name = 'invite';

  // ── Подписки на доменные события ──

  override getEventSubscriptions(): UiEventSubscription[] {
    return [
      eventSubscription<StudentCampaignCreatedEvent>(
        'student-campaign.created',
        (event) => this.#handleCampaignCreated(event),
      ),
    ];
  }

  /** student-campaign.created → приглашения субъекту и ментору. */
  async #handleCampaignCreated(
    event: StudentCampaignCreatedEvent,
  ): Promise<void> {
    const { campaignId, scopeId, subjectId, mentorId, subjectOutcome } =
      event.payload;

    let streamTitle: string;
    try {
      const stream = await this.appApi.execute('get-stream', {
        streamId: scopeId,
      });
      streamTitle = stream.title;
    } catch {
      // Поток недоступен — приглашение невозможно (молчаливый пропуск)
      return;
    }

    const profiles = await this.#profilesOf([subjectId, mentorId]);
    const subject = profiles.get(subjectId);
    const mentor = profiles.get(mentorId);

    if (subject?.telegramId !== undefined) {
      await this.proactiveSender.invite(subject.telegramId, {
        text: this.#subjectText(streamTitle, subjectOutcome),
        keyboard: this.#campaignKeyboard(campaignId),
      });
    }

    if (mentor?.telegramId !== undefined) {
      await this.proactiveSender.invite(mentor.telegramId, {
        text: this.#mentorText(streamTitle, subject?.name),
        keyboard: this.#campaignKeyboard(campaignId),
      });
    }
  }

  /** Клавиатура приглашения: вход в кампанию (S03) полным кодом. */
  #campaignKeyboard(campaignId: string) {
    return this.kb([
      [this.btn('💬 Отзывы', Routes.peerReview.campaignList(campaignId))],
    ]);
  }

  /**
   * Текст субъекту — по исходу из события (исход пользователю не виден):
   * «завершил» → об одногруппниках и менторе, «забросил»/«не начал» →
   * о менторе и учёбе (ui-spec S01).
   */
  #subjectText(streamTitle: string, outcome: StudentOutcome): MdText {
    const body =
      outcome === 'dropped' || outcome === 'never_started'
        ? md`Поделитесь впечатлениями о менторе и учёбе — это поможет школе и тем, кто только выбирает, учиться ли\\. Пишите только правду\\.`
        : md`Поделитесь впечатлениями об одногруппниках и менторе — это часть цифрового профиля каждого\\. Пишите только правду\\.`;
    return mdJoin([this.#header(streamTitle), md``, body]);
  }

  /** Текст ментору — с именем субъекта (не найден — «студента»). */
  #mentorText(streamTitle: string, subjectName: string | undefined): MdText {
    return mdJoin([
      this.#header(streamTitle),
      md``,
      md`Выдайте свой отзыв для ${subjectName ?? 'студента'}: как он проявлялся в учёбе, что удалось, что стоит подтянуть\\. Пишите только правду\\.`,
    ]);
  }

  /** Заголовок приглашения (жирный — стиль invite-канала). */
  #header(streamTitle: string): MdText {
    return md`🏁 *Отзывы по потоку «${streamTitle}»*`;
  }

  /** Профили получателей — один batch-запрос (пустой Map при сбое). */
  async #profilesOf(userIds: string[]): Promise<Map<string, Profile>> {
    const map = new Map<string, Profile>();
    try {
      const users: Profile[] = await this.appApi.execute('get-users-by-ids', {
        userIds,
      });
      for (const user of users) {
        map.set(user.uuid, user);
      }
    } catch {
      // Профили недоступны — оба приглашения пропущены ниже по проверке
    }
    return map;
  }

  // ── Стори не интерактивна: приглашение — единственный выход ──

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    return this.unknownCommand(action, actor, session);
  }
}
