import type { AppMeta } from '#domain/types';
import { UiApp } from '../ui-app';
import type { BotUiAppResolve } from './app-types';
import type { BotController } from './bot-controller';
import type { BotResponse, BotUpdate, SessionData } from './types';

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
> extends UiApp<TResolve> {
  protected declare readonly controllers: Map<
    string,
    BotController<TAppMeta, TActor, TResolve>
  >;

  // biome-ignore lint/complexity/noUselessConstructor: сужает тип контроллеров с UiController до BotController
  constructor(controllers: BotController<TAppMeta, TActor, TResolve>[]) {
    super(controllers);
  }

  /** Возвращает контроллер по имени */
  override getController(
    name: string,
  ): BotController<TAppMeta, TActor, TResolve> | undefined {
    return this.controllers.get(name);
  }

  // ── Обработка callback ──

  /**
   * Обрабатывает callback, маршрутизируя по префиксу контроллера.
   */
  async handleCallback(
    data: string,
    tgId: number,
    session: SessionData,
  ): Promise<BotResponse> {
    const actor = await this.resolve.actorResolver(tgId);
    const controllerName = this.#extractControllerName(data);

    if (!controllerName) {
      return {
        sendMessage: { text: '⚠️ Неизвестный формат команды' },
      };
    }

    const activeHandler = session.activeHandler;
    if (activeHandler) {
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
      return this.#mergeResponses(response, delegateResponse);
    }

    return response;
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
    return response;
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
