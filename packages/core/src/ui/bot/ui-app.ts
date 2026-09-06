import { md, mdRaw } from '../../shared/markdown';
import { UiApp } from '../ui-app';
import type { BotUiAppResolve } from './app-types';
import type { BotController } from './bot-controller';
import type { BotUiStory } from './bot-ui-story';
import type {
  BotSession,
  BotUpdate,
  CommandUpdate,
  DialogResponse,
  NotificationPayload,
  ProactiveSender,
  Screen,
} from './types';

/**
 * Центральный хаб UI-слоя бота на контракте «Диалог и Экран».
 *
 * Ответственность:
 * - маршрутизация кнопок/ввода по префиксу контроллера (без блокировки
 *   «чужим диалогом» — штампы транспорта уже гарантировали актуальность
 *   кнопки, И2);
 * - владение `DialogState`: смена диалога (`seq++`, сброс `input`),
 *   `delegate`-переходы;
 * - системные команды через единый конвейер `handleCommand` (ФР-4):
 *   appCommand-хук приложения → активная стори → core-дефолты
 *   (/start — всегда меню; /help — три уровня; /cancel — доменная
 *   очистка + сброс + меню).
 *
 * Экран и Telegram-механика — транспорт (§5); uiApp только решает КУДА.
 *
 * @typeParam TAppMeta — тип метаданных приложения
 * @typeParam TActor — тип актора (пользователя)
 */
