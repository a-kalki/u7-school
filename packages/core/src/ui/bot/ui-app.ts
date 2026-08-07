import type { ApiApp } from '#api/app/api-app';
import type { AppMeta } from '#domain/types';
import { getGlobalLogger } from '#shared/logger';
import type { BotController } from './controller/bot-controller';
import type { StoryPublicActions, UiCallbackFactory } from './public-actions';
import type {
  BotResponse,
  BotUpdate,
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
 * Центральный хаб UI-слоя бота. Владеет контроллерами, маршрутизацией
 * и реестром publicActions.
 *
 * Заменяет BotRouter — вся маршрутизация теперь здесь.
 *
 * @typeParam TAppMeta — тип метаданных приложения
 * @typeParam TActor — тип актора (пользователя)
 */
export class UiApp<TAppMeta extends AppMeta = AppMeta, TActor = unknown>
  implements MenuAggregator<TActor>
{
  private readonly controllers = new Map<
    string,
    BotController<TAppMeta, TActor>
  >();

  /** Реестр publicActions: actionName → factory */
  private readonly publicActionsMap = new Map<string, UiCallbackFactory>();

  constructor(controllers: BotController<TAppMeta, TActor>[]) {
    for (const c of controllers) {
      if (this.controllers.has(c.name)) {
        throw new Error(`Дубликат имени контроллера: ${c.name}`);
      }
      this.controllers.set(c.name, c);
    }
  }

  /**
   * Каскадная инициализация: ApiApp → контроллеры → стори → сбор publicActions.
   */
  init(apiApp: ApiApp<TAppMeta>): void {
    for (const controller of this.controllers.values()) {
      controller.init(apiApp, this);
    }
    this.#registerPublicActions();
  }

  // ── Реестр publicActions ──

  /**
   * Собирает publicActions со всех стори всех контроллеров в плоскую мапу.
   * Проверяет уникальность имён действий.
   */
  #registerPublicActions(): void {
    this.publicActionsMap.clear();
    for (const controller of this.controllers.values()) {
      // 1. Собираем publicActions со стори
      for (const story of controller.getStories()) {
        const actions = story.publicActions as Record<
          string,
          UiCallbackFactory
        >;
        for (const actionName of Object.keys(actions)) {
          if (this.publicActionsMap.has(actionName)) {
            throw new Error(
              `Дубликат имени publicAction: "${actionName}" (контроллер: ${controller.name}, стори: ${story.name})`,
            );
          }
          const factory = actions[actionName];
          if (factory) {
            this.publicActionsMap.set(actionName, factory);
          }
        }
      }
      // 2. Собираем publicActions с самого контроллера (для обратной совместимости)
      const ctrlActions = controller.publicActions;
      for (const storyName of Object.keys(ctrlActions)) {
        const storyActions = ctrlActions[storyName];
        if (!storyActions) continue;
        for (const actionName of Object.keys(storyActions)) {
          const fullName = `${storyName}.${actionName}` as string;
          if (this.publicActionsMap.has(fullName)) {
            throw new Error(
              `Дубликат имени publicAction: "${fullName}" (контроллер: ${controller.name})`,
            );
          }
          const factory2 = storyActions[actionName];
          if (factory2) {
            this.publicActionsMap.set(fullName, factory2);
          }
        }
      }
    }
  }

  /**
   * Типизированный доступ к фабрике публичного действия.
   *
   * Дженерик T задаёт контракт стори, name проверяется компилятором.
   *
   * @example
   *   const btn = uiApp.getAction<CatalogActions>('viewModule')(moduleId);
   */
  getAction<T extends StoryPublicActions>(
    name: keyof T,
  ): T[typeof name] | undefined {
    return this.publicActionsMap.get(name as string) as
      | T[typeof name]
      | undefined;
  }

  /** Количество зарегистрированных publicActions (для тестов) */
  get publicActionsSize(): number {
    return this.publicActionsMap.size;
  }

  // ── Контроллеры ──

  /** Возвращает контроллер по имени */
  getController(name: string): BotController<TAppMeta, TActor> | undefined {
    return this.controllers.get(name);
  }

  /** Количество зарегистрированных контроллеров */
  get size(): number {
    return this.controllers.size;
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
  async handleWelcome(actor: TActor): Promise<BotResponse> {
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
  async handleHelp(actor: TActor): Promise<BotResponse> {
    const appCtrl = this.controllers.get('app');
    if (appCtrl) {
      const response = await appCtrl.handleHelpMessage(actor);
      if (response) return response;
    }
    return { sendMessage: { text: 'Нет доступных пунктов меню.' } };
  }

  // ── Обработка callback ──

  /**
   * Обрабатывает callback, маршрутизируя по префиксу контроллера.
   */
  async handleCallback(
    data: string,
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse> {
    const controllerName = extractControllerName(data);

    if (!controllerName) {
      return { sendMessage: { text: '⚠️ Неизвестный формат команды' } };
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
      const delegateResponse = await controller.handleCallback(
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
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse | null> {
    const activeHandler = session.activeHandler;
    if (!activeHandler) return null;

    if (activeHandler.expiresAt && Date.now() > activeHandler.expiresAt) {
      return this.handleTimeout(actor, session);
    }

    const [ctrlName] = activeHandler.path.split('/');
    const controller = this.controllers.get(ctrlName ?? '');
    if (!controller) return null;

    const response = await controller.handleMessage(update, actor, session);
    this.#applyCapturedInput(session, ctrlName ?? '', response);
    return response;
  }

  // ── Обработка отмены ──

  async handleCancel(
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse | null> {
    const activeHandler = session.activeHandler;
    if (!activeHandler) return null;

    const [ctrlName] = activeHandler.path.split('/');
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
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse | null> {
    const activeHandler = session.activeHandler;
    if (!activeHandler) return null;

    const [ctrlName] = activeHandler.path.split('/');
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

  #toKeyboard(
    items: MainMenuAction[],
  ): import('./types').KeyboardDescription | null {
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
