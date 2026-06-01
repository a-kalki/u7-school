import type { StreamController } from '@u7-scl/stream/src/ui/bot/controller/stream-controller';
import type { UserFacade } from '@u7-scl/user/domain';
import type { Bot } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';
import { executeResponses } from '../ui-utils';

export function registerStreamHandler(
  bot: Bot<BotContext>,
  controller: StreamController,
  userFacade: UserFacade,
  config: BotConfig,
) {
  // ══ Обработка команд потоков — форвард в контроллер ══
  bot.command('streams', async (ctx, next) => {
    if (!ctx.from) return next();

    // 1. Получаем пользователя для корректного actorId
    const user = await userFacade.getUserByTelegramId(ctx.from.id);
    const actorId = user?.uuid ?? config.botAdminUuid;

    const response = await controller.handleUpdate(
      {
        type: 'command',
        command: 'streams',
        telegramId: ctx.from.id,
      },
      actorId,
    );

    await executeResponses(ctx, response);
  });
}
