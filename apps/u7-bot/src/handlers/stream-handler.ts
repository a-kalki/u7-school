import type { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import type { UserFacade } from '@u7-scl/user/domain';
import type { Bot } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';

export function registerStreamHandler(
  _bot: Bot<BotContext>,
  _streamController: StreamController,
  _userFacade: UserFacade,
  _config: BotConfig,
) {
  // Здесь будет регистрация callback-запросов для потоков
  // bot.callbackQuery(...)
}
