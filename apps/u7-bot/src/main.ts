import { OnboardingController } from '@u7/onboarding';
import { createApiApp } from './api-app';
import { createBot } from './bot';
import { loadConfig } from './config';
import { registerOnboardingHandler } from './handlers/onboarding-handler';
import { registerTopMenuHandler } from './handlers/top-menu-handler';

const config = loadConfig();
const { apiApp, userFacade } = createApiApp(config);
const controller = new OnboardingController(apiApp);

// ══ Верификация бота при старте ══
{
  const adminUser = await userFacade.getUserByUuid(
    config.botAdminUuid,
    config.botAdminUuid,
  );
  if (!adminUser) {
    throw new Error(
      `BOT_ADMIN_UUID не найден: пользователь ${config.botAdminUuid} не существует`,
    );
  }
  const roles = adminUser.roles as string[] | undefined;
  if (!roles || !roles.includes('ADMIN')) {
    throw new Error(
      `BOT_ADMIN_UUID имеет недостаточные права: у пользователя ${config.botAdminUuid} нет роли ADMIN`,
    );
  }
  console.log('✅ Верификация бота пройдена: ADMIN подтверждён');
}

const bot = createBot(config);

registerTopMenuHandler(bot, userFacade, controller, config);
registerOnboardingHandler(bot, controller, config);

bot.catch((err) => {
  console.error('Bot error:', err);
});

bot.start();
console.log('Bot started');
