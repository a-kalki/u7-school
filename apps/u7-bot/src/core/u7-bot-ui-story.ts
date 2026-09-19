import type { User } from '@u7-scl/app/domain';
import { type MdText, md, mdConcat, mdRaw } from '@u7-scl/core/shared';
import type {
  BotSession,
  CommandReaction,
  CommandUpdate,
  DialogCache,
  DialogResponse,
  KbButton,
  Paged,
  ProactiveSender,
} from '@u7-scl/core/ui';
import { BotPaginator, BotUiStory } from '@u7-scl/core/ui';
import { APP_CODES } from '../shared/app-codes';
import type { U7BotAppMeta, U7BotUiAppResolve } from './u7-bot-app-meta';
import type { MenuButton } from './u7-menu';

/** Опции постраничного экрана (хелпер U7BotUiStory.pagedScreen). */
interface PagedScreenOpts {
  /** Сборка экрана: чтение домена + шапка и ЦЕЛЫЕ блоки контента.
   * Вызывается ТОЛЬКО при промахе кеша — тыки навигации не перечитывают домен. */
  build: () =>
    | { header: MdText; blocks: string[] }
    | Promise<{ header: MdText; blocks: string[] }>;
  /** Экран-заглушка при пустом наборе блоков (не кешируется). */
  emptyScreen: () => DialogResponse;
  /** Ключ кеша `DialogCache` — включает параметры экрана (id и т.п.). */
  cacheKey: string;
  /** Ряды под навигацией («Назад», главное меню и т.п.). */
  bottomRows: KbButton[][];
  /** Запрошенная страница (0-based; за пределами — clamp). */
  pageIndex?: number;
  /** Callback-код страницы: `cb(n)` для навигационных кнопок. */
  cbPage: (n: number) => string;
  /** Сессия — эпоха кеша. */
  session: BotSession;
  /** Telegram ID пользователя — ключ кеша. */
  tgId: number;
}

/** Закешированные страницы экрана: шапка + разбиение. */
interface CachedPaged {
  header: MdText;
  paged: Paged;
}

/**
 * Специализированный пользовательский сценарий для U7 Telegram-бота.
 *
 * Контракт команд (ФР-4): стори
 * знает свой диалог-путь (`dialogPath`) и реагирует в pipe только будучи
 * активной (`isActive`):
 * - `/start` → исключение-сторож (обрабатывает uiApp, до стори не доходит);
 * - `/help` → тоже uiApp напрямую, мимо pipe: активной стори задаётся
 *   `contextHelp()` (публичный, зовёт uiApp), остальным — общий help;
 * - `/cancel` → активна → сброс себя + stop{notify}; неактивна → pass
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
    dialogCache?: DialogCache,
  ): void {
    this.#controllerName = controller?.name;
    super.init(resolve, controller, dialogCache);
  }

  /** Полный путь диалога этой стори: `controller/story`. */
  get dialogPath(): string {
    return `${this.#controllerName ?? '?'}/${this.name}`;
  }

  /** Открыт ли диалог этой стори (активна ли она). */
  isActive(session: BotSession): boolean {
    return session.dialog?.path === this.dialogPath;
  }

  /** Кнопка выхода на экранах ошибок: «⬅️ Меню» (системный код приложения). */
  protected override errorExitRows(): { text: string; code: string }[][] {
    return [[{ text: '⬅️ Меню', code: APP_CODES.mainMenu }]];
  }

  /** Кнопки главного меню — декларативные данные. Дефолт — не участвует. */
  menuButtons(_actor: User): MenuButton[] {
    return [];
  }

  // ── Постраничные экраны (трек pagination) ──

  /** Пагинатор стори u7-bot: лимит Telegram, ряд навигации, индикатор. */
  protected readonly botPaginator = new BotPaginator();

  /**
   * Экран с постраничным контентом: страницы из целых блоков, кеш страниц
   * в `DialogCache` (ленивая `build` — тыки навигации не перечитывают
   * домен), ряд `‹ Пред` / `След ›` над `bottomRows`, индикатор
   * `· Стр. N/M` — суффикс шапки (только на многостраничных экранах).
   * Листание — edit на месте (тот же диалог — seq не растёт, транспорт
   * редактирует сообщение).
   */
  protected async pagedScreen(opts: PagedScreenOpts): Promise<DialogResponse> {
    let cached = this.dialogCache.get<CachedPaged>(
      opts.tgId,
      opts.cacheKey,
      opts.session,
    );
    if (!cached) {
      const built = await opts.build();
      // Бюджет страницы: шапка (с запасом на индикатор) + резерв ядра
      cached = {
        header: built.header,
        paged: this.botPaginator.paginate(built.blocks, {
          limit: this.botPaginator.botLimit(built.header.length + 16),
        }),
      };
      this.dialogCache.set(opts.tgId, opts.cacheKey, cached, opts.session);
    }

    const page = this.botPaginator.page(cached.paged, opts.pageIndex ?? 0);
    if (!page) {
      return opts.emptyScreen();
    }

    const indicator = this.botPaginator.indicator(page);
    const header = indicator
      ? mdConcat(cached.header, md` · ${indicator}`)
      : cached.header;

    return this.screen(
      mdConcat(header, md`\n\n`, mdRaw(page.text)),
      this.kb([
        ...this.botPaginator.navRows(page, opts.cbPage),
        ...opts.bottomRows,
      ]),
    );
  }

  /**
   * Контекстная справка диалога. ПУБЛИЧНЫЙ мост для uiApp: при /help
   * спрашивается только активная стори (неактивным help не достаётся —
   * механизм принадлежит uiApp). null — справки нет → общий help.
   */
  async contextHelp(
    _actor: User,
    _session: BotSession,
  ): Promise<MdText | null> {
    return null;
  }

  override async handleCommand(
    update: CommandUpdate,
    _actor: User,
    session: BotSession,
  ): Promise<CommandReaction> {
    switch (update.command) {
      case 'start':
        throw new Error(
          `Команда /start обрабатывается uiApp — до стори ${this.dialogPath} она не доходит`,
        );
      case 'cancel': {
        if (!this.isActive(session)) return { reaction: 'pass' };
        this.reset();
        return {
          reaction: 'stop',
          response: { notify: { text: md`Отменено\\. Наберите /start` } },
        };
      }
      default:
        return { reaction: 'pass' };
    }
  }
}
