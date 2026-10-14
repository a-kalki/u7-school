import type { User } from '@u7-scl/app/domain';
import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { md, parseLogLevel } from '@u7-scl/core/shared';
import type {
  BotSession,
  CommandReaction,
  CommandUpdate,
  DialogResponse,
} from '@u7-scl/core/ui';

/**
 * Контроллер уровня приложения для системных сценариев:
 * - `/log_level` — скрытая админ-команда (handleCommand-override);
 * - кнопка «❓ Помощь» (menuButtons);
 * - callback'и стори.
 *
 * Меню и общий help собирает U7BotUiApp (menuButtons — декларативные
 * данные); welcome/main-help-тексты — там же.
 */
export class AppController extends U7BotController {
  readonly name = 'app';
  readonly #adminTelegramIds?: number[];

  /**
   * @param _schoolGroupUrl — устаревший параметр для совместимости (сообщество перенесено в SchoolController)
   * @param adminTelegramIds — tgId администраторов (доступ к /log_level, по умолчанию из resolve)
   */
  constructor(_schoolGroupUrl?: string, adminTelegramIds?: number[]) {
    super();
    this.#adminTelegramIds = adminTelegramIds;
  }

  // ── Главное меню (декларативные кнопки) ──

  override async menuButtons(_actor: User): Promise<MenuButton[]> {
    return [
      {
        kind: 'callback',
        text: '❓ Помощь',
        action: this.cb('help'),
        priority: 100,
      },
    ];
  }

  // ── Команды (ФР-4: перехват /log_level, прочее — pipe стори) ──

  /**
   * `/log_level`: не-админ → stop{} (тишина); админ → stop{info}
   * (parseLogLevel). Прочие команды — super (свои стори).
   */
  override async handleCommand(
    update: CommandUpdate,
    actor: User,
    session: BotSession,
  ): Promise<CommandReaction> {
    if (update.command === 'log_level') {
      return { reaction: 'stop', response: this.#logLevelResponse(update) };
    }
    return super.handleCommand(update, actor, session);
  }

  #logLevelResponse(update: CommandUpdate): DialogResponse {
    const adminIds =
      this.#adminTelegramIds ?? this.resolve?.adminTelegramIds ?? [];
    // Не-админ: тихий терминал — команда обработана, но без реплики.
    if (!adminIds.includes(update.telegramId)) {
      return {};
    }

    const args = update.args;
    if (!args) {
      return {
        notify: {
          text: md`${'Использование: /log_level <уровень>\n\nДоступные уровни: debug, info, warn, error, all'}`,
        },
      };
    }

    const level = parseLogLevel(args);
    if (level === undefined) {
      return {
        notify: {
          text: md`Неизвестный уровень: "${args}". Доступные: ${'debug, info, warn, error, all'}`,
        },
      };
    }

    this.logger?.setLogLevel(level);
    this.logger?.info(
      'log_level',
      `Уровень логирования изменён на ${args} администратором ${update.telegramId}`,
    );
    return { notify: { text: md`✅ Уровень логирования изменён на: ${args}` } };
  }

  // ── Callback (стори-роутинг) ──

  override async handleCallback(
    data: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    // Делегируем в stories (например, CommunityStory)
    for (const story of this.stories) {
      const prefix = `${story.name}:`;
      if (data.startsWith(prefix)) {
        const raw = data.slice(prefix.length);
        return story.handleCallback(raw, actor, session);
      }
    }

    return { screen: { text: md`⚠️ Неизвестная команда` } };
  }
}
