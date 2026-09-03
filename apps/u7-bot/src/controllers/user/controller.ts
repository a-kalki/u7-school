import { U7BotController } from '../../core/u7-bot-controller';
import { NotifyStory } from './stories/notify.story';

/**
 * Контроллер user — доставка уведомлений механизма userFacade.notify.
 *
 * Тонкий реестр — делегирует все действия в U7BotUiStory.
 * Содержит сторю notify: подписку на user.notified, резолв telegramId
 * и доставку через proactiveSender (без кнопок, не перехватывает ввод).
 */
export class UserController extends U7BotController {
  readonly name = 'user';

  protected override readonly stories = [new NotifyStory()];
}
