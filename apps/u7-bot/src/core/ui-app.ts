import type { User } from '@u7-scl/app/domain';
import {
  getGlobalLogger,
  type Logger,
  type MdText,
  md,
  mdConcat,
  mdJoin,
} from '@u7-scl/core/shared';
import {
  type BotSession,
  BotUiApp,
  type CommandUpdate,
  type DialogResponse,
  type KeyboardDescription,
  kb,
  notify,
  type ProactiveSender,
  type Screen,
  screen,
} from '@u7-scl/core/ui';
import { ensureRegisteredGuest } from '../ensure-registered';
import { APP_CODES, APP_DIALOG_PATHS } from '../shared/app-codes';
import type { U7BotAppMeta, U7BotUiAppResolve } from './u7-bot-app-meta';
import type { U7BotController } from './u7-bot-controller';
import { U7BotUiStory } from './u7-bot-ui-story';
import type { MenuButton } from './u7-menu';

/**
 * Оркестратор UI приложения U7 Bot на контракте «Диалог и Экран».
 *
 * Диалоговая механика (seq, delegate, pipe контроллеров) — в ядре BotUiApp;
 * здесь U7-специфика: якорь меню (APP_DIALOG_PATHS.menu), `/start` и
 * `/help` напрямую (гость → лог → reopen → welcome из menuButtons; help —
 * контекстная справка активной стори или общий справочник), дефолты команд
 * после пустого pipe (/cancel — короткое меню, прочее — подсказка), системные
 * кнопки из `APP_CODES` (mainMenu / help).
 *
 * Зависимости (фасад пользователей, актор-бот для гост-регистрации) —
 * в `U7BotUiAppResolve`, приходят через init.
 */
export class U7BotUiApp extends BotUiApp<
  U7BotAppMeta,
  User,
  U7BotUiAppResolve
