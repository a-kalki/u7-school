import type { User } from '@u7-scl/app/domain';
import type {
  BotResponse,
  BotUpdate,
  SessionData,
  UiEventSubscription,
} from '@u7-scl/core/ui';
import { eventSubscription } from '@u7-scl/core/ui';
import type { UserNotifiedEvent } from '@u7-scl/user/domain';
import { U7BotUiStory } from '../../../core/u7-bot-ui-story';

/**
 * Доставка уведомлений user.notified — единственный подписчик механизма.
 *
 * Резолвит пользователя (get-user) → telegramId и доставляет plain-текст
 * через proactiveSender.notify: без кнопок — уведомление не перехватывает
 * ввод (keepPrevKeyboard, 🔔-заголовок — забота транспорта).
 * Пользователь не найден / нет telegramId → лог-ошибка, пропуск,
 * приложение не падает. Ошибки доставки изолирует шина (InProcEventBus).
 */
export class NotifyStory extends U7BotUiStory {
  readonly name = 'notify';

  // ── Подписки на доменные события ──

  override getEventSubscriptions(): UiEventSubscription[] {
    return [
      eventSubscription<UserNotifiedEvent>('user.notified', (event) =>
        this.#handleNotified(event),
      ),
    ];
  }

  async #handleNotified(event: UserNotifiedEvent): Promise<void> {
    const { userId, text } = event.payload;

    let user: User | undefined;
    try {
      user = (await this.appApi.execute('get-user', {
        uuid: userId,
      })) as User | undefined;
    } catch (err) {
      this.logger?.error('notify-story', 'Профиль адресата недоступен', {
        userId,
        error: String(err),
      });
      return;
    }
    if (!user) {
      this.logger?.error('notify-story', 'Адресат уведомления не найден', {
        userId,
      });
      return;
    }
    if (user.telegramId === undefined) {
      this.logger?.error(
        'notify-story',
        'У адресата нет telegramId — уведомление не доставлено',
        { userId },
      );
      return;
    }

    // Текст уведомления — plain: экранирование MarkdownV2 выполняется здесь,
    // отправители (UC/ER/Job) передают чистый текст.
    await this.proactiveSender.notify(user.telegramId, {
      text: this.escapeMarkdown(text),
      parseMode: 'MarkdownV2',
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
}
