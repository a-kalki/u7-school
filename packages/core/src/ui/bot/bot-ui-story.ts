import type { ApiApp } from '#api/app/api-app';
import { fromError } from '#domain/errors/error-helpers';
import type { AppMeta } from '#domain/types';
import type { Logger } from '#shared/logger';
import { getGlobalLogger } from '#shared/logger';
import { type MdText, md, mdConcat, mdJoin } from '#shared/markdown';
import { serializeError } from '#shared/serialize-error';
import { UiStory } from '../ui-story';
import type { BotUiAppResolve } from './app-types';
import type {
  BotSession,
  BotUpdate,
  CommandReaction,
  CommandUpdate,
  DialogResponse,
  KeyboardDescription,
  ProactiveSender,
} from './types';

/**
 * Абстрактная стори на контракте «Диалог и Экран».
 */
export abstract class BotUiStory<
  TAppMeta extends AppMeta = AppMeta,
  TActor = unknown,
  TResolve extends BotUiAppResolve<TAppMeta, TActor> = BotUiAppResolve<
    TAppMeta,
    TActor
  >,
> extends UiStory<TResolve> {
  abstract readonly name: string;

  /** API приложения — для вызовов useCases */
  protected appApi!: ApiApp<TAppMeta>;

  /** Родитель (BotController) — получается через init отдельным аргументом */
  protected proactiveSender!: ProactiveSender;

  protected get logger(): Logger | undefined {
    return getGlobalLogger();
  }

  /**
   * Инициализация сценария — вызывается контроллером при старте бота.
   */
  override init(resolve: TResolve, proactiveSender?: ProactiveSender): void {
    this.appApi = resolve.appApi;
    if (proactiveSender) {
      this.proactiveSender = proactiveSender;
    }
    super.init(resolve);
  }

  /** Сброс временных данных сценария (переопределяется при необходимости) */
  reset(): void { }

  /** Обработка callback — реализуется в наследниках */
  abstract handleCallback(
    action: string,
    actor: TActor,
    session: BotSession,
  ): Promise<DialogResponse>;

  /**
   * Текстовый ввод (диалог ждёт ввод — awaitInput).
   * null — «не моё» (uiApp передаст дальше в next).
   */
  abstract handleMessage(
    update: BotUpdate,
    actor: TActor,
    session: BotSession,
  ): Promise<DialogResponse | null>;

  /**
   * Команда стори в трёхуровневом pipe (ФР-4, решения 2026-09-06).
   */
  async handleCommand(
    _update: CommandUpdate,
    _actor: TActor,
    _session: BotSession,
  ): Promise<CommandReaction> {
    return { reaction: 'pass' };
  }

  // ── Подтверждение действия (confirm-хелпер) ──

  /**
   * Строит confirm-экран: кнопка подтверждения и кнопка отмены.
   *
   * Convention: `action` → `action-confirm`.
   * При подтверждении генерируется callback: `action-confirm:targetId[:extraData]`.
   *
   * @param action    — базовое действие (напр. 'mark-abandoned', 'complete')
   * @param targetId  — id объекта (UUID студента, потока)
   * @param text      — текст-подтверждение (MdText: доменные данные — через md-интерполяцию)
   * @param opts      — опции (текст кнопок, куда вернуться при отмене, доп. данные)
   */
  protected confirm(
    action: string,
    targetId: string,
    text: MdText,
    opts?: {
      /** Текст на кнопке подтверждения (по умолчанию '✅ Да') */
      confirmButton?: string;
      /** Текст на кнопке отмены (по умолчанию '❌ Отмена') */
      cancelButton?: string;
      /** Куда вернуться при отмене: story:action (по умолчанию this.name:detail) */
      cancelCode?: string;
      /** Дополнительные данные, добавляемые через : после id */
      extraData?: string;
    },
  ): DialogResponse {
    const confirmCode = `${action}-confirm`;
    const extra = opts?.extraData ? `:${opts.extraData}` : '';
    const cancelCode =
      opts?.cancelCode ?? this.cbFor(this.name, 'detail', targetId);

    const keyboard: KeyboardDescription = {
      rows: [
        [
          {
            text: opts?.confirmButton ?? '✅ Да',
            code: this.cbFor(this.name, confirmCode, targetId) + extra,
          },
          {
            text: opts?.cancelButton ?? '❌ Отмена',
            code: cancelCode,
          },
        ],
      ],
      isMultiple: false,
    };

    return { screen: { text, keyboard } };
  }

  // ── Формирование callback_data (только реальные данные, без сжатия) ──

  /**
   * Колбэк для своей стори. Возвращает `storyName:action[:id...]`.
   *
   * @param action — имя действия (view, list, complete, ...)
   * @param ids — реальные значения id (UUID, ключи)
   */
  protected cb(action: string, ...ids: string[]): string {
    return [this.name, action, ...ids].join(':');
  }

  /**
   * Кросс-стори колбэк: кнопка, ведущая в другую стори того же контроллера.
   *
   * @param storyName — имя целевой стори
   * @param action — имя действия
   * @param ids — реальные значения id
   */
  protected cbFor(storyName: string, action: string, ...ids: string[]): string {
    return [storyName, action, ...ids].join(':');
  }

  /**
   * Экран «Неизвестная команда» для ветки внутри стори.
   */
  protected unknownCommand(
    action: string,
    actor?: TActor,
    session?: BotSession,
  ): DialogResponse {
    this.logger?.warn('bot', 'Кнопка без обработчика', {
      code: `${this.name}:${action}`,
      dialogPath: session?.dialog?.path,
      ...(actor !== undefined ? { actor } : {}),
    });
    return { screen: { text: md`⚠️ Неизвестная команда` } };
  }

  /** Убирает префикс сценария из callback_data */
  protected stripPrefix(data: string): string {
    const prefix = `${this.name}:`;
    if (data.startsWith(prefix)) {
      return data.slice(prefix.length);
    }
    return data;
  }

  /** Форматирует ISO-дату в читаемый вид (дд.мм.гггг). */
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

  /**
   * Универсальный обработчик ошибок: ошибка.
   *
   * - `validation` — перечисляет поля из `payload.issues`
   * - `not-found`, `conflict`, `access-denied`, `bad-request` — текст ошибки
   * - `internal`, `unauthorized` — логирует и возвращает общее сообщение
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
                md`⚠️ *Ошибка валидации*\n\n`,
                mdJoin(lines),
                md`\n\nПожалуйста, попробуйте снова начав с команды /start с исправленными значениями\\.`,
              ),
            },
          };
        }

        return {
          screen: {
            text: md`⚠️ *Ошибка валидации*\n\n${appError.message}\n\nПожалуйста, исправьте и попробуйте снова\\.`,
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

      // biome-ignore lint/complexity/noUselessSwitchCase: явно документирует обрабатываемые типы ошибок
      case 'internal':
      // biome-ignore lint/complexity/noUselessSwitchCase: явно документирует обрабатываемые типы ошибок
      case 'unauthorized':
      default: {
        this.logger?.error('bot', 'Ошибка в story', serializeError(err));
        return {
          screen: {
            text: md`⚠️ *Произошла внутренняя ошибка*\n\nПожалуйста, попробуйте позже или обратитесь к администратору\\.`,
          },
        };
      }
    }
  }
}
