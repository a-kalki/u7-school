import type { ConversationFlavor } from '@grammyjs/conversations';
import type { Context, SessionFlavor } from 'grammy';
import type { BotSession } from './session';

/**
 * Контекст Grammy-бота с session и conversations.
 */
export type BotContext = Context &
  SessionFlavor<BotSession> &
  ConversationFlavor<Context>;
