import type { AppMeta } from '#domain/types';
import { UiApp } from '../ui-app';
import type { BotUiAppResolve } from './app-types';
import type { BotController } from './bot-controller';
import type {
  BotCommand,
  BotResponse,
  BotUpdate,
  KeyboardDescription,
  NotificationPayload,
  ProactiveSender,
  SessionData,
} from './types';

/**
 * Маркер-префикс callback_data takeover-кнопок (явный перехват ввода).
 *
 * Кодирование/снятие — уровень uiApp: при отправке кнопки с
 * `takeover: true` получают префикс, при приёме маркер снимается первым
 * делом и включает обход блокировки чужим activeHandler. Транспорт,
 * контроллеры и стори работают с «нативным» кодом и маркера не знают
 * (для предупреждающей строки транспорт читает структурное поле `takeover`).
 */
export const TAKEOVER_MARKER = '!';

/**
 * Центральный хаб UI-слоя бота.
 *
 * @typeParam TAppMeta — тип метаданных приложения
 * @typeParam TActor — тип актора (пользователя)
 */
export class BotUiApp<
    TAppMeta extends AppMeta = AppMeta,
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

  // ── ProactiveSender ──

  /** Проактивная отправка — кодирует takeover-маркеры и делегирует в transport */
  async send(telegramId: number, command: BotCommand): Promise<void> {
    await this.transport.send(telegramId, this.#encodeTakeover(command));
  }

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

  // ── Обработка callback ──

  /**
   * Обрабатывает callback, маршрутизируя по префиксу контроллера.
   *
   * Takeover-кнопки (маркер в callback_data) обрабатываются даже при
   * активном ЧУЖОМ activeHandler — захват ввода перезаписывается новой
   * стори (спец FR-5).
   */
  async handleCallback(
    data: string,
    tgId: number,
    session: SessionData,
  ): Promise<BotResponse> {
    // Takeover-маркер снимается первым делом — дальше только нативный код
    const takeover = data.startsWith(TAKEOVER_MARKER);
    if (takeover) {
      data = data.slice(TAKEOVER_MARKER.length);
    }

    const actor = await this.resolve.actorResolver(tgId);
    const controllerName = this.#extractControllerName(data);

    if (!controllerName) {
      return {
        sendMessage: { text: '⚠️ Неизвестный формат команды' },
      };
    }

    const activeHandler = session.activeHandler;
    if (activeHandler && !takeover) {
      const [activeCtrl] = activeHandler.path.split('/');
      if (activeCtrl !== controllerName) {
        return {
          sendMessage: {
            text: '⚠️ Сначала завершите текущее действие (/cancel)',
          },
        };
      }
    }

    const controller = this.controllers.get(controllerName);
    if (!controller) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    const restData = this.#extractRestData(data);

    const response = await controller.handleCallback(restData, actor, session);

    this.#applyCapturedInput(session, controllerName, response);

    if (response.delegate) {
      const delegateResponse = await this.#handleDelegate(
        response.delegate.path,
        actor,
        session,
      );
      return this.#encodeTakeover(
        this.#mergeResponses(response, delegateResponse),
      );
    }

    return this.#encodeTakeover(response);
  }

  // ── Обработка сообщений ──

  async handleMessage(
    update: BotUpdate,
    tgId: number,
    session: SessionData,
  ): Promise<BotResponse | null> {
    const activeHandler = session.activeHandler;
    if (!activeHandler) return null;

    if (activeHandler.expiresAt && Date.now() > activeHandler.expiresAt) {
      return (
        (await this.handleTimeout(tgId, session)) ?? {
          releaseInput: true,
        }
      );
    }

    const actor = await this.resolve.actorResolver(tgId);
    const [ctrlName] = activeHandler.path.split('/');
    const controller = this.controllers.get(ctrlName ?? '');
    if (!controller) return null;

    const response = await controller.handleMessage(update, actor, session);
    this.#applyCapturedInput(session, ctrlName ?? '', response);
    return this.#encodeTakeover(response);
  }

  // ── Обработка отмены ──

  async handleCancel(
    tgId: number,
    session: SessionData,
  ): Promise<BotResponse | null> {
    const activeHandler = session.activeHandler;
    if (!activeHandler) return null;

    const [ctrlName] = activeHandler.path.split('/');
    const actor = await this.resolve.actorResolver(tgId);
    const controller = this.controllers.get(ctrlName ?? '');
    if (!controller) {
      session.activeHandler = null;
      return { releaseInput: true };
    }

    const response = await controller.handleCancel(actor, session);

    if (response.releaseInput) {
      session.activeHandler = null;
    }

    return response;
  }

  // ── Обработка таймаута ──

  async handleTimeout(
    tgId: number,
    session: SessionData,
  ): Promise<BotResponse | null> {
    const activeHandler = session.activeHandler;
    if (!activeHandler) return null;

    const [ctrlName] = activeHandler.path.split('/');
    const actor = await this.resolve.actorResolver(tgId);
    const controller = this.controllers.get(ctrlName ?? '');
    if (!controller) {
      session.activeHandler = null;
      return { releaseInput: true };
    }

    const response = await controller.handleTimeout(actor, session);

    if (response.releaseInput) {
      session.activeHandler = null;
    }

    return response;
  }

  // ── Приватные хелперы ──

  /**
   * Кодирует takeover-кнопки: маркер-префикс в `code` при отправке.
   * Структурное поле `takeover: true` сохраняется — транспорт рендерит
   * по нему предупреждающую строку (структурное поле, не маркер).
   */
  #encodeTakeover(command: BotCommand): BotCommand {
    const encode = (kb: KeyboardDescription): KeyboardDescription => ({
      ...kb,
      rows: kb.rows.map((row) =>
        row.map((btn) =>
          btn.takeover === true && !btn.code.startsWith(TAKEOVER_MARKER)
            ? { ...btn, code: TAKEOVER_MARKER + btn.code }
            : btn,
        ),
      ),
    });

    const result: BotCommand = { ...command };
    if (result.sendMessage?.keyboard) {
      result.sendMessage = {
        ...result.sendMessage,
        keyboard: encode(result.sendMessage.keyboard),
      };
    }
    if (result.sendMessages) {
      result.sendMessages = result.sendMessages.map((sm) =>
        sm.keyboard ? { ...sm, keyboard: encode(sm.keyboard) } : sm,
      );
    }
    if (result.editMessage?.keyboard) {
      result.editMessage = {
        ...result.editMessage,
        keyboard: encode(result.editMessage.keyboard),
      };
    }
    return result;
  }

  #applyCapturedInput(
    session: SessionData,
    controllerName: string,
    response: BotResponse,
  ): void {
    if (response.captureInput) {
      session.activeHandler = {
        path: `${controllerName}/${response.captureInput.path}`,
        context: response.captureInput.context,
        expiresAt: response.captureInput.ttlSeconds
          ? Date.now() + response.captureInput.ttlSeconds * 1000
          : undefined,
      };
    }
    if (response.releaseInput) {
      session.activeHandler = null;
    }
  }

  /**
   * Маршрутизирует delegate.path — полный маршрут `controller:story:action:...`.
   * Первый сегмент — всегда имя контроллера.
   */
  async #handleDelegate(
    path: string,
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse> {
    const controllerName = this.#extractControllerName(path);
    if (!controllerName) {
      return { sendMessage: { text: '⚠️ Неизвестный формат команды' } };
    }

    const target = this.getController(controllerName);
    if (!target) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    const res = await target.handleCallback(
      this.#extractRestData(path),
      actor,
      session,
    );
    this.#applyCapturedInput(session, controllerName, res);
    return res;
  }

  #mergeResponses(main: BotResponse, delegate: BotResponse): BotResponse {
    const result: BotResponse = { ...delegate };
    if (main.sendMessage) {
      result.sendMessage = main.sendMessage;
      if (delegate.sendMessage && delegate.sendMessage !== main.sendMessage) {
        result.sendMessages = [
          main.sendMessage,
          ...(delegate.sendMessages ?? [delegate.sendMessage]),
        ];
        result.sendMessage = undefined;
      }
    }
    if (main.editMessage) {
      result.editMessage = main.editMessage;
    }
    return result;
  }

  /**
   * Извлекает имя контроллера из callback_data (первый сегмент до «:»).
   */
  #extractControllerName(data: string): string | null {
    const colonIdx = data.indexOf(':');
    if (colonIdx === -1) return null;
    return data.substring(0, colonIdx);
  }

  /**
   * Извлекает остаток данных после имени контроллера.
   */
  #extractRestData(data: string): string {
    const colonIdx = data.indexOf(':');
    if (colonIdx === -1) return data;
    return data.substring(colonIdx + 1);
  }
}
