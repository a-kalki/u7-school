import type { User } from '@u7-scl/app/domain';
import { getGlobalLogger, md } from '@u7-scl/core/shared';
import {
  BotUiApp,
  type KeyboardDescription,
  type ProactiveSender,
  type Screen,
} from '@u7-scl/core/ui';
import type { U7BotAppMeta, U7BotUiAppResolve } from './u7-bot-app-meta';
import type { U7BotController } from './u7-bot-controller';
import type { MainMenuAction, MenuAggregator } from './u7-menu';

/**
 * Оркестратор UI приложения U7 Bot на контракте «Диалог и Экран».
 *
 * Диалоговая механика (seq, delegate, /help, /cancel) — в ядре BotUiApp;
 * здесь только U7-специфика: якорь меню `app/menu`, welcome-экран и
 * общий help-fallback с агрегацией описаний контроллеров.
 */
export class U7BotUiApp
  extends BotUiApp<U7BotAppMeta, User, U7BotUiAppResolve>
  implements MenuAggregator<User>
{
  protected declare readonly controllers: Map<string, U7BotController>;

  /** Диалог меню после /start (сущностной стори нет — якорь для seq/штампов). */
  protected override readonly menuPath = 'app/menu';

  /**
   * Инициализация зависимостями UI-слоя U7-бота.
   * transport передаётся отдельным аргументом (ProactiveSender).
   */
  override init(resolve: U7BotUiAppResolve, transport?: ProactiveSender): void {
    super.init(resolve, transport);
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

  // ── Хуки ядра (welcome / help) ──

  /**
   * Экран меню для /start и дефолт-/cancel: приветствие от контроллера 'app'
   * (U7-текст) либо fallback «Выберите действие:» с агрегированной
   * клавиатурой.
   */
  protected override async buildMenuScreen(actor: User): Promise<Screen> {
    const appCtrl = this.controllers.get('app');
    if (appCtrl) {
      const welcome = await appCtrl.handleWelcome(actor);
      if (welcome) return welcome;
    }
    return this.#shortMenuScreen(actor);
  }

  /** /cancel — КОРОТКОЕ меню без приветствия (решение владельца). */
  protected override async buildCancelMenuScreen(actor: User): Promise<Screen> {
    return this.#shortMenuScreen(actor);
  }

  /** Короткий экран меню: текст + агрегированная клавиатура. */
  async #shortMenuScreen(actor: User): Promise<Screen> {
    const items = await this.collectMainMenu(actor);
    return {
      text: md`Выберите действие:`,
      keyboard: this.#toKeyboard(items) ?? undefined,
    };
  }

  /** Общий help-fallback: инструкция от контроллера 'app'. */
  protected override async buildHelpScreen(actor: User): Promise<Screen> {
    const appCtrl = this.controllers.get('app');
    if (appCtrl) {
      const help = await appCtrl.handleHelpMessage(actor);
      if (help) return help;
    }
    return { text: md`Нет доступных пунктов меню.` };
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
