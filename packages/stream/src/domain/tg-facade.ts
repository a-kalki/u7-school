/**
 * Порт для отправки сообщений в Telegram.
 * Используется use-case'ами потока для уведомления студентов.
 */
export interface TgFacade {
  /** Отправить текстовое сообщение одному пользователю по Telegram ID */
  sendMessage(telegramId: number, text: string): Promise<void>;

  /** Отправить одно и то же сообщение нескольким пользователям */
  sendBatch(telegramIds: number[], text: string): Promise<void>;
}
