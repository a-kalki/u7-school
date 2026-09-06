import { mdRaw } from '../../shared/markdown';
import { UiApp } from '../ui-app';
import type { BotUiAppResolve } from './app-types';
import type { BotController } from './bot-controller';
import type { BotUiStory } from './bot-ui-story';
import type {
  BotSession,
  BotUpdate,
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
 * - системные команды: /start (диалог меню + welcome), /help (контекстная
 *   справка стори → общий fallback, как info-реплика), /cancel (доменная
 *   очистка стори → дефолт-возврат в меню).
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

  // ── Системные команды ──

  /**
   * /start: явный сброс — диалог закрывается (seq++), открывается диалог
   * меню, welcome-экран (транспорт отправит send'ом — экран не наш).
   */
  async handleWelcome(
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse> {
    const actor = await this.resolve.actorResolver(tgId);
    this.#switchDialog(session, this.menuPath);
    return { screen: await this.buildMenuScreen(actor, session) };
  }

  /**
   * /help: не трогает диалог и экран (§5.3) — результат уходит info-репликой.
   * Активная стори может дать контекстную справку (`handleHelp`),
   * иначе — общий fallback.
   */
  async handleHelp(tgId: number, session: BotSession): Promise<DialogResponse> {
    const actor = await this.resolve.actorResolver(tgId);
    const story = this.#storyByPath(session.dialog?.path);
    const contextHelp = story ? await story.handleHelp(actor, session) : null;
    if (contextHelp) {
      return { info: contextHelp };
    }
    return { info: await this.buildHelpScreen(actor) };
  }

  /**
   * /cancel: доменная очистка активной стори (если ждём ввод), дефолт —
   * возврат в меню (диалог меню, seq++).
   */
  async handleCancel(
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    const actor = await this.resolve.actorResolver(tgId);

    let response: DialogResponse | null = null;
    if (session.dialog?.input) {
      const controller = this.#controllerByPath(session.dialog.path);
      response = controller
        ? await controller.handleCancel(actor, session)
        : null;
    }

    if (!response || this.#isEmpty(response)) {
      this.#switchDialog(session, this.menuPath);
      return { screen: await this.buildCancelMenuScreen(actor, session) };
    }
    return response;
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
   * Смена диалога: `seq++`, input сброс (ФР-1: закрытый диалог — тоже вход).
   * Экран прежнего диалога становится «чужим» — транспорт отправит send
   * (retire прежнего, §5.2). Тот же path — no-op: input живёт до
   * awaitInput/release ответа (транспорт применит их при рендере).
   */
  #switchDialog(session: BotSession, path: string): void {
    const current = session.dialog;
    if (current?.path === path) return;
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

    this.#switchDialog(session, `${ctrlName}/${storyName}`);

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

  /** Ответ без визуальных/маршрутных слотов (только release/awaitInput). */
  #isEmpty(response: DialogResponse): boolean {
    return (
      !response.screen &&
      !response.info &&
      !response.finalize &&
      !response.delegate
    );
  }
}
