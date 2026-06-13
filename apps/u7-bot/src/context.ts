import type { Context, SessionFlavor } from 'grammy';

// Единый тип сессии из @u7-scl/core
export type { SessionData } from '@u7-scl/core/ui';

import type { SessionData } from '@u7-scl/core/ui';

/** Контекст Grammy-бота с поддержкой сессий */
export type BotContext = Context & SessionFlavor<SessionData>;
