import type { ApiApp } from '#api/app/api-app';
import type { AppMeta } from '#domain/types';
import { getGlobalLogger } from '#shared/logger';
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

/** UUID v4 (8-4-4-4-12 hex). Сжимаем только UUID, остальное пропускаем. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Сжатый ключ shortIds: ровно 8 hex-символов, без дефисов. */
const SHRUNK_RE = /^[0-9a-f]{8}$/i;

/**
 * Центральный хаб UI-слоя бота. Владеет контроллерами, маршрутизацией
 * и сжатием ID через общую мапу shortIds.
 *
 * Контроллеры работают только с реальными ID. UiApp сжимает при отправке
 * и разжимает при входе.
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

  /** Единая мапа сжатых id на всё приложение */
  private readonly shortIds = new Map<string, string>();

  constructor(controllers: BotController<TAppMeta, TActor>[]) {
    for (const c of controllers) {
      if (this.controllers.has(c.name)) {
        throw new Error(`Дубликат имени контроллера: ${c.name}`);
      }
      this.controllers.set(c.name, c);
    }
  }

  /**
   * Каскадная инициализация: ApiApp → контроллеры → стори.
   */
  init(apiApp: ApiApp<TAppMeta>): void {
    for (const controller of this.controllers.values()) {
      controller.init(apiApp, this);
    }
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
      if (response)
        return this.#compressResponse(this.#prefixResponse('app', response));
    }
    const items = await this.collectMainMenu(actor);
    const keyboard = this.#toKeyboard(items);
    return this.#compressResponse({
      sendMessage: {
        text: 'Выберите действие:',
        keyboard: keyboard ?? undefined,
      },
    });
  }

  /**
   * Обрабатывает /help.
   */
  async handleHelp(actor: TActor): Promise<BotResponse> {
    const appCtrl = this.controllers.get('app');
    if (appCtrl) {
      const response = await appCtrl.handleHelpMessage(actor);
      if (response)
        return this.#compressResponse(this.#prefixResponse('app', response));
    }
    return this.#compressResponse({
      sendMessage: { text: 'Нет доступных пунктов меню.' },
    });
  }

  // ── Обработка callback ──

  /**
   * Обрабатывает callback, маршрутизируя по префиксу контроллера.
   * Разжимает данные перед передачей контроллеру, сжимает ответ.
   */
  async handleCallback(
    data: string,
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse> {
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

    // Разжимаем данные перед передачей контроллеру
    const restData = extractRestData(data);
    const expanded = this.#expandCallbackData(restData);

    // Проверка на устаревшие id после разжатия
    if (this.#hasStaleIds(expanded)) {
      return {
        sendMessage: {
          text: '⏳ *Кнопка устарела*\\. Пожалуйста, нажмите /start для обновления\\.',
          parseMode: 'MarkdownV2',
        },
      };
    }

    const response = await controller.handleCallback(expanded, actor, session);

    this.#applyCapturedInput(session, controllerName, response);

    // Добавляем префикс контроллера к кнопкам (стори не знают о контроллере)
    const prefixed = this.#prefixResponse(controllerName, response);

    if (prefixed.delegate) {
      const delegateResponse = await controller.handleCallback(
        prefixed.delegate.path,
        actor,
        session,
      );
      return this.#compressResponse(
        this.#mergeResponses(prefixed, delegateResponse),
      );
    }

    return this.#compressResponse(prefixed);
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
      return this.#compressResponse(
        (await this.handleTimeout(actor, session)) ?? {
          releaseInput: true,
        },
      );
    }

    const [ctrlName] = activeHandler.path.split('/');
    const controller = this.controllers.get(ctrlName ?? '');
    if (!controller) return null;

    const response = await controller.handleMessage(update, actor, session);
    this.#applyCapturedInput(session, ctrlName ?? '', response);
    return this.#compressResponse(
      this.#prefixResponse(ctrlName ?? '', response),
    );
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

    return this.#compressResponse(
      this.#prefixResponse(ctrlName ?? '', response),
    );
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

    return this.#compressResponse(
      this.#prefixResponse(ctrlName ?? '', response),
    );
  }

  // ── Сжатие / разжатие id ──

  /**
   * Разжимает callback_data: заменяет сжатые ключи (8 hex) на реальные UUID.
   * Контроллеры получают уже разжатые данные.
   */
  #expandCallbackData(raw: string): string {
    const parts = raw.split(':');
    return parts
      .map((part) => {
        if (!SHRUNK_RE.test(part)) return part;
        const real = this.shortIds.get(part);
        if (!real) {
          getGlobalLogger()?.warn(
            'ui-app',
            'Ключ shortIds не найден (возможно кнопка устарела)',
            { key: part },
          );
        }
        return real ?? part;
      })
      .join(':');
  }

  /**
   * Проверяет, есть ли в разжатых данных сжатые ключи,
   * которые не удалось разжать (shortIds не сработал).
   */
  #hasStaleIds(expanded: string): boolean {
    const parts = expanded.split(':');
    return parts.some((part) => SHRUNK_RE.test(part) && !UUID_RE.test(part));
  }

  /**
   * Сжимает все UUID в callback_data.
   */
  #compressAction(raw: string): string {
    // Специальные префиксы, не принадлежащие конкретному контроллеру
    if (raw.startsWith('app:')) {
      return raw;
    }

    const parts = raw.split(':');
    return parts
      .map((part) => (UUID_RE.test(part) ? this.#shrink(part) : part))
      .join(':');
  }

  /**
   * Сжимает значение id в короткий ключ (первые 8 символов UUID).
   * При коллизии добавляет цифровой суффикс.
   */
  #shrink(value: string): string {
    let key = value.slice(0, 8);

    const existing = this.shortIds.get(key);
    if (existing !== undefined && existing !== value) {
      key = `${key}-${this.shortIds.size}`;
    }

    this.shortIds.set(key, value);
    return key;
  }

  /**
   * Обходит BotResponse и сжимает все кнопки (code).
   */
  #compressResponse(response: BotResponse): BotResponse {
    const compressKeyboard = (
      kb: NonNullable<BotResponse['sendMessage']>['keyboard'],
    ): typeof kb => {
      if (!kb) return kb;
      return {
        ...kb,
        rows: kb.rows.map((row) =>
          row.map((btn) => ({
            ...btn,
            code: this.#compressAction(btn.code),
          })),
        ),
      };
    };

    const result: BotResponse = { ...response };

    if (result.sendMessage?.keyboard) {
      result.sendMessage = {
        ...result.sendMessage,
        keyboard: compressKeyboard(result.sendMessage.keyboard) ?? undefined,
      };
    }

    if (result.sendMessages) {
      result.sendMessages = result.sendMessages.map((sm) => ({
        ...sm,
        keyboard: compressKeyboard(sm.keyboard) ?? undefined,
      }));
    }

    if (result.editMessage?.keyboard) {
      result.editMessage = {
        ...result.editMessage,
        keyboard: compressKeyboard(result.editMessage.keyboard) ?? undefined,
      };
    }

    return result;
  }

  // ── Приватные хелперы ──

  /**
   * Добавляет префикс контроллера ко всем кодам кнопок в ответе.
   * Стори не знают о контроллере — префикс добавляет UiApp.
   */
  #prefixResponse(controllerName: string, response: BotResponse): BotResponse {
    const prefixCode = (code: string): string => {
      // Уже начинается с префикса этого контроллера — не дублируем
      if (code.startsWith(`${controllerName}:`)) return code;
      // Уже начинается с префикса другого контроллера (напр. app:main-menu)
      for (const [name] of this.controllers) {
        if (code.startsWith(`${name}:`)) return code;
      }
      return `${controllerName}:${code}`;
    };

    const prefixKeyboard = (
      kb: NonNullable<BotResponse['sendMessage']>['keyboard'],
    ): typeof kb => {
      if (!kb) return kb;
      return {
        ...kb,
        rows: kb.rows.map((row) =>
          row.map((btn) => ({
            ...btn,
            code: prefixCode(btn.code),
          })),
        ),
      };
    };

    const result: BotResponse = { ...response };

    if (result.sendMessage?.keyboard) {
      result.sendMessage = {
        ...result.sendMessage,
        keyboard: prefixKeyboard(result.sendMessage.keyboard) ?? undefined,
      };
    }

    if (result.sendMessages) {
      result.sendMessages = result.sendMessages.map((sm) => ({
        ...sm,
        keyboard: prefixKeyboard(sm.keyboard) ?? undefined,
      }));
    }

    if (result.editMessage?.keyboard) {
      result.editMessage = {
        ...result.editMessage,
        keyboard: prefixKeyboard(result.editMessage.keyboard) ?? undefined,
      };
    }

    return result;
  }

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