> {
  declare protected readonly controllers: Map<string, U7BotController>;

  /** Диалог меню после /start (сущностной стори нет — якорь для seq/штампов). */
  protected readonly menuPath = APP_DIALOG_PATHS.menu;

  constructor(controllers: U7BotController[]) {
    super(controllers);
  }

  /**
   * Инициализация зависимостями UI-слоя U7-бота.
   * transport передаётся отдельным аргументом (ProactiveSender).
   */
  override init(resolve: U7BotUiAppResolve, transport?: ProactiveSender): void {
    super.init(resolve, transport);
  }

  // ── Команды: /start напрямую, прочее — pipe + дефолты u7 (ФР-4) ──

  /**
   * `/start` — НЕ через pipe: идемпотентная гост-регистрация → лог
   * топ-меню → reopen(menu) → welcome-экран из menuButtons.
   * `/help` — тоже напрямую, мимо pipe: активная стори одна получает
   * право ответить (контекстная справка), общий справочник — во всех
   * остальных случаях (меню, закрытый диалог, активная без справки).
   * Прочие команды — pipe контроллеров (`super`); пустой pipe →
   * дефолты u7: `/cancel` — reopen(menu) + короткое меню, прочее —
   * подсказка о неизвестной команде.
   * При `/cancel` с ответом pipe (активная стори отменила себя) —
   * глобальный сброс диалога на меню делает uiApp; ответ без `screen`
   * дополняется экраном меню — прежняя клавиатура умерла вместе с
   * seq++, пользователь не остаётся с мёртвыми кнопками.
   */
  override async handleCommand(
    update: CommandUpdate,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    if (update.command === 'start') {
      return this.#commandStart(update, tgId, session);
    }
    if (update.command === 'help') {
      return this.#commandHelp(tgId, session);
    }

    const response = await super.handleCommand(update, tgId, session);
    if (update.command === 'cancel') {
      // Глобальный сброс диалога — всегда: сброс активной делает
      // стори в pipe, меню — уровень приложения.
      this.enterDialog(session, this.menuPath, 'reopen');
      if (!response) {
        const actor = await this.resolve.actorResolver(tgId);
        const menu = await this.#shortMenuScreen(actor);
        return screen(menu.text, menu.keyboard);
      }
      // Ответ стори без экрана — дополняем экраном меню (notify сохраняется:
      // транспорт рендерит реплику первой, затем retire+send меню — уже умеет).
      if (!response.screen) {
        const actor = await this.resolve.actorResolver(tgId);
        return { ...response, screen: await this.#shortMenuScreen(actor) };
      }
      return response;
    }
    if (response) return response;

    return notify(md`Неизвестная команда\. Наберите /help — справка\.`);
  }

  /**
   * `/help`: активная стори — только её контекстная справка (public
   * `contextHelp()` — мост uiApp → стори); во всех остальных случаях —
   * общий справочник. Инвариант ревью 2.2: неактивная стори на /help
   * не отвечает никогда — проверка активности принадлежит uiApp, не стори.
   */
  async #commandHelp(
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse> {
    const actor = await this.resolve.actorResolver(tgId);
    const story = this.#activeStory(session);
    const context = story ? await story.contextHelp(actor, session) : null;
    if (context) return notify(context);
    return notify(await this.#commonHelpScreen(actor));
  }

  /** Активная стори по `dialog.path` (виртуальные пути `app/*` — не стори). */
  #activeStory(session: BotSession): U7BotUiStory | undefined {
    const path = session.dialog?.path;
    if (!path) return undefined;
    const [ctrlName, storyName] = path.split('/');
    if (!ctrlName || !storyName) return undefined;
    const controller = this.getController(ctrlName);
    if (!controller) return undefined;
    return controller
      .getStories()
      .find(
        (s): s is U7BotUiStory =>
          s instanceof U7BotUiStory && s.name === storyName,
      );
  }

  /** /start: гост-регистрация (до резолва актора) + лог + welcome-меню. */
  async #commandStart(
    update: CommandUpdate,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse> {
    this.#logger?.info(
      'top-menu',
      `Команда /start от пользователя ${tgId} (${update.name || '?'})`,
    );
    await ensureRegisteredGuest(
      this.resolve.userFacade,
      this.resolve.botAdminUuid,
      {
        id: tgId,
        first_name: update.name ?? 'друг',
        ...(update.username !== undefined ? { username: update.username } : {}),
      },
    );

    const actor = await this.resolve.actorResolver(tgId);
    this.enterDialog(session, this.menuPath, 'reopen');
    const welcome = await this.#welcomeScreen(actor);
    return screen(welcome.text, welcome.keyboard);
  }

  // ── Системные кнопки (экс-ветки AppController) ──

  /**
   * Перехват системных кодов приложения в маршрутизации — ЕДИНАЯ точка
   * и для нажатий кнопок, и для delegate (§10.19): оба входа маршрутизации
   * сходятся в dispatch, поэтому перехват здесь покрывает оба. Актор уже
   * разрешён ядром — двойного резолва нет.
   * - меню — виртуальный якорь `app/menu` (сущностной стори нет),
   *   короткое меню собирает uiApp;
   * - help — общий справочник из menuButtons (контекстная справка активной
   *   стори — уровень команды /help в #commandHelp, не кнопки).
   */
  protected override async dispatch(
    data: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    if (data === APP_CODES.mainMenu) {
      this.enterDialog(session, this.menuPath, 'switch');
      const menu = await this.#shortMenuScreen(actor);
      return screen(menu.text, menu.keyboard);
    }
    if (data === APP_CODES.help) {
      return notify(await this.#commonHelpScreen(actor));
    }
    return super.dispatch(data, actor, session);
  }

  // ── Сбор главного меню (menuButtons) ──

  /**
   * Кнопки всех контроллеров, отсортированные по приоритету.
   * protected (не private): тестовый стенд открывает сбор меню подклассом —
   * прод-API не расширяет.
   */
  protected async collectMenuButtons(actor: User): Promise<MenuButton[]> {
    const items: MenuButton[] = [];
    for (const controller of this.controllers.values()) {
      try {
        items.push(...controller.menuButtons(actor));
      } catch (err) {
        this.#logger?.warn('ui-app', 'Ошибка контроллера в сборе menuButtons', {
          error: String(err),
          controller: controller.name,
        });
      }
    }
    return items.sort((a, b) => a.priority - b.priority);
  }

  /** Общий справочник: инструкция + описания кнопок из menuButtons. */
  async #commonHelpScreen(actor: User): Promise<MdText> {
    const header = md`Как со мной работать? 🤔

В основном ты будешь нажимать на кнопки — это быстро и удобно\\. Иногда я попрошу написать что\\-то самому \\(например, ответ на вопрос анкеты\\)\\.

📌 После выбора кнопки я убираю клавиатуру и добавляю пометку «Вы выбрали: \\.\\.\\.» — чтобы экран оставался чистым\\.
📌 В некоторых сценариях \\(например, заполнение анкеты\\) работает команда /cancel — она вернёт тебя обратно к выбору\\.

Вот что я умею:`;

    const descriptions = (await this.collectMenuButtons(actor))
      .map((b) => b.description)
      .filter((d): d is string => typeof d === 'string');

    if (descriptions.length === 0) return header;
    // Описания — доменные данные: экранируются интерполяцией
    const parts = descriptions.map((d) => md`${d}`);
    return mdConcat(header, md`\n\n`, mdJoin(parts, '\n\n'));
  }

  /** Welcome-экран /start: приветствие + клавиатура из menuButtons. */
  async #welcomeScreen(actor: User): Promise<Screen> {
    const greeting = md`Привет, ${actor.name}\\! 👋

Я бот\\-помощник школы «u7 schools» 🎓
Я проведу тебя от знакомства до обучения на курсах\\.

Если ты здесь впервые — начни с кнопки «❓ Помощь», расскажу как всё устроено\\.
Если уже знаком — выбирай нужный раздел:`;

    const keyboard = this.#toKeyboard(await this.collectMenuButtons(actor));
    return { text: greeting, ...(keyboard ? { keyboard } : {}) };
  }

  /** Короткий экран меню (/cancel, «В меню», delegate): текст + клавиатура. */
  async #shortMenuScreen(actor: User): Promise<Screen> {
    const keyboard = this.#toKeyboard(await this.collectMenuButtons(actor));
    return {
      text: md`🏫 *Главное меню*\n\nВыберите раздел:`,
      ...(keyboard ? { keyboard } : {}),
    };
  }

  // ── Приватные хелперы ──

  #toKeyboard(items: MenuButton[]): KeyboardDescription | null {
    const rows = items
      .filter((i) => i.kind === 'callback' || i.kind === 'url')
      .map((i) => [
        i.kind === 'url'
          ? { text: i.text, code: '', url: i.url }
          : { text: i.text, code: i.action },
      ]);
    if (rows.length === 0) return null;
    return kb(rows);
  }

  get #logger(): Logger | undefined {
    return getGlobalLogger();
  }
}
