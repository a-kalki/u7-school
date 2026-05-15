import { OnboardingController } from '@u7/onboarding';
import { createApiApp } from './api-app';
import { createBot } from './bot';
import { loadConfig } from './config';
import { registerOnboardingConversation } from './conversations/onboarding-conversation';
import { registerBeInTheKnowHandler } from './handlers/be-in-the-know-handler';
import { registerCancelHandler } from './handlers/cancel-handler';
import { registerStartHandler } from './handlers/start-handler';

const config = loadConfig();
const { apiApp, poolService } = createApiApp(config);
const controller = new OnboardingController(apiApp, poolService);
const bot = createBot(config, controller, apiApp);

// Сначала регистрируем conversations — они должны быть в chain ДО обработчиков,
// которые используют ctx.conversation.enter().
registerOnboardingConversation(bot, controller, config);

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
