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
  botAdminUuid: v.pipe(
    v.string(),
    v.uuid('BOT_ADMIN_UUID должен быть валидным UUID'),
  ),
  dbDir: v.optional(
    v.pipe(v.string(), v.nonEmpty('DB_DIR не может быть пустым')),
    './data',
  ),
});

export type BotConfig = v.InferOutput<typeof BotConfigSchema>;

/**
 * Читает и валидирует конфигурацию из process.env.
 */
export function loadConfig(): BotConfig {
  const raw = {
    botToken: process.env.BOT_TOKEN,
    newsGroupUrl: process.env.NEWS_GROUP_URL,
    botAdminUuid: process.env.BOT_ADMIN_UUID,
    dbDir: process.env.DB_DIR,
  };

  return v.parse(BotConfigSchema, raw);
}
