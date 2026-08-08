import { U7BotController } from '@u7-scl/bot/u7-bot-controller';

/**
 * Контроллер mentor — «Инструменты ментора» (S02m, S07-S09).
 *
 * Тонкий реестр — делегирует все действия в U7BotUserStory.
 * Видимость: только роли MENTOR и ADMIN.
 *
 * TODO: добавить стори по мере переноса.
 */
export class MentorController extends U7BotController {
  readonly name = 'mentor';

  protected override readonly stories = [];
}
