import { OnboardingController } from '@u7/onboarding';
import { createApiApp } from './api-app';
import { createBot } from './bot';
import { loadConfig } from './config';
import { registerLinkHandler } from './handlers/link-handler';
import { registerStartHandler } from './handlers/start-handler';
import { registerStartOnboardingHandler } from './handlers/start-onboarding-handler';

const config = loadConfig();
const { apiApp } = createApiApp(config);
const controller = new OnboardingController(apiApp);

// ══ Верификация бота при старте ══
{
  const adminUser = await apiApp.execute(
    'get-user-by-uuid' as any,
    { uuid: config.botAdminUuid },
    config.botAdminUuid,
  );
  if (!adminUser) {
    throw new Error(
      `BOT_ADMIN_UUID не найден: пользователь ${config.botAdminUuid} не существует`,
    );
  }
  const roles = (adminUser as any).roles as string[] | undefined;
  if (!roles || !roles.includes('ADMIN')) {
    throw new Error(
      `BOT_ADMIN_UUID имеет недостаточные права: у пользователя ${config.botAdminUuid} нет роли ADMIN`,
    );
  }
  console.log('✅ Верификация бота пройдена: ADMIN подтверждён');
}

const bot = createBot(config, controller);

registerStartHandler(bot, apiApp, config);
registerLinkHandler(bot, config);
registerStartOnboardingHandler(bot, controller, config);

bot.catch((err) => {
  console.error('Bot error:', err);
});

bot.start();
console.log('Bot started');
