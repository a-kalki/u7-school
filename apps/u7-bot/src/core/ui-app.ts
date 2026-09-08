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
  type ProactiveSender,
  type Screen,
} from '@u7-scl/core/ui';
import { ensureRegisteredGuest } from '../ensure-registered';
import type { U7BotAppMeta, U7BotUiAppResolve } from './u7-bot-app-meta';
import type { U7BotController } from './u7-bot-controller';
import { U7BotUiStory } from './u7-bot-ui-story';
import type { MenuButton } from './u7-menu';

/**
 * Оркестратор UI приложения U7 Bot на контракте «Диалог и Экран».
 *
 * Диалоговая механика (seq, delegate, pipe контроллеров) — в ядре BotUiApp;
 * здесь U7-специфика: якорь меню `app/menu`, `/start` и `/help` напрямую
 * (гость → лог → reopen → welcome из menuButtons; help — контекстная
 * справка активной стори или общий справочник), дефолты команд после
 * пустого pipe (/cancel — короткое меню, прочее — подсказка), системные
 * кнопки `app:main-menu` / `app:help`.
 *
 * Зависимости (фасад пользователей, актор-бот для гост-регистрации) —
 * в `U7BotUiAppResolve`, приходят через init.
 */
export class U7BotUiApp extends BotUiApp<
  U7BotAppMeta,
  User,
  U7BotUiAppResolve
> {
  protected declare readonly controllers: Map<string, U7BotController>;

  /** Диалог меню после /start (сущностной стори нет — якорь для seq/штампов). */
  protected readonly menuPath = 'app/menu';

  /** Кнопка «В меню» легаси-экранов (routes.mainMenu). */
  static readonly MAIN_MENU_CODE = 'app:main-menu';
  /** Кнопка «❓ Помощь» главного меню. */
  static readonly HELP_CODE = 'app:help';

  // biome-ignore lint/complexity/noUselessConstructor: сужает тип контроллеров с BotController до U7BotController
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
   * глобальный сброс диалога на меню делает uiApp, ответ стори — как есть.
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
      // Глобальный сброс диалога — всегда (решение владельца: сброс
      // активной делает стори в pipe, меню — уровень приложения).
      this.enterDialog(session, this.menuPath, 'reopen');
      if (response) return response;
      return { screen: await this.#shortMenuScreen(tgId) };
    }
    if (response) return response;

    return {
      notify: { text: md`Неизвестная команда\. Наберите /help — справка\.` },
    };
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
    if (context) return { notify: { text: context } };
    return { notify: { text: await this.#commonHelpScreen(tgId) } };
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
    return { screen: await this.#welcomeScreen(actor) };
  }

  // ── Системные кнопки (экс-ветки AppController) ──

  /**
   * Перехват системных кодов приложения ДО маршрутизации: меню и общий
   * help собирает uiApp (владеет menuButtons), контроллеры не задействуются.
   */
  override async handleCallback(
    data: string,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    if (data === U7BotUiApp.MAIN_MENU_CODE) {
      this.enterDialog(session, this.menuPath, 'switch');
      return { screen: await this.#shortMenuScreen(tgId) };
    }
    if (data === U7BotUiApp.HELP_CODE) {
      return { notify: { text: await this.#commonHelpScreen(tgId) } };
    }
    return super.handleCallback(data, tgId, session);
  }

  // ── Сбор главного меню (menuButtons) ──

  /** Кнопки всех контроллеров, отсортированные по приоритету. */
  async #menuButtons(actor: User): Promise<MenuButton[]> {
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
  async #commonHelpScreen(tgId: number): Promise<MdText> {
    const actor = await this.resolve.actorResolver(tgId);
    const header = md`Как со мной работать? 🤔

В основном ты будешь нажимать на кнопки — это быстро и удобно\\. Иногда я попрошу написать что\\-то самому \\(например, ответ на вопрос анкеты\\)\\.

📌 После выбора кнопки я убираю клавиатуру и добавляю пометку «Вы выбрали: \\.\\.\\.» — чтобы экран оставался чистым\\.
📌 В некоторых сценариях \\(например, заполнение анкеты\\) работает команда /cancel — она вернёт тебя обратно к выбору\\.

Вот что я умею:`;

    const descriptions = (await this.#menuButtons(actor))
      .map((b) => b.description)
      .filter((d): d is string => typeof d === 'string');

    if (descriptions.length === 0) return header;
    // Описания — доменные данные: экранируются интерполяцией
    const parts = descriptions.map((d) => md`${d}`);
    return mdConcat(header, md`\n\n`, mdJoin(parts, '\n\n'));
  }

  /** Welcome-экран /start: приветствие + клавиатура из menuButtons. */
  async #welcomeScreen(actor: User): Promise<Screen> {
    const greeting = md`Привет, ${actor.name}! 👋

Я бот\\-помощник школы «u7 schools» 🎓
Я проведу тебя от знакомства до обучения на курсах\\.

Если ты здесь впервые — начни с кнопки «❓ Помощь», расскажу как всё устроено\\.
Если уже знаком — выбирай нужный раздел:`;

    const keyboard = this.#toKeyboard(await this.#menuButtons(actor));
    return { text: greeting, ...(keyboard ? { keyboard } : {}) };
  }

  /** Короткий экран меню (/cancel, «В меню»): текст + клавиатура. */
  async #shortMenuScreen(tgId: number): Promise<Screen> {
    const actor = await this.resolve.actorResolver(tgId);
    const keyboard = this.#toKeyboard(await this.#menuButtons(actor));
    return {
      text: md`Выберите действие:`,
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
    return { rows, isMultiple: false };
  }

  get #logger(): Logger | undefined {
    return getGlobalLogger();
  }
}
