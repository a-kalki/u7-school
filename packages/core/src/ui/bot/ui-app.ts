import { type MdText, mdJoin, mdRaw } from '../../shared/markdown';
import { UiApp } from '../ui-app';
import type { BotUiAppResolve } from './app-types';
import type { BotController } from './bot-controller';
import type {
  BotSession,
  BotUpdate,
  CommandUpdate,
  DialogResponse,
  KeyboardDescription,
  NotificationPayload,
  ProactiveSender,
} from './types';

/**
 * Центральный хаб UI-слоя бота на контракте «Диалог и Экран».
 * Экран и Telegram-механика — транспорт; uiApp только решает КУДА.
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

  protected transport!: ProactiveSender;

  // biome-ignore lint/complexity/noUselessConstructor: сужает тип контроллеров с UiController до BotController
  constructor(controllers: BotController<TAppMeta, TActor, TResolve>[]) {
    super(controllers);
  }

  /**
   * Каскадная инициализация.
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

  // ── Pipe команд (ФР-4, решения 2026-09-06) ──

  /**
   * Обработка команды, делегирует сторис.
   *
   * Stop-ответ с `delegate` — исполняется ядром (симметрично handleCallback,
   * §10.19): команда с экраном открывает диалог целевой стори
   * (`enterDialog(switch)`, в т.ч. из закрытого диалога — seq = 1),
   * ответ склеивается с ответом делегата.
   */
  async handleCommand(
    update: CommandUpdate,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    const actor = await this.resolve.actorResolver(tgId);
    const notices: MdText[] = [];

    for (const controller of this.#commandPipeOrder(session)) {
      const reaction = await controller.handleCommand(update, actor, session);
      if (reaction.reaction === 'pass') continue;
      if (reaction.reaction === 'stop') {
        const response = await this.#resolveDelegate(
          reaction.response,
          actor,
          session,
        );
        return this.#attachNotices(response, notices);
      }
      if (reaction.notice !== undefined) notices.push(reaction.notice);
    }

    if (notices.length > 0) {
      return { notify: { text: mdJoin(notices, '\n\n') } };
    }
    return null;
  }

  /** Порядок опроса контроллеров: активный первым, далее регистрация. */
  #commandPipeOrder(
    session: BotSession,
  ): BotController<TAppMeta, TActor, TResolve>[] {
    const list = [...this.controllers.values()];
    const activeName = session.dialog?.path.split('/')[0];
    const active = activeName
      ? list.find((c) => c.name === activeName)
      : undefined;
    if (!active) return list;
    return [active, ...list.filter((c) => c !== active)];
  }

  /** Накопленные continue-нотисы — notify-репликой над ответом стопа. */
  #attachNotices(response: DialogResponse, notices: MdText[]): DialogResponse {
    if (notices.length === 0) return response;
    const merged = response.notify?.text;
    const text = merged
      ? mdJoin([...notices, merged], '\n\n')
      : mdJoin(notices, '\n\n');
    return { ...response, notify: { text } };
  }

  // ── Обработка callback ──

  /**
   * Обработка нажатия кнопки.
   */
  async handleCallback(
    data: string,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    const actor = await this.resolve.actorResolver(tgId);
    const initiator = await this.dispatch(data, actor, session);
    return this.#resolveDelegate(initiator, actor, session);
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

  /** Временный проактив с кнопками (ФР-6) — делегирует в transport */
  async invite(
    telegramId: number,
    payload: { text: MdText; keyboard: KeyboardDescription },
  ): Promise<void> {
    await this.transport.invite(telegramId, payload);
  }

  /** Проактивный кик из группы — делегирует в transport */
  async kickFromGroup(groupId: number | string, userId: number): Promise<void> {
    await this.transport.kickFromGroup(groupId, userId);
  }

  // ── Приватные хелперы ──

  /**
   * Операция входа в диалог — ЕДИНСТВЕННАЯ точка инкремента `seq` (ФР-2).
   * Вызывается прикладным uiApp (/start, /cancel) и маршрутизацией
   * кнопок (мосты, delegate).
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
  protected enterDialog(
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
   *
   * Protected: прикладной uiApp перехватывает системные коды приложения
   * (меню и др.) — единая точка и для кнопок, и для delegate (§10.19:
   * delegate исполняется симметрично handleCallback).
   */
  protected async dispatch(
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

    this.enterDialog(session, `${ctrlName}/${storyName}`, 'switch');

    const rest = data.slice(ctrlName.length + 1);
    return controller.handleCallback(rest, actor, session);
  }

  /**
   * Исполняет делегат ответа (если есть) и склеивает инициатора с делегатом
   * (единая точка для handleCallback и handleCommand).
   *
   * Склейка слотов: notify обоих — конкатенация '\n\n' (Иначе — чей есть);
   * screen/release — приоритет делегата, awaitInput — только делегат.
   * Без delegate — ответ как есть.
   */
  async #resolveDelegate(
    initiator: DialogResponse,
    actor: TActor,
    session: BotSession,
  ): Promise<DialogResponse> {
    const delegatePath = initiator.delegate?.path;
    if (delegatePath === undefined) {
      return initiator;
    }

    const target = await this.dispatch(delegatePath, actor, session);

    const notify =
      initiator.notify && target.notify
        ? {
            text: mdJoin([initiator.notify.text, target.notify.text], '\n\n'),
            kind: target.notify.kind ?? initiator.notify.kind,
          }
        : (initiator.notify ?? target.notify);

    return {
      notify,
      screen: target.screen ?? initiator.screen,
      awaitInput: target.awaitInput,
      release: target.release ?? initiator.release,
    };
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
}
