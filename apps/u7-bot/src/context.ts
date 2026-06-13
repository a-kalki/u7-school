import type { Context, SessionFlavor } from 'grammy';

/** Данные сессии пользователя с отслеживанием активного обработчика */
export interface SessionData {
  activeHandler: {
    /** Путь обработчика (controllerName/storyName) */
    path: string;
    /** Контекстные данные обработчика */
    context?: unknown;
    /** Timestamp истечения (мс) */
    expiresAt?: number;
  } | null;
  /** @deprecated Будет удалено в треке bot-cleanup. Используется только старыми handler'ами. */
  menu?: 'main' | 'onboarding' | 'create_stream';
}

/** Контекст Grammy-бота с поддержкой сессий */
export type BotContext = Context & SessionFlavor<SessionData>;
