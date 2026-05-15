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

registerStartHandler(bot, controller, apiApp, config);
registerBeInTheKnowHandler(bot, config);
registerCancelHandler(bot, controller, config);
registerOnboardingConversation(bot, controller, config);

bot.start();
console.log('Bot started');
