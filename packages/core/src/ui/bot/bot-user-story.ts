import type { ApiApp } from '#api/app/api-app';
import type { AppMeta } from '#domain/types';
import { stringUtility } from '#shared/string-utility';
import type { BotResponse, BotUpdate, MainMenuAction, SessionData } from './types';

/**
 * Абстрактный класс для пользовательского сценария внутри контроллера.
 * Инкапсулирует логику одного сценария (например, просмотр курса, запись на поток).
 *
 * @typeParam TAppMeta - тип метаданных приложения, должен расширять AppMeta
 */
export abstract class BotUserStory<TAppMeta extends AppMeta> {
  /** Уникальное имя сценария в рамках контроллера */
  abstract readonly name: string;

  /** Ссылка на API приложения (устанавливается в init) */
  protected api!: ApiApp<TAppMeta>;

  /** Хранилище для сжатия длинных callback_data */
  protected readonly shortIds = new Map<string, string>();

  /**
   * Инициализация сценария — вызывается при старте контроллера.
   * Сохраняет ссылку на API.
   */
  init(api: ApiApp<TAppMeta>): void {
    this.api = api;
  }

  /** Сброс временных данных сценария */
  reset(): void {
    this.shortIds.clear();
  }

  /** Генерирует callback_data с префиксом сценария */
  cb(action: string): string {
    return `${this.name}:${action}`;
  }

  /** Убирает префикс сценария из callback_data */
  stripPrefix(data: string): string {
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
  shrink(value: string): string {
    const key = stringUtility.random('hhhhhh', '');
    this.shortIds.set(key, value);
    return key;
  }

  /** Восстанавливает значение по короткому ключу */
  expand(key: string): string | undefined {
    return this.shortIds.get(key);
  }

  /** Обработка callback — абстрактный, реализуется в наследниках */
  abstract handleCallback(
    action: string,
    actor: string,
    session: SessionData,
  ): Promise<BotResponse>;

  /** Обработка сообщений — абстрактный, реализуется в наследниках */
  abstract handleMessage(
    update: BotUpdate,
    actor: string,
    session: SessionData,
  ): Promise<BotResponse>;

  /**
   * Кнопка в главном меню.
   * По умолчанию возвращает null — сценарий не показывается в меню.
   */
  async handleStart(_actor: string): Promise<MainMenuAction | null> {
    return null;
  }

  /**
   * Отмена текущего действия.
   * По умолчанию освобождает ввод.
   */
  async handleCancel(
    _actor: string,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { releaseInput: true };
  }

  /**
   * Таймаут активного обработчика.
   * По умолчанию освобождает ввод и показывает сообщение.
   */
  async handleTimeout(
    _actor: string,
    _session: SessionData,
  ): Promise<BotResponse> {
    return {
      releaseInput: true,
      sendMessage: { text: '⏰ Время ожидания истекло.' },
    };
  }
}
