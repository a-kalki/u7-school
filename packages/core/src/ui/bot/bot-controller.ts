import type { ApiApp } from '#api/app/api-app';
import { fromError } from '#domain/errors/error-helpers';
import type { AppMeta } from '#domain/types';
import type { Logger } from '#shared/logger';
import { getGlobalLogger } from '#shared/logger';
import { serializeError } from '#shared/serialize-error';
import { UiController } from '../ui-controller';
import type { BotUiAppResolve } from './app-types';
import type { BotUiStory } from './bot-ui-story';
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
 * Базовый контроллер для Telegram-бота с поддержкой UserStory.
 */
export abstract class BotController<
    TAppMeta extends AppMeta = AppMeta,
    TActor = unknown,
    TResolve extends BotUiAppResolve<TAppMeta, TActor> = BotUiAppResolve<
      TAppMeta,
      TActor
    >,
  >
  extends UiController<TResolve>
  implements ProactiveSender
{
  protected declare readonly stories: BotUiStory<TAppMeta, TActor, TResolve>[];

  /** Публичный доступ к stories */
  getStories(): BotUiStory<TAppMeta, TActor>[] {
    return this.stories;
  }

  /** API приложения (для вызовов к useCases) */
  protected appApi!: ApiApp<TAppMeta>;

  /** Родитель (BotUiApp) */
  protected proactiveSender!: ProactiveSender;

  override init(resolve: TResolve, proactiveSender?: ProactiveSender): void {
    this.appApi = resolve.appApi;
    if (proactiveSender) {
      this.proactiveSender = proactiveSender;
    }
    for (const story of this.stories) {
      story.init(resolve, this);
    }
  }

  // ── ProactiveSender ──

  /** Проактивная отправка — префиксирует коды кнопок и делегирует родителю */
  async send(telegramId: number, command: BotCommand): Promise<void> {
    const prepared = this.#prefixCommand(command);
    if (prepared.captureInput) {
      prepared.captureInput = {
        ...prepared.captureInput,
        path: `${this.name}/${prepared.captureInput.path}`,
      };
    }
    await this.proactiveSender.send(telegramId, prepared);
  }

  /** Проактивное уведомление — префиксирует кнопки, делегирует родителю */
  async notify(
    telegramId: number,
    payload: NotificationPayload,
  ): Promise<void> {
    const prepared = this.#prefixCommand({
      sendMessage: { ...payload },
    }).sendMessage;
    if (!prepared) {
      throw new Error('NotificationPayload не сконвертирован в sendMessage');
    }
    await this.proactiveSender.notify(telegramId, prepared);
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
   * Генерирует callback_data с префиксом контроллера.
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
   * Префиксирует коды кнопок в команде (без делегирования).
   *
   * Коды стори (`story:action`) получают префикс контроллера.
   * Кросс-контроллерные коды (напр. `app:main-menu`) уже содержат префикс
   * другого контроллера и не трогаются.
   */
  #prefixCommand(command: BotCommand): BotCommand {
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

    const result: BotCommand = { ...command };

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

    return result;
  }

  /**
   * Добавляет префикс контроллера (this.name) ко всем кодам кнопок в ответе
   * и к `delegate.path`.
   */
  #prefixResponse(response: BotResponse): BotResponse {
    const result: BotResponse = this.#prefixCommand(response);

    if (response.delegate) {
      result.delegate = {
        ...response.delegate,
        path: this.#prefixCode(response.delegate.path),
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
