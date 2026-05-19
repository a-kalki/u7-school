/**
 * PM2 Ecosystem Config — production-запуск u7-bot.
 *
 * Использование:
 *   pm2 start pm2.config.cjs --env production
 *   pm2 start pm2.config.cjs --env production --update-env
 *   pm2 stop    pm2.config.cjs
 *   pm2 restart pm2.config.cjs --update-env
 *   pm2 logs    u7-bot
 *   pm2 save
 *   pm2 startup  # автозапуск после перезагрузки
 */

module.exports = {
  apps: [
    {
      name: 'u7-bot',
      script: '/home/admin/.bun/bin/bun',
      args: 'run apps/u7-bot/src/main.ts',
      interpreter: 'none',
      cwd: __dirname,

      // ══ Окружение ══
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },

      // ══ Производительность ══
      instances: 1,
      exec_mode: 'fork', // т.к. Bun + Telegram не поддерживают кластеризацию

      // ══ Логирование ══
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/u7-bot-error.log',
      out_file: './logs/u7-bot-out.log',
      merge_logs: true,

      // ══ Поведение ══
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,
      kill_timeout: 10_000,
      listen_timeout: 15_000,
      watch: false,

      // ══ Graceful shutdown ══
      shutdown_with_message: true,
    },
  ],
};
