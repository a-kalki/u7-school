import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { CatalogStory } from './stories/stream-catalog.story';
import { ViewStreamStory } from './stories/view-stream.story';
import { WishInviteStory } from './stories/wish-invite.story';

/**
 * Контроллер streams — «Потоки курсов» (S01-S04, S11).
 *
 * Тонкий реестр — делегирует все действия в U7BotUiStory.
 * Содержит перенесённые стори: catalog (S01), view-stream (S02-S04)
 * и wish-invite (S11 — проактивное приглашение желающим).
 */
export class StreamsController extends U7BotController {
  readonly name = 'stream';

  protected override readonly stories = [
    new CatalogStory(),
    new ViewStreamStory(),
    new WishInviteStory(),
  ];
}
