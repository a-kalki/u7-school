import type { ApiApp } from '#api/app/api-app';
import type { AppMeta } from '#domain/types';
import type { BotUserStory } from '../bot-user-story';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '../types';

/**
 * Базовый контроллер для Telegram-бота с поддержкой UserStory.
 *
 * @typeParam TAppMeta — тип метаданных приложения
 * @typeParam TActor — тип актора (пользователя)
 */
export abstract class BotController<
  TAppMeta extends AppMeta = AppMeta,
  TActor = unknown,
> {
  /** Уникальное имя контроллера */
  abstract readonly name: string;

  /** Зарегистрированные пользовательские сценарии */
  protected readonly stories: BotUserStory<TAppMeta, TActor>[] = [];

  /** Ссылка на API приложения (устанавливается в init) */
  protected api!: ApiApp<TAppMeta>;

  /**
   * Инициализация контроллера — вызывается при старте бота.
   * Инициализирует все зарегистрированные стори.
   */
  init(api: ApiApp<TAppMeta>): void {
    this.api = api;
    for (const story of this.stories) {
      story.init(api);
    }
  }

  /** Сброс временных данных контроллера и всех стори */
  reset(): void {
    for (const story of this.stories) {
      story.reset();
    }
  }

  // ── Обработчики ──

  /**
   * Обработка callback (data без префикса контроллера).
   * Делегирует в стори по префиксу в callback_data.
   */
  async handleCallback(
    data: string,
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse> {
    for (const story of this.stories) {
      const prefix = `${story.name}:`;
      if (data.startsWith(prefix)) {
        const action = data.slice(prefix.length);
        return story.handleCallback(action, actor, session);
      }
    }
    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  /**
   * Обработка сообщений (когда контроллер активен через captureInput).
   * Делегирует активной стори по activeHandler.path.
   */
  async handleMessage(
    update: BotUpdate,
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse> {
    const activePath = session.activeHandler?.path;
    if (activePath) {
      const story = this.findStoryByPath(activePath);
      if (story) {
        return story.handleMessage(update, actor, session);
      }
    }
    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  /**
   * Главное меню — агрегирует кнопки от всех стори.
   */
  async handleStart(actor: TActor): Promise<MainMenuAction[]> {
    const items: MainMenuAction[] = [];
    for (const story of this.stories) {
      const item = await story.handleStart(actor);
      if (item) {
        items.push({
          ...item,
          action: this.cb(item.action),
        });
      }
    }
    return items.sort((a, b) => a.priority - b.priority);
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
      const story = this.findStoryByPath(activePath);
      if (story) {
        return story.handleCancel(actor, session);
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
      const story = this.findStoryByPath(activePath);
      if (story) {
        return story.handleTimeout(actor, session);
      }
    }
    return {
      releaseInput: true,
      sendMessage: { text: '⏰ Время ожидания истекло.' },
    };
  }

  // ── Хелперы ──

  /** Генерирует callback_data с префиксом контроллера */
  protected cb(action: string): string {
    return `${this.name}:${action}`;
  }

  /** Убирает префикс контроллера из callback_data */
  protected stripPrefix(data: string): string {
    const prefix = `${this.name}:`;
    if (data.startsWith(prefix)) {
      return data.slice(prefix.length);
    }
    return data;
  }

  /** Поиск стори по имени */
  protected findStory(
    name: string,
  ): BotUserStory<TAppMeta, TActor> | undefined {
    return this.stories.find((s) => s.name === name);
  }

  /** Поиск стори по пути из activeHandler */
  private findStoryByPath(
    path: string,
  ): BotUserStory<TAppMeta, TActor> | undefined {
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return this.findStory(parts[1]!);
    }
    return undefined;
  }

  // ── Утилиты ──

  protected escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  protected handleError(err: unknown): BotResponse {
    const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
    return {
      sendMessage: {
        text: `⚠️ Произошла ошибка: ${this.escapeMarkdown(message)}`,
        parseMode: 'MarkdownV2',
      },
    };
  }
}
