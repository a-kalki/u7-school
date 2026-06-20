import type { ApiApp } from '#api/app/api-app';
import { fromError } from '#domain/errors/error-helpers';
import type { ApiExecutor, ApiModuleMeta, AppMeta } from '#domain/types';
import type { Logger } from '#shared/logger';
import { getGlobalLogger } from '#shared/logger';
import { escapeMarkdown } from '#shared/markdown';
import { serializeError } from '#shared/serialize-error';
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
 * Story оперирует только реальными данными. Контроллер владеет сжатием id
 * и префиксом имени — story не знает ни того, ни другого.
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

  /** Логгер — берётся из глобального логгера приложения */
  protected get logger(): Logger | undefined {
    return getGlobalLogger();
  }

  /**
   * Инициализация сценария — вызывается контроллером при старте бота.
   * Сохраняет ссылки на API модуля и API приложения.
   */
  init(moduleApi: ApiExecutor<TModuleMeta>, appApi: ApiApp<TAppMeta>): void {
    this.moduleApi = moduleApi;
    this.appApi = appApi;
  }

  /** Сброс временных данных сценария (переопределяется при необходимости) */
  reset(): void { }

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
   * Описание кнопки для команды /help.
   * По умолчанию возвращает null — сценарий не добавляется в /help.
   * Должен быть согласован с handleStart: если кнопка есть — описание тоже должно быть.
   */
  async handleHelpDescription(_actor: TActor): Promise<string | null> {
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

  // ── Формирование callback_data (только реальные данные, без сжатия) ──

  /**
   * Колбэк для своей стори.
   * Возвращает `storyName:action[:id...]` — БЕЗ префикса контроллера, БЕЗ сжатия.
   * Контроллер добавит префикс и сожмёт id при отправке.
   *
   * @param action — имя действия (view, list, complete, ...)
   * @param ids — реальные значения id (UUID, ключи)
   */
  protected cb(action: string, ...ids: string[]): string {
    return [this.name, action, ...ids].join(':');
  }

  /**
   * Кросс-стори колбэк: кнопка, ведущая в другую стори того же контроллера.
   * Возвращает `targetStoryName:action[:id...]` — БЕЗ префикса контроллера, БЕЗ сжатия.
   *
   * @param storyName — имя целевой стори
   * @param action — имя действия
   * @param ids — реальные значения id
   */
  protected cbFor(storyName: string, action: string, ...ids: string[]): string {
    return [storyName, action, ...ids].join(':');
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
   * Экранирует спецсимволы MarkdownV2 для Telegram.
   */
  protected escapeMarkdown(text: string): string {
    return escapeMarkdown(text);
  }

  /**
   * Форматирует ISO-дату в читаемый вид (дд.мм.гггг).
   */
  protected formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return iso;
    }
  }

  protected sendUnknownError(): BotResponse {
    return {
      sendMessage: {
        text: 'Произошла неизвестная ошибка. Попробуйте начать с команды /start.',
      },
    };
  }

  /**
   * Универсальный обработчик ошибок.
   * Различает типы ошибок через `fromError()` и возвращает
   * подходящее пользовательское сообщение.
   *
   * - `validation` — перечисляет поля из `payload.issues`
   * - `not-found`, `conflict`, `access-denied`, `bad-request` — текст ошибки
   * - `internal`, `unauthorized` — логирует через логгер и возвращает общее сообщение
   */
  protected handleError(err: unknown): BotResponse {
    const appError = fromError(err);

    switch (appError.kind) {
      case 'validation': {
        const payload = appError.payload as
          | { issues?: Array<{ field: string; message: string }> }
          | undefined;
        const issues = payload?.issues;

        if (issues && issues.length > 0) {
          const lines = issues.map((i) => `• *${i.field}*: ${i.message}`);
          return {
            releaseInput: true,
            sendMessage: {
              text: `⚠️ *Ошибка валидации*\n\n${lines.join('\n')}\n\nПожалуйста, попробуйте снова начав с команды /start с исправленными значениями.`,
              parseMode: 'MarkdownV2',
            },
          };
        }

        return {
          releaseInput: true,
          sendMessage: {
            text: `⚠️ *Ошибка валидации*\n\n${appError.message}\n\nПожалуйста, исправьте и попробуйте снова.`,
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
            text: `⚠️ ${appError.message}`,
            parseMode: 'MarkdownV2',
          },
        };

      case 'internal':
      case 'unauthorized':
      default: {
        this.logger?.error('bot', 'Ошибка в story', serializeError(err));
        return {
          releaseInput: true,
          sendMessage: {
            text: `⚠️ *Произошла внутренняя ошибка*\n\nПожалуйста, попробуйте позже или обратитесь к администратору.`,
            parseMode: 'MarkdownV2',
          },
        };
      }
    }
  }
}
