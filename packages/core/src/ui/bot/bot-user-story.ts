import type { ApiApp } from '#api/app/api-app';
import type { ApiExecutor, ApiModuleMeta, AppMeta } from '#domain/types';
import { escapeMarkdown } from '#shared/markdown';
import { stringUtility } from '#shared/string-utility';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from './types';

/**
 * Абстрактный класс для пользовательского сценария внутри контроллера.
 * Инкапсулирует логику одного сценария (например, просмотр курса, запись на поток).
 *
 * @typeParam TAppMeta — тип метаданных приложения (например, U7BotAppMeta)
 * @typeParam TModuleMeta — тип метаданных модуля, к которому принадлежит сценарий
 * @typeParam TActor — тип актора (пользователя). Минимально требуется поле telegramId.
 */
export abstract class BotUserStory<
  TAppMeta extends AppMeta = AppMeta,
  TModuleMeta extends ApiModuleMeta = ApiModuleMeta,
  TActor = unknown,
> {
  /** Уникальное имя сценария в рамках контроллера */
  abstract readonly name: string;

  /** API своего модуля — для внутренних вызовов (строгая типизация) */
  protected moduleApi!: ApiExecutor<TModuleMeta>;

  /** API приложения — для вызовов к другим модулям */
  protected appApi!: ApiApp<TAppMeta>;

  /** Хранилище для сжатия длинных callback_data */
  protected readonly shortIds = new Map<string, string>();

  /**
   * Инициализация сценария — вызывается контроллером при старте бота.
   * Сохраняет ссылки на API модуля и API приложения.
   */
  init(moduleApi: ApiExecutor<TModuleMeta>, appApi: ApiApp<TAppMeta>): void {
    this.moduleApi = moduleApi;
    this.appApi = appApi;
  }

  /** Сброс временных данных сценария */
  reset(): void {
    this.shortIds.clear();
  }

  /** Обработка callback — абстрактный, реализуется в наследниках */
  abstract handleCallback(
    action: string,
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse>;

  /** Обработка сообщений — абстрактный, реализуется в наследниках */
  abstract handleMessage(
    update: BotUpdate,
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse>;

  /**
   * Кнопка в главном меню.
   * По умолчанию возвращает null — сценарий не показывается в меню.
   */
  async handleStart(_actor: TActor): Promise<MainMenuAction | null> {
    return null;
  }

  /**
   * Отмена текущего действия.
   * По умолчанию освобождает ввод.
   */
  async handleCancel(
    _actor: TActor,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { releaseInput: true };
  }

  /**
   * Таймаут активного обработчика.
   * По умолчанию освобождает ввод и показывает сообщение.
   */
  async handleTimeout(
    _actor: TActor,
    _session: SessionData,
  ): Promise<BotResponse> {
    return {
      releaseInput: true,
      sendMessage: { text: '⏰ Время ожидания истекло.' },
    };
  }

  /** Генерирует callback_data с префиксом сценария */
  protected cb(action: string): string {
    return `${this.name}:${action}`;
  }

  /** Убирает префикс сценария из callback_data */
  protected stripPrefix(data: string): string {
    const prefix = `${this.name}:`;
    if (data.startsWith(prefix)) {
      return data.slice(prefix.length);
    }
    return data;
  }

  /**
   * Сжимает длинное значение в короткий ключ для callback_data.
   * Автоматически генерирует 6-символьный hex-ключ.
   * @returns сгенерированный ключ
   */
  protected shrink(value: string): string {
    const key = stringUtility.random('hhhhhhhh', '');
    this.shortIds.set(key, value);
    return key;
  }

  /** Восстанавливает значение по короткому ключу */
  protected expand(key: string): string | undefined {
    return this.shortIds.get(key);
  }

  /**
   * Экранирует спецсимволы MarkdownV2 для Telegram.
   * Делегирует в утилиту из @u7-scl/core/shared.
   */
  protected escapeMarkdown(text: string): string {
    return escapeMarkdown(text);
  }
}
