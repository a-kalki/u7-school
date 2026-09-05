import type { Context } from 'grammy';

// Единый тип сессии из @u7-scl/core (владелец — BotTransport, не Grammy)
export type { BotSession } from '@u7-scl/core/ui';

/**
 * Контекст Grammy-бота.
 *
 * Grammy-session удалены: сессиями BotSession владеет транспорт
 * (контракт «Диалог и Экран») — ctx.session никем не читается.
 */
export type BotContext = Context;
