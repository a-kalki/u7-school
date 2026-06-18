import type { ApiApp } from '#api/app/api-app';
import type { ApiModule } from '#api/module/api-module';
import type {
  ApiExecutor,
  ApiModuleMeta,
  AppMeta,
  ModuleResolver,
} from '#domain/types';
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

  // ── Обработчики ──

  /**
   * Обработка callback (data без префикса контроллера).
   * Разжимает id, делегирует в стори, сжимает ответ.
   */
  async handleCallback(
    data: string,
    actor: TActor,
    session: SessionData,
  ): Promise<BotResponse> {
    for (const story of this.stories) {
      const prefix = `${story.name}:`;
      if (data.startsWith(prefix)) {
        const raw = data.slice(prefix.length);
        const expanded = this.#expandData(raw);
        const response = await story.handleCallback(expanded, actor, session);
        return this.#compressResponse(response);
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
      const story = this.#findStoryByPath(activePath);
      if (story) {
        const response = await story.handleMessage(update, actor, session);
        return this.#compressResponse(response);
      }
    }
    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
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
        items.push({
          ...item,
          action: `${this.name}:${item.action}`,
        });
      }
    }
    return items.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Описание пунктов меню для команды /help.
   * По умолчанию возвращает null — контроллер не добавляется в /help.
   */
  async handleHelpStart(_actor: TActor): Promise<string | null> {
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

  #compressAction(raw: string): string {
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
    const realIds = compressedIds.map((key) => this.shortIds.get(key) ?? key);
    return [action, ...realIds].join(':');
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
