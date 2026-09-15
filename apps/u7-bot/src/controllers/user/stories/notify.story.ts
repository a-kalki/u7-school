import type { User } from '@u7-scl/app/domain';
import { mdRaw, safeConvert } from '@u7-scl/core/shared';
import type {
  BotSession,
  DialogResponse,
  UiEventSubscription,
} from '@u7-scl/core/ui';
import { eventSubscription } from '@u7-scl/core/ui';
import type { UserNotifiedEvent } from '@u7-scl/user/domain';
import { U7BotUiStory } from '../../../core/u7-bot-ui-story';

/**
 * Доставка уведомлений user.notified — единственный подписчик механизма.
 *
 * Резолвит пользователя (get-user) → telegramId и доставляет проактивную
 * реплику через proactiveSender.notify: текст без кнопок (И3: проактив не
 * трогает сессию и клавиатуры), вид — единая таблица ФР-5 (заголовок и
 * оформление — забота транспорта); kind из события пробрасывается в
 * payload (по умолчанию — notify). Текст события — упрощённый markdown
 * без экранирования: в точке доставки конвертируется в MarkdownV2 через
 * safeConvert (пунктуация экранируется, разметка конвертируется) —
 * отправителю знать диалект канала не нужно.
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
    const { userId, text, kind } = event.payload;

    let user: User | undefined;
    try {
      user = await this.appApi.execute('get-user', {
        uuid: userId,
      });
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

    await this.proactiveSender.notify(user.telegramId, {
      text: mdRaw(safeConvert(text)),
      kind: kind ?? 'notify',
    });
  }

  // ── Story не интерактивна: callback не обрабатывает ──

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    return this.unknownCommand(action, actor, session);
  }

  // handleMessage не переопределяется: дефолт ядра — реплика-отказ
  // без захвата экрана (ввод до неинтерактивной стори не доходит).
}
