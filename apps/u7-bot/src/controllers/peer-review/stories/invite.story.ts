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
        text: this.#mentorText(streamTitle, subject?.name, subjectOutcome),
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
   * Текст субъекту — судьба проговаривается мягко первой строкой
   * (ui-spec S01, 2026-09-22): «завершил» → об одногруппниках и менторе,
   * «забросил»/«не начал» — о менторе и учёбе (тексты различаются).
   */
  #subjectText(streamTitle: string, outcome: StudentOutcome): MdText {
    const body =
      outcome === 'dropped'
        ? md`Ты покинул обучение — поделись впечатлениями о менторе и учёбе: это поможет школе и тем, кто только выбирает, учиться ли\\. Пиши только правду\\.`
        : outcome === 'never_started'
          ? md`Ты записался, но так и не начал обучение — расскажи, что остановило: это поможет школе и будущим студентам\\. Пиши только правду\\.`
          : md`Ты завершил обучение — поделись впечатлениями об одногруппниках и менторе: это часть цифрового профиля каждого\\. Пиши только правду\\.`;
    return mdJoin([this.#header(streamTitle), md``, body]);
  }

  /** Текст ментору — по судьбе подопечного (не найден — «студента»). */
  #mentorText(
    streamTitle: string,
    subjectName: string | undefined,
    outcome: StudentOutcome,
  ): MdText {
    const name = subjectName ?? 'студент';
    const body =
      outcome === 'dropped' || outcome === 'never_started'
        ? md`Твой подопечный ${name} покинул обучение — поделись наблюдениями: что удавалось, что можно было сделать иначе\\. Пиши только правду\\.`
        : md`Твой подопечный ${name} завершил обучение — выдай ему отзыв: как он проявлялся в учёбе, что удалось, что стоит подтянуть\\. Пиши только правду\\.`;
    return mdJoin([this.#header(streamTitle), md``, body]);
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
