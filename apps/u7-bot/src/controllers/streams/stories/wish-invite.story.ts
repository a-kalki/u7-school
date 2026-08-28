import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type {
  BotResponse,
  BotUpdate,
  SessionData,
  UiEventSubscription,
} from '@u7-scl/core/ui';
import { eventSubscription } from '@u7-scl/core/ui';
import type { Stream } from '@u7-scl/stream/domain';
import type { WishInviteEvent } from '@u7-scl/wish/domain';
import { Routes } from '../../shared/routes';

/**
 * S11: Приглашение желающим при открытии набора (проактивное).
 *
 * Подписка на wish:invite (публикует ER invite-wishers при stream.created).
 * Доставка через ProactiveSender.send — сообщение с кнопками ломает текущий
 * флоу (клавиатура предыдущего экрана снимается; notify() строго без кнопок).
 * Текст адаптивен по wishKind: course/module. Кнопка отмены ведёт на
 * соответствующий экран W05/W05-M по id из желания (cancel-маршрут).
 */
export class WishInviteStory extends U7BotUiStory {
  readonly name = 'wish-invite';

  // ── Подписки на доменные события ──

  override getEventSubscriptions(): UiEventSubscription[] {
    return [
      eventSubscription<WishInviteEvent>('wish:invite', (event) =>
        this.#handleInvite(event),
      ),
    ];
  }

  async #handleInvite(event: WishInviteEvent): Promise<void> {
    const { streamId, telegramId, wishKind } = event.payload;

    // Название/дата/ментор — сбой загрузки не должен ломать рассылку остальным
    let stream: Stream | undefined;
    try {
      stream = (await this.appApi.execute('get-stream', {
        streamId,
      })) as Stream;
    } catch {
      return;
    }
    if (!stream) return;

    let mentorName: string | undefined;
    let mentorNick: string | undefined;
    try {
      const mentor = (await this.appApi.execute('get-user', {
        uuid: stream.mentorId,
      })) as { name: string; nick?: string };
      mentorName = mentor?.name;
      mentorNick = mentor?.nick;
    } catch {
      // ментор-строка опциональна
    }

    const headline =
      wishKind === 'course'
        ? '📣 Открылся набор на курс, который ты хотел пройти\\!'
        : '📣 Открылся набор на модуль, который ты хотел пройти\\!';

    const lines: string[] = [
      headline,
      '',
      `📚 Поток: ${this.escapeMarkdown(stream.title)}`,
      `📅 Старт: ${this.escapeMarkdown(this.#formatDate(stream.startDate))}`,
    ];

    if (mentorName) {
      // t.me строится только из Telegram-username
      const mentorLine = this.escapeMarkdown(mentorName);
      lines.push(
        mentorNick
          ? `👤 Ментор: ${mentorLine} ([@${this.escapeMarkdown(mentorNick)}](https://t.me/${mentorNick}))`
          : `👤 Ментор: ${mentorLine}`,
      );
    }

    lines.push('', 'Для записи нужен ключ зачисления — его выдаёт ментор\\.');

    const cancelCode =
      wishKind === 'course' && event.payload.courseId
        ? Routes.course.cancelWishCourse(event.payload.courseId)
        : event.payload.moduleId
          ? Routes.course.cancelWishModule(event.payload.moduleId)
          : undefined;

    const rows: Array<Array<{ text: string; code: string }>> = [
      [{ text: '📚 Открыть поток', code: Routes.stream.view(streamId) }],
    ];
    if (cancelCode) {
      rows.push([{ text: '🗑️ Отменить желание', code: cancelCode }]);
    }

    await this.proactiveSender.send(telegramId, {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    });
  }

  // ── Story не интерактивна: callback/сообщения не обрабатывает ──

  override async handleCallback(
    _action: string,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  override async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  #formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = d.getUTCFullYear();
      return `${dd}.${mm}.${yyyy}`;
    } catch {
      return iso;
    }
  }
}
