import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { CatalogStory } from './stories/stream-catalog.story';
import { ViewStreamStory } from './stories/view-stream.story';

/**
 * Контроллер streams — «Потоки курсов» (S01-S04).
 *
 * Тонкий реестр — делегирует все действия в U7BotUserStory.
 * Содержит только перенесённые стори: catalog (S01) и view-stream (S02-S04).
 */
export class StreamsController extends U7BotController {
  readonly name = 'stream';

  protected override readonly stories = [
    new CatalogStory(),
    new ViewStreamStory(),
  ];
}
