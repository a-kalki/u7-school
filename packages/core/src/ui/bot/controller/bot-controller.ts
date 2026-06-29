import type { ApiApp } from '#api/app/api-app';
import type { ApiModule } from '#api/module/api-module';
import { fromError } from '#domain/errors/error-helpers';
import type {
  ApiExecutor,
  ApiModuleMeta,
  AppMeta,
  ModuleResolver,
} from '#domain/types';
import type { Logger } from '#shared/logger';
import { getGlobalLogger } from '#shared/logger';
import { serializeError } from '#shared/serialize-error';
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
 * Владеет сжатием id через общую мапу shortIds. Story работают только с
 * реальными данными — контроллер на выходе сжимает id и добавляет префикс,
 * на входе разжимает обратно.
 *
 * @typeParam TAppMeta — тип метаданных приложения (по умолчанию AppMeta)
 * @typeParam TModuleMeta — тип метаданных модуля, к которому привязан контроллер
 * @typeParam TActor — тип актора (пользователя)
 */
export abstract class BotController<
  TAppMeta extends AppMeta = AppMeta,
  TModuleMeta extends ApiModuleMeta = ApiModuleMeta,
  TActor = unknown,
> {
  /** Уникальное имя контроллера */
  abstract readonly name: string;

  /** Зарегистрированные пользовательские сценарии */
  protected readonly stories: BotUserStory<TAppMeta, TModuleMeta, TActor>[] =
    [];

  /** API своего модуля (для внутренних вызовов) */
  protected readonly moduleApi: ApiExecutor<TModuleMeta>;

  /** API приложения (для внешних вызовов к другим модулям) */
  protected appApi!: ApiApp<TAppMeta>;

  /** Общая мапа сжатых id — используется всеми стори контроллера */
  private readonly shortIds = new Map<string, string>();

  constructor(moduleApi: ApiModule<TModuleMeta, ModuleResolver>) {
    this.moduleApi = moduleApi;
  }

  init(appApi: ApiApp<TAppMeta>): void {
    this.appApi = appApi;
    for (const story of this.stories) {
      story.init(this.moduleApi, appApi);
    }
  }

  /** Сброс временных данных контроллера и всех стори */
  reset(): void {
    this.shortIds.clear();
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
   * Обработка callback (data без префикса контроллера).
   * Разжимает id, делегирует в стори, сжимает ответ.
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
          const expanded = this.#expandData(raw);

          // Если после разжатия остались сжатые ключи (8 hex без дефисов)
          // значит shortIds не сработал — кнопка устарела после перезапуска
          if (this.#hasStaleIds(expanded)) {
            return {
              sendMessage: {
                text: '⏳ *Кнопка устарела*\\. Пожалуйста, нажмите /start для обновления\\.',
                parseMode: 'MarkdownV2',
              },
            };
          }

          const response = await story.handleCallback(expanded, actor, session);
          return this.#compressResponse(response);
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
          return this.#compressResponse(response);
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
   * Описание пунктов меню для команды /help.
   * По умолчанию агрегирует описания от всех stories.
   * Если у story нет handleHelpDescription — возвращает null.
   */
  async handleHelpStart(actor: TActor): Promise<string | null> {
    const descriptions: string[] = [];
    for (const story of this.stories) {
      const desc = await story.handleHelpDescription(actor);
      if (desc) {
        descriptions.push(desc);
      }
    }
    if (descriptions.length === 0) return null;
    return descriptions.join('\n\n');
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
        return this.#compressResponse(response);
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
        return this.#compressResponse(response);
      }
    }
    return {
      releaseInput: true,
      sendMessage: { text: '⏰ Время ожидания истекло.' },
    };
  }

  // ── Сжатие / разжатие id ──

  /**
   * Сжимает необработанный callback от стори (storyName:action:id1:id2...).
   * Добавляет префикс контроллера, сжимает id через короткие ключи.
   */
  /** UUID v4 (8-4-4-4-12 hex). Сжимаем только UUID, остальное пропускаем как есть. */
  static readonly #UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /** Сжатый ключ shortIds: ровно 8 hex-символов, без дефисов. */
  static readonly #SHRUNK_RE = /^[0-9a-f]{8}$/i;

  #compressAction(raw: string): string {
    // Специальные префиксы, не принадлежащие конкретному контроллеру
    // (например, app:main-menu — обрабатывается на уровне BotRouter)
    if (raw.startsWith('app:')) {
      return raw;
    }

    // Нет id для сжатия — только storyName:action
    if (raw.split(':').length <= 2) {
      return `${this.name}:${raw}`;
    }

    const [storyName, action, ...ids] = raw.split(':');

    const compressedIds = ids.map((id) =>
      BotController.#UUID_RE.test(id) ? this.#shrink(id) : id,
    );
    return [this.name, storyName, action, ...compressedIds].join(':');
  }

  /**
   * Разжимает данные из callback (action[:compressedId...]).
   * Возвращает action[:realId...] для передачи в стори.
   */
  #expandData(raw: string): string {
    const parts = raw.split(':');
    if (raw.split(':').length <= 1) {
      return raw;
    }
    // action, ...compressedIds
    const [action, ...compressedIds] = parts;
    const realIds = compressedIds.map((key) => {
      const real = this.shortIds.get(key);
      if (!real) {
        this.logger?.warn(
          'controller',
          'Ключ shortIds не найден (возможно кнопка устарела после перезапуска)',
          {
            key,
            controller: this.name,
          },
        );
      }
      return real ?? key;
    });
    return [action, ...realIds].join(':');
  }

  /**
   * Проверяет, есть ли в разжатых данных сжатые ключи,
   * которые не удалось разжать (shortIds не сработал).
   * Сжатый ключ — ровно 8 hex-символов без дефисов.
   */
  #hasStaleIds(expanded: string): boolean {
    const parts = expanded.split(':');
    return parts.some(
      (part) =>
        BotController.#SHRUNK_RE.test(part) &&
        !BotController.#UUID_RE.test(part),
    );
  }

  /**
   * Сжимает значение id в короткий ключ.
   * Использует первые 8 символов (для UUID — первый сегмент).
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
   * Обходит BotResponse и сжимает все кнопки (code) и delegate.path.
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

    // delegate.path — оставляем как есть (не уходит в Telegram, обрабатывается роутером)
    return result;
  }

  /** Убирает префикс контроллера из callback_data (публичный для тестов) */
  stripPrefix(data: string): string {
    const prefix = `${this.name}:`;
    if (data.startsWith(prefix)) {
      return data.slice(prefix.length);
    }
    return data;
  }

  // ═══════════════════════════════════════════

  // ── Хелперы ──

  /**
   * Генерирует callback_data с префиксом контроллера (без сжатия).
   * Используется контроллерами, которые НЕ делегируют в стори
   * (например, OnboardingController).
   */
  protected cb(action: string): string {
    return `${this.name}:${action}`;
  }

  /** Поиск стори по имени */
  protected findStory(
    name: string,
  ): BotUserStory<TAppMeta, TModuleMeta, TActor> | undefined {
    return this.stories.find((s) => s.name === name);
  }

  /** Поиск стори по пути из activeHandler: controllerName/storyName/... */
  #findStoryByPath(
    path: string,
  ): BotUserStory<TAppMeta, TModuleMeta, TActor> | undefined {
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return this.findStory(parts[1] ?? '');
    }
    return undefined;
  }

  // ── Утилиты ──

  protected escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  /**
   * Универсальный обработчик ошибок на уровне контроллера.
   * Различает типы ошибок через `fromError()` и возвращает
   * подходящее пользовательское сообщение.
   *
   * - `validation` — перечисляет поля из `payload.issues`
   * - `not-found`, `conflict`, `access-denied`, `bad-request` — текст ошибки
   * - `internal`, `unauthorized` — логирует и возвращает общее сообщение
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
