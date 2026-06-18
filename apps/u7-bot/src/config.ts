import * as v from 'valibot';

/**
 * Схема валидации конфигурации бота.
 * Bun загружает .env автоматически — dotenv не требуется.
 */
export const BotConfigSchema = v.object({
  botToken: v.pipe(v.string(), v.nonEmpty('BOT_TOKEN не может быть пустым')),
  newsGroupUrl: v.pipe(
    v.string(),
    v.nonEmpty('NEWS_GROUP_URL не может быть пустым'),
  ),
  schoolGroupUrl: v.optional(
    v.pipe(v.string(), v.nonEmpty('SCHOOL_GROUP_URL не может быть пустым')),
  ),
  botAdminUuid: v.pipe(
    v.string(),
    v.uuid('BOT_ADMIN_UUID должен быть валидным UUID'),
  ),
  dbDir: v.optional(
    v.pipe(v.string(), v.nonEmpty('DB_DIR не может быть пустым')),
    './data',
  ),

  // ══ Режим бота ══
  botMode: v.optional(v.picklist(['polling', 'webhook']), 'polling'),

  // ══ Webhook (только если botMode = 'webhook') ══
  webhookUrl: v.optional(v.string()),
  webhookPort: v.optional(
    v.pipe(v.number(), v.minValue(1), v.maxValue(65535)),
    8443,
  ),
  webhookPath: v.optional(v.pipe(v.string(), v.nonEmpty()), '/webhook'),

  // ══ Токен для TelegramLogger (отдельный бот, чтобы не пересекался с основным) ══
  loggerBotToken: v.optional(v.string(), ''),

  // ══ Администраторы для уведомлений ══
  adminTelegramIds: v.optional(
    v.pipe(
      v.string(),
      v.transform((input) =>
        input
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => Number(s))
          .filter((n) => !Number.isNaN(n)),
      ),
    ),
    '',
  ),
});

export type BotConfig = v.InferOutput<typeof BotConfigSchema>;

/**
 * Читает и валидирует конфигурацию из process.env.
 * Bun загружает .env автоматически — dotenv не требуется.
 */
export function loadConfig(): BotConfig {
  const raw = {
    botToken: process.env.BOT_TOKEN,
    newsGroupUrl: process.env.NEWS_GROUP_URL,
    botAdminUuid: process.env.BOT_ADMIN_UUID,
    botMode: process.env.BOT_MODE,
    webhookUrl: process.env.WEBHOOK_URL,
    webhookPort: process.env.WEBHOOK_PORT
      ? Number(process.env.WEBHOOK_PORT)
      : undefined,
    webhookPath: process.env.WEBHOOK_PATH,
    schoolGroupUrl: process.env.SCHOOL_GROUP_URL,
    adminTelegramIds: process.env.ADMIN_TELEGRAM_IDS,
    loggerBotToken: process.env.LOGGER_BOT_TOKEN,
    dbDir: process.env.DB_DIR,
  };

  return v.parse(BotConfigSchema, raw);
}
