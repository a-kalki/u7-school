import type { ApiApp } from '#api/app/api-app';
import type { AppMeta } from '#domain/types';
import { getGlobalLogger } from '#shared/logger';
import { UiApp } from '../ui-app';
import type { BotController } from './controller/bot-controller';
import type {
  BotResponse,
  BotUpdate,
  KeyboardDescription,
  MainMenuAction,
  MenuAggregator,
  SessionData,
} from './types';

/**
 * Извлекает имя контроллера из callback_data (первый сегмент до «:»).
 */
export function extractControllerName(data: string): string | null {
  const colonIdx = data.indexOf(':');
  if (colonIdx === -1) return null;
  return data.substring(0, colonIdx);
}

/**
 * Извлекает остаток данных после имени контроллера.
 */
export function extractRestData(data: string): string {
  const colonIdx = data.indexOf(':');
  if (colonIdx === -1) return data;
  return data.substring(colonIdx + 1);
}

/**
 * Центральный хаб UI-слоя бота. Владеет контроллерами и маршрутизацией.
 *
 * НЕ содержит сжатия ID и не знает про Grammy. Сжатие вынесено в BotTransport.
 *
 * @typeParam TAppMeta — тип метаданных приложения
 * @typeParam TActor — тип актора (пользователя)
 */
export class BotUiApp<TAppMeta extends AppMeta = AppMeta, TActor = unknown>
  extends UiApp<BotController<TAppMeta, TActor>>
  implements MenuAggregator<TActor>
{
  private actorResolver: ((tgId: number) => Promise<TActor>) | null = null;

  /**
   * Каскадная инициализация: ApiApp → контроллеры → стори.
   *
   * @param apiApp — приложение API
   * @param actorResolver — резолвер актора по telegramId
   */
  init(
    apiApp: ApiApp<TAppMeta>,
    actorResolver: (tgId: number) => Promise<TActor>,
  ): void {
    this.actorResolver = actorResolver;
    for (const controller of this.controllers.values()) {
      controller.init(apiApp, this);
    }
  }

  // ── Резолвинг актора ──

  /** Резолвит актора по telegramId. Бросает ошибку если резолвер не настроен. */
  private async resolveActor(tgId: number): Promise<TActor> {
    if (!this.actorResolver) {
      throw new Error('BotUiApp не инициализирован: actorResolver не задан');
    }
    return this.actorResolver(tgId);
  }

  // ── Сбор главного меню ──

  /**
   * Собирает MainMenuAction со всех контроллеров.
   * Сортирует по priority (меньше = выше).
   */
  async collectMainMenu(actor: TActor): Promise<MainMenuAction[]> {
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

  /**
   * Собирает описания меню от контроллеров для /help.
   */
  async collectHelp(actor: TActor): Promise<string[]> {
    const menu = await this.collectMainMenu(actor);
    return menu
      .filter(
        (i): i is MainMenuAction & { description: string } =>
          typeof i.description === 'string',
      )
      .map((i) => i.description);
  }

  // ── MenuAggregator ──

  async collectAllMenuItems(actor: TActor): Promise<MainMenuAction[]> {
    return this.collectMainMenu(actor);
  }

  async collectAllHelpDescriptions(actor: TActor): Promise<string[]> {
    return this.collectHelp(actor);
  }

  // ── Системные методы ──

  /**
   * Обрабатывает /start: получает приветствие от контроллера 'app'
   * или возвращает fallback.
   */
  async handleWelcome(tgId: number): Promise<BotResponse> {
    const actor = await this.resolveActor(tgId);
    const appCtrl = this.controllers.get('app');
    if (appCtrl) {
      const response = await appCtrl.handleWelcome(actor);
      if (response) return response;
    }
    const items = await this.collectMainMenu(actor);
    const keyboard = this.#toKeyboard(items);
    return {
      sendMessage: {
        text: 'Выберите действие:',
        keyboard: keyboard ?? undefined,
      },
    };
  }

  /**
   * Обрабатывает /help.
   */
  async handleHelp(tgId: number): Promise<BotResponse> {
    const actor = await this.resolveActor(tgId);
    const appCtrl = this.controllers.get('app');
    if (appCtrl) {
      const response = await appCtrl.handleHelpMessage(actor);
      if (response) return response;
    }
    return {
      sendMessage: { text: 'Нет доступных пунктов меню.' },
    };
  }

  // ── Обработка callback ──

  /**
   * Обрабатывает callback, маршрутизируя по префиксу контроллера.
   * Принимает tgId, резолвит актора внутри.
   */
  async handleCallback(
    data: string,
    tgId: number,
    session: SessionData,
  ): Promise<BotResponse> {
    const actor = await this.resolveActor(tgId);
    const controllerName = extractControllerName(data);

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

    const restData = extractRestData(data);

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

    const actor = await this.resolveActor(tgId);
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
    const actor = await this.resolveActor(tgId);
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
    const actor = await this.resolveActor(tgId);
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
   * Первый сегмент — всегда имя контроллера (стори префиксуют делегат в контроллере).
   */
  async #handleDelegate(
    path: string,
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse> {
    const controllerName = extractControllerName(path);
    if (!controllerName) {
      return { sendMessage: { text: '⚠️ Неизвестный формат команды' } };
    }

    const target = this.getController(controllerName);
    if (!target) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    const res = await target.handleCallback(
      extractRestData(path),
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
}
