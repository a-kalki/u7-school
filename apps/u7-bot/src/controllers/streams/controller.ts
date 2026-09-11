import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { InactivityStory } from './stories/inactivity.story';
import { CatalogStory } from './stories/stream-catalog.story';
import { ViewStreamStory } from './stories/view-stream.story';

/**
 * Контроллер streams — «Потоки курсов» (S01-S04).
 *
 * Тонкий реестр — делегирует все действия в U7BotUiStory.
 * Содержит стори: catalog (S01), view-stream (S02-S04)
 * и inactivity (уведомления о бездействии и уходе из учёбы).
 * S11 (приглашение желающих) — ER invite-wishers (userFacade.notify).
 */
export class StreamsController extends U7BotController {
  readonly name = 'stream';

  protected override readonly stories = [
    new CatalogStory(),
    new ViewStreamStory(),
    new InactivityStory(),
  ];
}
