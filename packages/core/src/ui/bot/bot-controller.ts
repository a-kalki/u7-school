import type { ApiApp } from '#api/app/api-app';
import { fromError } from '#domain/errors/error-helpers';
import type { AppMeta } from '#domain/types';
import type { Logger } from '#shared/logger';
import { getGlobalLogger } from '#shared/logger';
import { md, mdConcat, mdJoin } from '#shared/markdown';
import { serializeError } from '#shared/serialize-error';
import { UiController } from '../ui-controller';
import type { BotUiAppResolve } from './app-types';
import type { BotUiStory } from './bot-ui-story';
import type {
  BotSession,
  BotUpdate,
  DialogResponse,
  KeyboardDescription,
  NotificationPayload,
  ProactiveSender,
} from './types';

/**
 * Базовый контроллер Telegram-бота на контракте «Диалог и Экран».
 *
 * Ответственность: стори-роутинг по префиксу, префиксация кодов кнопок и
 * `delegate.path` именем контроллера, обработка ошибок (экран, не падение).
 * Сессией и маршрутом диалога владеет uiApp; экраном — транспорт.
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

  /** Проактивное уведомление — делегирует родителю без изменений */
  async notify(
    telegramId: number,
    payload: NotificationPayload,
  ): Promise<void> {
    await this.proactiveSender.notify(telegramId, payload);
  }

  /** Проактивный кик из группы — делегирует родителю без изменений */
  async kickFromGroup(groupId: number | string, userId: number): Promise<void> {
    await this.proactiveSender.kickFromGroup(groupId, userId);
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
   * Обработка callback (data без префикса контроллера, с реальными ID —
   * shortId и штамп уже сняты транспортом). Делегирует в стори по префиксу.
   * Необработанные ошибки стори перехватываются и превращаются в экран.
   */
  async handleCallback(
    data: string,
    actor: TActor,
    session: BotSession,
  ): Promise<DialogResponse> {
    try {
      for (const story of this.stories) {
        const prefix = `${story.name}:`;
        if (data.startsWith(prefix)) {
          const raw = data.slice(prefix.length);
          const response = await story.handleCallback(raw, actor, session);
          return this.#prefixResponse(response);
        }
      }
      return this.#unknownCommandScreen();
    } catch (err) {
      return this.handleError(err);
    }
  }

  /**
   * Текстовый ввод активного диалога (dialog.path = controller/story).
   * null — ввод не обработан (uiApp передаст next).
   */
  async handleMessage(
    update: BotUpdate,
    actor: TActor,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    try {
      const story = this.#storyByPath(session.dialog.path);
      if (story) {
        return await story.handleMessage(update, actor, session);
      }
      return null;
    } catch (err) {
      return this.handleError(err);
    }
  }

  /** Отмена активного диалога — доменная очистка стори. */
  async handleCancel(
    actor: TActor,
    session: BotSession,
  ): Promise<DialogResponse> {
    const story = this.#storyByPath(session.dialog.path);
    if (story) {
      return story.handleCancel(actor, session);
    }
    return { release: true };
  }

  // ── Хелперы ──

  /** Генерирует callback_data с префиксом контроллера. */
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

  /** Стори активного диалога по `controller/story` (dialog.path). */
  #storyByPath(path: string): BotUiStory<TAppMeta, TActor> | undefined {
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return this.findStory(parts[1] ?? '');
    }
    return undefined;
  }

  #unknownCommandScreen(): DialogResponse {
    return { screen: { text: md`⚠️ Неизвестная команда` } };
  }

  // ── Префиксация кнопок ──

  /**
   * Добавляет префикс контроллера (this.name) ко всем кодам кнопок в ответе
   * и к `delegate.path`.
   */
  #prefixResponse(response: DialogResponse): DialogResponse {
    const result: DialogResponse = { ...response };

    if (response.screen?.keyboard) {
      result.screen = {
        ...response.screen,
        keyboard: this.#prefixKeyboard(response.screen.keyboard),
      };
    }
    if (response.info?.keyboard) {
      result.info = {
        ...response.info,
        keyboard: this.#prefixKeyboard(response.info.keyboard),
      };
    }
    if (response.delegate) {
      result.delegate = {
        path: this.#prefixCode(response.delegate.path),
      };
    }

    return result;
  }

  #prefixKeyboard(kb: KeyboardDescription): KeyboardDescription {
    return {
      ...kb,
      rows: kb.rows.map((row) =>
        row.map((btn) => ({ ...btn, code: this.#prefixCode(btn.code) })),
      ),
    };
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

    // Иначе — кросс-контроллерный код, уже с префиксом (напр. app:menu).
    return code;
  }

  // ── Утилиты ──

  /**
   * Универсальный обработчик ошибок: ошибка — ЭКРАН (решение владельца №1).
   * Различает типы ошибок через `fromError()` и возвращает подходящее
   * пользовательское сообщение (валидный MarkdownV2 — md-интерполяция
   * экранирует доменные данные).
   */
  protected handleError(err: unknown): DialogResponse {
    const appError = fromError(err);

    switch (appError.kind) {
      case 'validation': {
        const payload = appError.payload as
          | { issues?: Array<{ path?: string; message: string }> }
          | undefined;
        const issues = payload?.issues;

        if (issues && issues.length > 0) {
          const lines = issues.map(
            (i) => md`• *${i.path ?? ''}*: ${i.message}`,
          );
          return {
            screen: {
              text: mdConcat(
                md`⚠️ *Некорректные данные*\n\n`,
                mdJoin(lines),
                md`\n\nПожалуйста, нажмите /start и попробуйте снова\\.`,
              ),
            },
          };
        }

        return {
          screen: {
            text: md`⚠️ *Некорректные данные*\n\n${appError.message}\n\nПожалуйста, исправьте и попробуйте снова\\.`,
          },
        };
      }

      case 'not-found':
      case 'conflict':
      case 'access-denied':
      case 'bad-request':
        return {
          screen: { text: md`⚠️ ${appError.message}` },
        };

      default: {
        this.logger?.error(
          'bot',
          'Необработанная ошибка в контроллере',
          serializeError(err),
        );

        return {
          screen: {
            text: md`⚠️ *Произошла внутренняя ошибка*\n\nПожалуйста, попробуйте позже или обратитесь к администратору\\.`,
          },
        };
      }
    }
  }
}
