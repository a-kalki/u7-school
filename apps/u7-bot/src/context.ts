import type { Context, SessionFlavor } from 'grammy';

/** Данные сессии */
export interface SessionData {
  menu: 'main' | 'onboarding';
}

/** Контекст Grammy-бота с поддержкой сессий */
export type BotContext = Context & SessionFlavor<SessionData>;
