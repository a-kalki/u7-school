import type { BotController } from '../controller/bot-controller';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '../types';
import type { AppMeta } from '#domain/types';

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
 * Роутер бота.
 * Хранит контроллеры и маршрутизирует события к нужному контроллеру.
 * Не зависит от Grammy — работает с абстрактными типами.
 *
 * @typeParam TAppMeta — тип метаданных приложения
 * @typeParam TActor — тип актора (пользователя)
 */
export class BotRouter<
  TAppMeta extends AppMeta = AppMeta,
  TActor = unknown,
> {
  private readonly controllers = new Map<
    string,
    BotController<TAppMeta, TActor>
  >();

  constructor(controllers: BotController<TAppMeta, TActor>[]) {
    for (const c of controllers) {
      if (this.controllers.has(c.name)) {
        throw new Error(`Дубликат имени контроллера: ${c.name}`);
      }
      this.controllers.set(c.name, c);
    }
  }

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
      } catch {
        // Пропускаем ошибки отдельных контроллеров
      }
    }
    return items.sort((a, b) => a.priority - b.priority);
  }

  // ── Обработка callback ──

  /**
   * Обрабатывает callback, маршрутизируя по префиксу контроллера.
   * Управляет activeHandler (captureInput/releaseInput).
   * Выполняет делегирование (один уровень).
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

    // Проверка чужого callback при активном обработчике
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

    // Обновление activeHandler
    this.#applyCapturedInput(session, controllerName, response);

    // Делегирование (один уровень, без рекурсии)
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

  /**
   * Обрабатывает текстовое сообщение.
   * Возвращает null, если нет активного обработчика (сигнал вызвать next()).
   */
  async handleMessage(
    update: BotUpdate,
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse | null> {
    const activeHandler = session.activeHandler;
    if (!activeHandler) return null;

    // Проверка таймаута
    if (
      activeHandler.expiresAt &&
      Date.now() > activeHandler.expiresAt
    ) {
      return this.handleTimeout(actor, session);
    }

    const [ctrlName] = activeHandler.path.split('/');
    const controller = this.controllers.get(ctrlName!);
    if (!controller) return null;

    const response = await controller.handleMessage(update, actor, session);

    if (response.releaseInput) {
      session.activeHandler = null;
    }

    return response;
  }

  // ── Обработка отмены ──

  /**
   * Обрабатывает команду /cancel.
   * Возвращает null, если нет активного обработчика.
   */
  async handleCancel(
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse | null> {
    const activeHandler = session.activeHandler;
    if (!activeHandler) return null;

    const [ctrlName] = activeHandler.path.split('/');
    const controller = this.controllers.get(ctrlName!);
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

  /**
   * Обрабатывает таймаут активного обработчика.
   * Возвращает null, если нет активного обработчика.
   */
  async handleTimeout(
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse | null> {
    const activeHandler = session.activeHandler;
    if (!activeHandler) return null;

    const [ctrlName] = activeHandler.path.split('/');
    const controller = this.controllers.get(ctrlName!);
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

  /** Применяет captureInput/releaseInput к сессии */
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

  /** Объединяет основной ответ и ответ делегата */
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
