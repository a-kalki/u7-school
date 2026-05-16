import { OnboardingController } from '@u7/onboarding';
import { createApiApp } from './api-app';
import { createBot } from './bot';
import { loadConfig } from './config';
import { registerBeInTheKnowHandler } from './handlers/be-in-the-know-handler';
import { registerCancelHandler } from './handlers/cancel-handler';
import { registerStartHandler } from './handlers/start-handler';

const config = loadConfig();
const { apiApp, poolService } = createApiApp(config);
const controller = new OnboardingController(apiApp, config.botAdminUuid);
const bot = createBot(config, controller, apiApp);

// Затем регистрируем обработчики команд и callback-ов.
registerStartHandler(bot, controller, apiApp, config);
registerBeInTheKnowHandler(bot, config);
registerCancelHandler(bot, controller, config);

// Graceful error handling — бот не падает при ошибках в middleware.
bot.catch((err) => {
  console.error('Bot error:', err);
});

bot.start();
console.log('Bot started');
