// @ts-nocheck — старый handler, будет удалён в треке bot-cleanup
import type { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { UserFacade } from '@u7-scl/user/domain';
import type { Composer } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';

export function registerStreamHandler(
  _bot: Composer<BotContext>,
  _streamController: StreamController,
  _userFacade: UserFacade,
  _config: BotConfig,
) {
  // Здесь будет регистрация callback-запросов для потоков
  // bot.callbackQuery(...)
}
