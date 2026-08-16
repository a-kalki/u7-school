import type { User } from '@u7-scl/app/domain';
import { getGlobalLogger } from '@u7-scl/core/shared';
import {
  type BotResponse,
  BotUiApp,
  type KeyboardDescription,
} from '@u7-scl/core/ui';
import type { U7BotAppMeta, U7BotUiAppResolve } from './u7-bot-app-meta';
import type { U7BotController } from './u7-bot-controller';
import type { MainMenuAction, MenuAggregator } from './u7-menu';

/**
 * Оркестратор UI приложения U7 Bot.
 */
export class U7BotUiApp
  extends BotUiApp<U7BotAppMeta, User, U7BotUiAppResolve>
  implements MenuAggregator<User>
{
  protected declare readonly controllers: Map<string, U7BotController>;

  /**
   * Инициализация зависимостями UI-слоя U7-бота.
   */
  override init(resolve: U7BotUiAppResolve): void {
    super.init(resolve);
  }

  // ── Сбор главного меню ──

  /** Собирает пункты меню со всех контроллеров, сортирует по priority. */
  async collectMainMenu(actor: User): Promise<MainMenuAction[]> {
    const items: MainMenuAction[] = [];
    for (const c of this.controllers.values()) {
      try {
        const cItems = await c.handleStart(actor);
        items.push(...cItems);
      } catch (err) {
        getGlobalLogger()?.warn(
          'ui-app',
          'Ошибка контроллера в collectMainMenu',
          {
            error: String(err),
            controller: c.name,
          },
        );
      }
    }
    return items.sort((a, b) => a.priority - b.priority);
  }

  /** Собирает описания пунктов меню для /help. */
  async collectHelp(actor: User): Promise<string[]> {
    const menu = await this.collectMainMenu(actor);
    return menu
      .filter(
        (i): i is MainMenuAction & { description: string } =>
          typeof i.description === 'string',
      )
      .map((i) => i.description);
  }

  // ── MenuAggregator ──

  async collectAllMenuItems(actor: User): Promise<MainMenuAction[]> {
    return this.collectMainMenu(actor);
  }

  async collectAllHelpDescriptions(actor: User): Promise<string[]> {
    return this.collectHelp(actor);
  }

  // ── Системные команды ──

  /** Обрабатывает /start: приветствие от контроллера 'app' или fallback. */
  async handleWelcome(tgId: number): Promise<BotResponse> {
    const actor = await this.resolve.actorResolver(tgId);
    const appCtrl = this.controllers.get('app');
    if (appCtrl) {
      const response = await appCtrl.handleWelcome(actor);
      if (response) return response;
    }
    const items = await this.collectMainMenu(actor);
    const keyboard = this.#toKeyboard(items);
    return {
      sendMessage: {
        text: 'Выберите действие:',
        keyboard: keyboard ?? undefined,
      },
    };
  }

  /** Обрабатывает /help. */
  async handleHelp(tgId: number): Promise<BotResponse> {
    const actor = await this.resolve.actorResolver(tgId);
    const appCtrl = this.controllers.get('app');
    if (appCtrl) {
      const response = await appCtrl.handleHelpMessage(actor);
      if (response) return response;
    }
    return {
      sendMessage: { text: 'Нет доступных пунктов меню.' },
    };
  }

  // ── Приватные хелперы ──

  #toKeyboard(items: MainMenuAction[]): KeyboardDescription | null {
    const rows = items
      .filter((i) => i.kind === 'callback' || i.kind === 'url')
      .map((i) => [
        i.kind === 'url'
          ? { text: i.text, code: '', url: i.url }
          : { text: i.text, code: i.action },
      ]);
    if (rows.length === 0) return null;
    return { rows, isMultiple: false };
  }
}
