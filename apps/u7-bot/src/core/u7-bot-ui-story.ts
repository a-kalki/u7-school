import type { User } from '@u7-scl/app/domain';
import { md } from '@u7-scl/core/shared';
import type {
  BotSession,
  CommandReaction,
  CommandUpdate,
  ProactiveSender,
  Screen,
} from '@u7-scl/core/ui';
import { BotUiStory } from '@u7-scl/core/ui';
import type { U7BotAppMeta, U7BotUiAppResolve } from './u7-bot-app-meta';
import type { MenuButton } from './u7-menu';

/**
 * Специализированный пользовательский сценарий для U7 Telegram-бота.
 *
 * Контракт команд (ФР-4, решения 2026-09-06): стори знает свой
 * диалог-путь (`dialogPath`) и реагирует в pipe только будучи активной
 * (`isActive`):
 * - `/start` → исключение-сторож (обрабатывает uiApp, до стори не доходит);
 * - `/help` → активна и есть контекстная справка → stop{info}; иначе pass;
 * - `/cancel` → активна → сброс себя + stop{info}; неактивна → pass
 *   без побочных действий (сброс только активной; глобальный сброс
 *   диалога на меню делает uiApp);
 * - прочее → pass (доменные команды — в переопределениях наследников).
 */
export abstract class U7BotUiStory extends BotUiStory<
  U7BotAppMeta,
  User,
  U7BotUiAppResolve
> {
  /** Имя контроллера-владельца — узнаётся при init. */
  #controllerName?: string;

  override init(
    resolve: U7BotUiAppResolve,
    controller?: ProactiveSender & { name?: string },
  ): void {
    this.#controllerName = controller?.name;
    super.init(resolve, controller);
  }

  /** Полный путь диалога этой стори: `controller/story`. */
  get dialogPath(): string {
    return `${this.#controllerName ?? '?'}/${this.name}`;
  }

  /** Открыт ли диалог этой стори (активна ли она). */
  isActive(session: BotSession): boolean {
    return session.dialog?.path === this.dialogPath;
  }

  /** Кнопки главного меню — декларативные данные. Дефолт — не участвует. */
  menuButtons(_actor: User): MenuButton[] {
    return [];
  }

  /**
   * Контекстная справка диалога для /help активной стори.
   * null — справки нет → pass → общий help приложения.
   */
  protected async contextHelp(
    _actor: User,
    _session: BotSession,
  ): Promise<Screen | null> {
    return null;
  }

  override async handleCommand(
    update: CommandUpdate,
    actor: User,
    session: BotSession,
  ): Promise<CommandReaction> {
    switch (update.command) {
      case 'start':
        throw new Error(
          `Команда /start обрабатывается uiApp — до стори ${this.dialogPath} она не доходит`,
        );
      case 'help': {
        if (!this.isActive(session)) return { reaction: 'pass' };
        const help = await this.contextHelp(actor, session);
        return help
          ? { reaction: 'stop', response: { info: help } }
          : { reaction: 'pass' };
      }
      case 'cancel': {
        if (!this.isActive(session)) return { reaction: 'pass' };
        this.reset();
        return {
          reaction: 'stop',
          response: { info: { text: md`Отменено\\. Наберите /start` } },
        };
      }
      default:
        return { reaction: 'pass' };
    }
  }
}
