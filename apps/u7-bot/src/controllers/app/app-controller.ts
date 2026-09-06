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
import { CommunityStory } from './stories/community.story';

/**
 * Контроллер уровня приложения для системных сценариев:
 * - `/log_level` — скрытая админ-команда (handleCommand-override);
 * - кнопки «❓ Помощь» (menuButtons) и «Сообщество школы» (CommunityStory);
 * - callback'и стори (community).
 *
 * Меню и общий help собирает U7BotUiApp (menuButtons — декларативные
 * данные); welcome/main-help-тексты — там же (решения 2026-09-06).
 */
export class AppController extends U7BotController {
  readonly name = 'app';
  readonly #adminTelegramIds: number[];

  /**
   * @param schoolGroupUrl — URL группы школы (обязателен)
   * @param adminTelegramIds — tgId администраторов (доступ к /log_level)
   */
  constructor(schoolGroupUrl: string, adminTelegramIds: number[] = []) {
    super();
    this.#adminTelegramIds = adminTelegramIds;
    this.stories.push(new CommunityStory(schoolGroupUrl));
  }

  // ── Главное меню (декларативные кнопки) ──

  override menuButtons(actor: User): MenuButton[] {
    return [
      ...super.menuButtons(actor), // сообщество школы (CommunityStory, 90)
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
   * (parseLogLevel, тексты прежние). Прочие команды — super (свои стори).
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
    // Не-админ: тихий терминал — команда обработана, но без реплики.
    if (!this.#adminTelegramIds.includes(update.telegramId)) {
      return {};
    }

    const args = update.args;
    if (!args) {
      return {
        info: {
          text: md`${'Использование: /log_level <уровень>\n\nДоступные уровни: debug, info, warn, error, all'}`,
        },
      };
    }

    const level = parseLogLevel(args);
    if (level === undefined) {
      return {
        info: {
          text: md`Неизвестный уровень: "${args}". Доступные: ${'debug, info, warn, error, all'}`,
        },
      };
    }

    this.logger?.setLogLevel(level);
    this.logger?.info(
      'log_level',
      `Уровень логирования изменён на ${args} администратором ${update.telegramId}`,
    );
    return { info: { text: md`✅ Уровень логирования изменён на: ${args}` } };
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