export abstract class BotUiApp<
    TAppMeta extends
      import('#domain/types').AppMeta = import('#domain/types').AppMeta,
    TActor = unknown,
    TResolve extends BotUiAppResolve<TAppMeta, TActor> = BotUiAppResolve<
      TAppMeta,
      TActor
    >,
  >
  extends UiApp<TResolve>
  implements ProactiveSender
{
  protected declare readonly controllers: Map<
    string,
    BotController<TAppMeta, TActor, TResolve>
  >;

  /** Транспорт — получается через init отдельным аргументом */
  protected transport!: ProactiveSender;

  /** Путь диалога главного меню: `controller/story` — якорь /start и /cancel. */
  protected abstract readonly menuPath: string;

  // biome-ignore lint/complexity/noUselessConstructor: сужает тип контроллеров с UiController до BotController
  constructor(controllers: BotController<TAppMeta, TActor, TResolve>[]) {
    super(controllers);
  }

  /**
   * Каскадная инициализация: сохраняет transport и передаёт себя контроллерам
   * отдельным аргументом (как ProactiveSender).
   */
  override init(resolve: TResolve, transport?: ProactiveSender): void {
    this.resolve = resolve;
    for (const controller of this.controllers.values()) {
      controller.init(resolve, this);
    }

    if (transport) {
      this.transport = transport;
    }
  }

  /** Возвращает контроллер по имени */
  override getController(
    name: string,
  ): BotController<TAppMeta, TActor, TResolve> | undefined {
    return this.controllers.get(name);
  }

  // ── Системные команды: конвейер handleCommand (ФР-4) ──

  /**
   * Единый вход команд: appCommand-хук → активная стори → core-дефолты.
   *
   * Общая логика ядра: команды ДОХОДЯТ до активного стори (`handleCommand`,
   * null = «не моё»); построение конкретных экранов меню — приложение
   * (хуки `buildMenuScreen`/`buildCancelMenuScreen`/`buildHelpScreen`).
   *
   * - `/start` — системное правило «с любого места — меню»: стори НЕ
   *   опрашивается, reopen(menu) + welcome-экран;
   * - `/help` — три уровня: ответ стори (нормализуется в info-реплику)
   *   → main-help приложения (перехват в хуке, напр. «на меню») → общий
   *   fallback; диалог и экран не трогает;
   * - `/cancel` — доменная очистка активного стори (вызывается ВСЕГДА,
   *   не только при ожидании ввода), затем безусловный сброс уровня
   *   приложения (диалог reopen, input сброс) и короткое меню; доменный
   *   текст стори — info-реплика НАД меню (решение владельца, трек 1.1);
   * - прочие команды — доменные: ответ стори как есть.
   */
  async handleCommand(
    update: CommandUpdate,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    // 1. appCommand-хук: системные/админ-команды приложения.
    //    null = «пропускаю» — конвейер продолжается.
    const appResponse = await this.handleAppCommand(update, tgId, session);
    if (appResponse !== null) {
      return appResponse;
    }

    // /start — до стори: системное правило, экран меню строит приложение.
    if (update.command === 'start') {
      const actor = await this.resolve.actorResolver(tgId);
      this.#enterDialog(session, this.menuPath, 'reopen');
      return { screen: await this.buildMenuScreen(actor, session) };
    }

    const actor = await this.resolve.actorResolver(tgId);

    // 2. Активная стори: null = «не моё» → core-дефолты.
    const story = this.#storyByPath(session.dialog?.path);
    const storyResponse = story
      ? await story.handleCommand(update, actor, session)
      : null;

    // 3. Core-дефолты.
    switch (update.command) {
      case 'help': {
        // Справка — только info-реплика: экран диалога не трогаем (§5.3).
        const notice = this.#commandNotice(storyResponse);
        if (notice) {
          return { info: notice };
        }
        return { info: await this.buildHelpScreen(actor) };
      }
      case 'cancel': {
        // Доменный текст стори (info или текст screen) — реплика НАД меню;
        // awaitInput/delegate системной командой не поддерживаются.
        const notice = this.#commandNotice(storyResponse);
        this.#enterDialog(session, this.menuPath, 'reopen');
        const screen = await this.buildCancelMenuScreen(actor, session);
        return notice ? { info: notice, screen } : { screen };
      }
      default:
        // Доменная команда: ответ стори — полноправный (screen допустим).
        if (storyResponse) {
          return storyResponse;
        }
        // Неизвестная команда — info-подсказка, диалог не трогаем.
        return {
          info: { text: md`Неизвестная команда\. Наберите /help — справка\.` },
        };
    }
  }

  /**
   * appCommand-хук — точка перехвата команд приложением (уровень u7:
   * гейт /log_level, main-help «на меню», гост-регистрация на /start).
   * Дефолт — всегда «пропускаю»; непустой ответ завершает конвейер
   * без опроса стори и core-дефолтов.
   */
  protected async handleAppCommand(
    _update: CommandUpdate,
    _tgId: number,
    _session: BotSession,
  ): Promise<DialogResponse | null> {
    return null;
  }

  // ── Обработка callback ──

  /**
   * Нажатие кнопки (штамп и shortId уже сверены транспортом).
   *
   * Кнопка в другую стори (мост) — смена диалога: `seq++`, input сброс;
   * своей — продолжение без смены seq. `delegate` исполняется здесь,
   * до транспорта: info/screen инициатора уходят до экрана делегата,
   * слоты делегата (screen/awaitInput) приоритетны.
   */
  async handleCallback(
    data: string,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    const actor = await this.resolve.actorResolver(tgId);

    const initiator = await this.#dispatch(data, actor, session);

    const delegatePath = initiator.delegate?.path;
    if (delegatePath === undefined) {
      return initiator;
    }

    const target = await this.#dispatch(delegatePath, actor, session);

    return {
      info: initiator.info ?? target.info,
      screen: target.screen ?? initiator.screen,
      awaitInput: target.awaitInput,
      release: target.release ?? initiator.release,
    };
  }

  // ── Обработка сообщений ──

  /** Текстовый ввод при ожидающем диалоге (path — активный dialog.path). */
  async handleMessage(
    update: BotUpdate,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    const actor = await this.resolve.actorResolver(tgId);
    const controller = this.#controllerByPath(session.dialog?.path);
    if (!controller) return null;
    return controller.handleMessage(update, actor, session);
  }

  // ── ProactiveSender ──

  /** Проактивное уведомление — делегирует в transport */
  async notify(
    telegramId: number,
    payload: NotificationPayload,
  ): Promise<void> {
    await this.transport.notify(telegramId, payload);
  }

  /** Проактивный кик из группы — делегирует в transport */
  async kickFromGroup(groupId: number | string, userId: number): Promise<void> {
    await this.transport.kickFromGroup(groupId, userId);
  }

  // ── Хуки приложения ──

  /**
   * Экран диалога меню (welcome / агрегированное меню).
   * Переопределяется приложением; core-дефолт — нейтральная заглушка.
   */
  protected async buildMenuScreen(
    _actor: TActor,
    _session: BotSession,
  ): Promise<Screen> {
    return { text: mdRaw('Выберите действие:') };
  }

  /**
   * Экран меню для /cancel — по решению владельца КОРОТКИЙ (без welcome).
   * Дефолт — тот же экран, что и у /start; переопределяется приложением.
   */
  protected async buildCancelMenuScreen(
    actor: TActor,
    session: BotSession,
  ): Promise<Screen> {
    return this.buildMenuScreen(actor, session);
  }

  /** Общий help-fallback, когда стори не дала контекстной справки. */
  protected async buildHelpScreen(_actor: TActor): Promise<Screen> {
    return { text: mdRaw('Справка недоступна\\.') };
  }

  // ── Приватные хелперы ──

  /**
   * Операция входа в диалог — ЕДИНСТВЕННАЯ точка инкремента `seq` (ФР-2).
   *
   * - `switch` (мосты, delegate): другой path → `seq+1` и input сброс;
   *   тот же path → продолжение без изменений (input живёт до
   *   awaitInput/release ответа — их применит транспорт при рендере);
   * - `reopen` (/start, /cancel): всегда `seq+1`, в т.ч. «меню → меню», —
   *   повторный вход делает штампы прежнего экрана мёртвыми.
   *
   * Экран прежнего диалога становится «чужим» — транспорт отправит send
   * (retire прежнего, §5.2).
   */
  #enterDialog(
    session: BotSession,
    path: string,
    mode: 'switch' | 'reopen',
  ): void {
    const current = session.dialog;
    if (mode === 'switch' && current?.path === path) return;
    session.dialog = { path, seq: (current?.seq ?? 0) + 1 };
  }

  /**
   * Маршрутизация `controller:story:action...`: смена диалога при
   * `controller/story` ≠ текущему, затем контроллер.
   */
  async #dispatch(
    data: string,
    actor: TActor,
    session: BotSession,
  ): Promise<DialogResponse> {
    const [ctrlName, storyName] = data.split(':');
    if (!ctrlName || !storyName) {
      return { screen: { text: mdRaw('⚠️ Неизвестный формат команды') } };
    }

    const controller = this.controllers.get(ctrlName);
    if (!controller) {
      return { screen: { text: mdRaw('⚠️ Неизвестная команда') } };
    }

    this.#enterDialog(session, `${ctrlName}/${storyName}`, 'switch');

    const rest = data.slice(ctrlName.length + 1);
    return controller.handleCallback(rest, actor, session);
  }

  /** Контроллер активного диалога по `controller/story`. */
  #controllerByPath(
    path: string | undefined,
  ): BotController<TAppMeta, TActor, TResolve> | undefined {
    if (!path) return undefined;
    const [ctrlName] = path.split('/');
    if (!ctrlName) return undefined;
    return this.controllers.get(ctrlName);
  }

  /** Стори активного диалога по `controller/story` (для контекстного /help). */
  #storyByPath(
    path: string | undefined,
  ): BotUiStory<TAppMeta, TActor> | undefined {
    if (!path) return undefined;
    const controller = this.#controllerByPath(path);
    const storyName = path.split('/')[1];
    if (!controller || !storyName) return undefined;
    return controller.getStories().find((story) => story.name === storyName);
  }

  /**
   * Реплика доменного ответа стори на системную команду (/help, /cancel):
   * info — как есть, иначе текст screen (доменный текст не теряем);
   * экран диалога системная команда не занимает. undefined — реплики нет.
   */
  #commandNotice(response: DialogResponse | null): Screen | undefined {
    if (!response) return undefined;
    if (response.info) return response.info;
    if (response.screen) return { text: response.screen.text };
    return undefined;
  }
}
