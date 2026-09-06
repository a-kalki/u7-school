import type { User } from '@u7-scl/app/domain';
import {
  getGlobalLogger,
  type Logger,
  md,
  parseLogLevel,
} from '@u7-scl/core/shared';
import {
  type BotSession,
  BotUiApp,
  type CommandUpdate,
  type DialogResponse,
  type KeyboardDescription,
  type ProactiveSender,
  type Screen,
} from '@u7-scl/core/ui';
import type { UserFacade } from '@u7-scl/user/domain';
import { ensureRegisteredGuest } from '../ensure-registered';
import type { U7BotAppMeta, U7BotUiAppResolve } from './u7-bot-app-meta';
import type { U7BotController } from './u7-bot-controller';
import type { MainMenuAction, MenuAggregator } from './u7-menu';

/**
 * Зависимости appCommand-гейта (правила u7 на входе конвейера ФР-4):
 * гост-регистрация /start, админ-гейт /log_level.
 */
export interface AppCommandGateOptions {
  /** tgId администраторов — доступ к /log_level */
  adminTelegramIds: number[];
  /** фасад пользователей — идемпотентная гост-регистрация на /start */
  userFacade: UserFacade;
  /** системный актор-бот (BOT_ADMIN_UUID) — регистрация гостя от его имени */
  botAdminUuid: string;
}

/**
 * Оркестратор UI приложения U7 Bot на контракте «Диалог и Экран».
 *
 * Диалоговая механика (seq, delegate, конвейер команд) — в ядре BotUiApp;
 * здесь только U7-специфика: якорь меню `app/menu`, welcome-экран и
 * общий help-fallback с агрегацией описаний контроллеров, а также
 * appCommand-гейт правил приложения (/start — гост-регистрация,
 * /log_level — админ-гейт, /help на меню — main-help).
 */
export class U7BotUiApp
  extends BotUiApp<U7BotAppMeta, User, U7BotUiAppResolve>
  implements MenuAggregator<User>
{
  protected declare readonly controllers: Map<string, U7BotController>;

  /** Диалог меню после /start (сущностной стори нет — якорь для seq/штампов). */
  protected override readonly menuPath = 'app/menu';

  readonly #gate: AppCommandGateOptions;

  constructor(controllers: U7BotController[], gate: AppCommandGateOptions) {
    super(controllers);
    this.#gate = gate;
  }

  /**
   * Инициализация зависимостями UI-слоя U7-бота.
   * transport передаётся отдельным аргументом (ProactiveSender).
   */
  override init(resolve: U7BotUiAppResolve, transport?: ProactiveSender): void {
    super.init(resolve, transport);
  }

  // ── appCommand-гейт: правила u7 на входе конвейера (ФР-4) ──

  /**
   * Перехват команд приложения ДО конвейера (null = «пропускаю»):
   * - /start — идемпотентная гост-регистрация нового tgId + лог топ-меню,
   *   затем конвейер продолжает (welcome-меню — core-дефолт);
   * - /log_level — скрытая админ-команда: не-админу — тишина, админу —
   *   смена уровня глобального логгера с info-подтверждением;
   * - /help при активном меню — main-help (инструкция + описания кнопок);
   *   в остальных диалогах — пропускаю (справка стори или fallback).
   */
  protected override async handleAppCommand(
    update: CommandUpdate,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    switch (update.command) {
      case 'start':
        await this.#gateStart(update, tgId);
        return null;
      case 'log_level':
        return this.#gateLogLevel(update, tgId);
      case 'help':
        return this.#gateHelpOnMenu(update, tgId, session);
      default:
        return null;
    }
  }

  /** /start: гост-регистрация (гость до резолва актора) + лог топ-меню. */
  async #gateStart(update: CommandUpdate, tgId: number): Promise<void> {
    this.#logger?.info(
      'top-menu',
      `Команда /start от пользователя ${tgId} (${update.name || '?'})`,
    );
    await ensureRegisteredGuest(
      this.#gate.userFacade,
      this.#gate.botAdminUuid,
      {
        id: tgId,
        first_name: update.name ?? 'друг',
        ...(update.username !== undefined ? { username: update.username } : {}),
      },
    );
  }

  /** /log_level: админ-гейт — как в wiring'е ранее, ответы info-репликой. */
  #gateLogLevel(update: CommandUpdate, tgId: number): Promise<DialogResponse> {
    // Не-админ: тихий перехват — команда обработана, но без реплики.
    if (!this.#gate.adminTelegramIds.includes(tgId)) {
      return Promise.resolve({});
    }

    const args = update.args;
    if (!args) {
      return Promise.resolve({
        info: {
          text: md`${'Использование: /log_level <уровень>\n\nДоступные уровни: debug, info, warn, error, all'}`,
        },
      });
    }

    const level = parseLogLevel(args);
    if (level === undefined) {
      return Promise.resolve({
        info: {
          text: md`Неизвестный уровень: "${args}". Доступные: ${'debug, info, warn, error, all'}`,
        },
      });
    }

    const logger = this.#logger;
    logger?.setLogLevel(level);
    logger?.info(
      'log_level',
      `Уровень логирования изменён на ${args} администратором ${tgId}`,
    );
    return Promise.resolve({
      info: { text: md`✅ Уровень логирования изменён на: ${args}` },
    });
  }

  /** /help на активном меню — main-help; иначе пропуск (стори → fallback). */
  async #gateHelpOnMenu(
    _update: CommandUpdate,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    if (session.dialog?.path !== this.menuPath) {
      return null;
    }
    const actor = await this.resolve.actorResolver(tgId);
    const appCtrl = this.controllers.get('app');
    const help = appCtrl ? await appCtrl.handleHelpMessage(actor) : null;
    return help ? { info: help } : null;
  }

  get #logger(): Logger | undefined {
    return getGlobalLogger();
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
