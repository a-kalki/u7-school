import type { ApiApp } from '#api/app/api-app';
import { fromError } from '#domain/errors/error-helpers';
import type { AppMeta } from '#domain/types';
import type { Logger } from '#shared/logger';
import { getGlobalLogger } from '#shared/logger';
import { serializeError } from '#shared/serialize-error';
import { UiController } from '../../ui-controller';
import type { BotUiStory } from '../bot-ui-story';
import type {
  BotResponse,
  BotUpdate,
  KeyboardDescription,
  MainMenuAction,
  SessionData,
} from '../types';
import type { BotUiApp } from '../ui-app';

/**
 * Базовый контроллер для Telegram-бота с поддержкой UserStory.
 *
 * Контроллер добавляет префикс имени к кнопкам и callback-данным,
 * но НЕ занимается сжатием id — это делает BotUiApp.
 * Story оперируют реальными данными, контроллер — префиксами.
 *
 * @typeParam TAppMeta — тип метаданных приложения (по умолчанию AppMeta)
 * @typeParam TActor — тип актора (пользователя)
 */
export abstract class BotController<
  TAppMeta extends AppMeta = AppMeta,
  TActor = unknown,
> extends UiController<BotUiStory<TAppMeta, TActor>> {
  /** Публичный доступ к stories */
  getStories(): BotUiStory<TAppMeta, TActor>[] {
    return this.stories;
  }

  /** API приложения (для внешних вызовов к другим модулям) */
  protected appApi!: ApiApp<TAppMeta>;

  /** UI-приложение */
  protected uiApp!: BotUiApp<TAppMeta, TActor>;

  init(appApi: ApiApp<TAppMeta>, uiApp: BotUiApp<TAppMeta, TActor>): void {
    this.appApi = appApi;
    this.uiApp = uiApp;
    for (const story of this.stories) {
      story.init(appApi, uiApp);
    }
  }

  /** Сброс временных данных контроллера и всех стори */
  reset(): void {
    for (const story of this.stories) {
      story.reset();
    }
  }

  /** Логгер — берётся из глобального логгера приложения */
  protected get logger(): Logger | undefined {
    return getGlobalLogger();
  }

  // ── Обработчики ──

  /**
   * Обработка callback (data без префикса контроллера, с реальными ID).
   * Делегирует в стори. BotUiApp уже разжал данные.
   * Необработанные ошибки стори перехватываются и логируются.
   */
  async handleCallback(
    data: string,
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse> {
    try {
      for (const story of this.stories) {
        const prefix = `${story.name}:`;
        if (data.startsWith(prefix)) {
          const raw = data.slice(prefix.length);
          const response = await story.handleCallback(raw, actor, session);
          return this.#prefixResponse(response);
        }
      }
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * Обработка сообщений (когда контроллер активен через captureInput).
   * Делегирует активной стори по activeHandler.path.
   * Необработанные ошибки стори перехватываются и логируются.
   */
  async handleMessage(
    update: BotUpdate,
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse> {
    try {
      const activePath = session.activeHandler?.path;
      if (activePath) {
        const story = this.#findStoryByPath(activePath);
        if (story) {
          const response = await story.handleMessage(update, actor, session);
          return this.#prefixResponse(response);
        }
      }
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * Главное меню — агрегирует кнопки от всех стори.
   * Добавляет префикс контроллера к action от стори.
   * BotUiApp сожмёт id при отправке.
   */
  async handleStart(actor: TActor): Promise<MainMenuAction[]> {
    const items: MainMenuAction[] = [];
    for (const story of this.stories) {
      const item = await story.handleStart(actor);
      if (item) {
        if (item.kind === 'url') {
          items.push(item);
        } else {
          items.push({
            ...item,
            action: `${this.name}:${item.action}`,
          });
        }
      }
    }
    return items.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Приветственное сообщение с главным меню.
   * Переопределяется AppController.
   * По умолчанию возвращает null — контроллер не участвует в /start.
   */
  async handleWelcome(_actor: TActor): Promise<BotResponse | null> {
    return null;
  }

  /**
   * Сообщение помощи (инструкция + список команд).
   * Переопределяется AppController.
   * По умолчанию возвращает null — контроллер не участвует в /help.
   */
  async handleHelpMessage(_actor: TActor): Promise<BotResponse | null> {
    return null;
  }

  /**
   * Отмена текущего действия.
   * Делегирует активной стори или освобождает ввод.
   */
  async handleCancel(
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse> {
    const activePath = session.activeHandler?.path;
    if (activePath) {
      const story = this.#findStoryByPath(activePath);
      if (story) {
        const response = await story.handleCancel(actor, session);
        return this.#prefixResponse(response);
      }
    }
    return { releaseInput: true };
  }

  /**
   * Таймаут активного обработчика.
   * Делегирует активной стори или освобождает ввод.
   */
  async handleTimeout(
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse> {
    const activePath = session.activeHandler?.path;
    if (activePath) {
      const story = this.#findStoryByPath(activePath);
      if (story) {
        const response = await story.handleTimeout(actor, session);
        return this.#prefixResponse(response);
      }
    }
    return {
      releaseInput: true,
      sendMessage: { text: '⏰ Время ожидания истекло.' },
    };
  }

  // ── Хелперы ──

  /**
   * Генерирует callback_data с префиксом контроллера (без сжатия).
   * Сжатием занимается BotUiApp.
   */
  protected cb(action: string): string {
    return `${this.name}:${action}`;
  }

  /** Убирает префикс контроллера из callback_data */
  stripPrefix(data: string): string {
    const prefix = `${this.name}:`;
    if (data.startsWith(prefix)) {
      return data.slice(prefix.length);
    }
    return data;
  }

  /** Поиск стори по имени */
  protected findStory(name: string): BotUiStory<TAppMeta, TActor> | undefined {
    return this.stories.find((s) => s.name === name);
  }

  /** Поиск стори по пути из activeHandler: controllerName/storyName/... */
  #findStoryByPath(path: string): BotUiStory<TAppMeta, TActor> | undefined {
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return this.findStory(parts[1] ?? '');
    }
    return undefined;
  }

  // ── Префиксация кнопок ──

  /**
   * Добавляет префикс контроллера (this.name) ко всем кодам кнопок в ответе.
   *
   * Коды стори (`story:action`) получают префикс контроллера.
   * Кросс-контроллерные коды (напр. `app:main-menu`) уже содержат префикс
   * другого контроллера и не трогаются.
   */
  #prefixResponse(response: BotResponse): BotResponse {
    const prefixKeyboard = (
      kb: KeyboardDescription | undefined,
    ): KeyboardDescription | undefined => {
      if (!kb) return kb;
      return {
        ...kb,
        rows: kb.rows.map((row) =>
          row.map((btn) => ({
            ...btn,
            code: this.#prefixCode(btn.code),
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
      result.sendMessages = result.sendMessages.map((sm) =>
        sm.keyboard
          ? { ...sm, keyboard: prefixKeyboard(sm.keyboard) ?? undefined }
          : sm,
      );
    }

    if (result.editMessage?.keyboard) {
      result.editMessage = {
        ...result.editMessage,
        keyboard: prefixKeyboard(result.editMessage.keyboard) ?? undefined,
      };
    }

    if (result.delegate) {
      result.delegate = {
        ...result.delegate,
        path: this.#prefixCode(result.delegate.path),
      };
    }

    return result;
  }

  /**
   * Префиксирует отдельный код кнопки именем контроллера.
   * Не трогает уже префиксированные коды (свои или чужих контроллеров).
   */
  #prefixCode(code: string): string {
    const ownPrefix = `${this.name}:`;
    if (code.startsWith(ownPrefix)) return code;

    // Код стори этого контроллера — добавляем префикс контроллера.
    if (this.stories.some((s) => code.startsWith(`${s.name}:`))) {
      return ownPrefix + code;
    }

    // Иначе — кросс-контроллерный код, уже с префиксом (напр. app:main-menu).
    return code;
  }

  // ── Утилиты ──

  protected escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  /**
   * Универсальный обработчик ошибок на уровне контроллера.
   * Различает типы ошибок через `fromError()` и возвращает
   * подходящее пользовательское сообщение.
   */
  protected handleError(err: unknown): BotResponse {
    const appError = fromError(err);

    switch (appError.kind) {
      case 'validation': {
        const payload = appError.payload as
          | { issues?: Array<{ path: string; message: string }> }
          | undefined;
        const issues = payload?.issues;

        if (issues && issues.length > 0) {
          const lines = issues.map(
            (i) =>
              `• *${this.escapeMarkdown(i.path)}*: ${this.escapeMarkdown(i.message)}`,
          );
          return {
            releaseInput: true,
            sendMessage: {
              text: `⚠️ *Некорректные данные*\n\n${lines.join('\n')}\n\nПожалуйста, нажмите /start и попробуйте снова\\.`,
              parseMode: 'MarkdownV2',
            },
          };
        }

        return {
          releaseInput: true,
          sendMessage: {
            text: `⚠️ *Некорректные данные*\n\n${this.escapeMarkdown(appError.message)}\n\nПожалуйста, исправьте и попробуйте снова\\.`,
            parseMode: 'MarkdownV2',
          },
        };
      }

      case 'not-found':
      case 'conflict':
      case 'access-denied':
      case 'bad-request':
        return {
          releaseInput: true,
          sendMessage: {
            text: `⚠️ ${this.escapeMarkdown(appError.message)}`,
            parseMode: 'MarkdownV2',
          },
        };

      default: {
        this.logger?.error(
          'bot',
          'Необработанная ошибка в контроллере',
          serializeError(err),
        );

        return {
          releaseInput: true,
          sendMessage: {
            text: '⚠️ *Произошла внутренняя ошибка*\n\nПожалуйста, попробуйте позже или обратитесь к администратору\\.',
            parseMode: 'MarkdownV2',
          },
        };
      }
    }
  }
}
