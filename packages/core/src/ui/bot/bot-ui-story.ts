import type { ApiApp } from '#api/app/api-app';
import { fromError } from '#domain/errors/error-helpers';
import type { AppMeta } from '#domain/types';
import type { Logger } from '#shared/logger';
import { getGlobalLogger } from '#shared/logger';
import { type MdText, md, mdConcat, mdJoin } from '#shared/markdown';
import { serializeError } from '#shared/serialize-error';
import { UiStory } from '../ui-story';
import type { BotUiAppResolve } from './app-types';
import { DialogCache } from './dialog-cache';
import type { KbButton } from './response-builders';
import * as rb from './response-builders';
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

  /** Системный эпохальный кеш стори (сброс при смене диалога): страницы
   * пагинатора и другие пересобираемые данные домена. Дефолт — собственный
   * инстанс (юнит-тесты стори без каскада init тоже получают кеш);
   * прикладное ядро подменяет общим инстансом BotUiApp. */
  protected dialogCache: DialogCache = new DialogCache();

  protected get logger(): Logger | undefined {
    return getGlobalLogger();
  }

  /**
   * Инициализация сценария — вызывается контроллером при старте бота.
   */
  override init(
    resolve: TResolve,
    proactiveSender?: ProactiveSender,
    dialogCache?: DialogCache,
  ): void {
    this.appApi = resolve.appApi;
    if (proactiveSender) {
      this.proactiveSender = proactiveSender;
    }
    if (dialogCache) {
      this.dialogCache = dialogCache;
    }
    super.init(resolve);
  }

  /** Сброс временных данных сценария (переопределяется при необходимости) */
  reset(): void {}

  /**
   * Кнопки выхода на экранах ошибок (ядро не знает кодов приложения).
   * Переопределяется прикладным слоем (например, «⬅️ Меню»); пустой
   * массив — экран ошибки без клавиатуры, как сейчас.
   */
  protected errorExitRows(): { text: string; code: string }[][] {
    return [];
  }

  /** Обработка callback — реализуется в наследниках */
  abstract handleCallback(
    action: string,
    actor: TActor,
    session: BotSession,
  ): Promise<DialogResponse>;

  /**
   * Текстовый ввод (диалог ждёт ввод — awaitInput). Адресат всегда один —
   * активная стори: обязана ответить (без null).
   *
   * Дефолт должен быть недостижим: awaitInput делает стори, умеющая
   * принимать ввод (переопределяет метод). Дошедший ввод — программная
   * ошибка: warn разработчику + явная реплика-отказ пользователю
   * (исключение не бросаем — контроллер превратил бы его в экран
   * «внутренняя ошибка», непонятный пользователю) + `release`: контекст
   * ввода сброшен, пользователь выведен из зависшего ожидания — ошибка
   * самоликвидируется, а не циклично повторяется. Ввод БЕЗ ожидания
   * до стори не доходит — его перехватывает транспорт.
   */
  async handleMessage(
    _update: BotUpdate,
    _actor: TActor,
    session: BotSession,
  ): Promise<DialogResponse> {
    this.logger?.warn(
      'bot',
      'Ввод дошёл до стори без переопределённого handleMessage (awaitInput без обработчика)',
      { story: this.name, dialogPath: session.dialog?.path },
    );
    return {
      ...this.notify(md`Извините, на данном этапе сообщения не принимаются\\.`),
      release: true,
    };
  }

  /**
   * Команда стори в трёхуровневом pipe (ФР-4).
   */
  async handleCommand(
    _update: CommandUpdate,
    _actor: TActor,
    _session: BotSession,
  ): Promise<CommandReaction> {
    return { reaction: 'pass' };
  }

  // ── Делегаты чистых билдеров ответов (ФР-2) ──
  // Тонкие переадресации: доменный язык ответов прямо в наследниках —
  // this.screen(...), this.ask(...), this.warn(...) вместо ручных литералов.

  /** Экран: текст + (опц.) клавиатура. */
  protected screen(
    text: MdText,
    keyboard?: KeyboardDescription,
  ): DialogResponse {
    return rb.screen(text, keyboard);
  }

  /** Спросить: экран + ожидание текстового ввода с контекстом. */
  protected ask(
    text: MdText,
    context: unknown,
    keyboard?: KeyboardDescription,
  ): DialogResponse {
    return rb.ask(text, context, keyboard);
  }

  /** Уведомить: реплика поверх диалога без kind (дефолтный вид транспорта 🔔). */
  protected notify(text: MdText): DialogResponse {
    return rb.notify(text);
  }

  /** Предупреждение поверх диалога (kind: 'warn'). */
  protected warn(text: MdText): DialogResponse {
    return rb.warn(text);
  }

  /** Инфо-заметка поверх диалога (kind: 'info'). */
  protected note(text: MdText): DialogResponse {
    return rb.note(text);
  }

  /** Уйти: делегировать диалог по пути. */
  protected go(path: string): DialogResponse {
    return rb.go(path);
  }

  /** Клавиатура: isMultiple: false по умолчанию, multiple: true — опция. */
  protected kb(
    rows: KbButton[][],
    opts?: { multiple?: boolean },
  ): KeyboardDescription {
    return rb.kb(rows, opts);
  }

  /** Callback-кнопка. */
  protected btn(text: string, code: string): KbButton {
    return rb.btn(text, code);
  }

  /** Кнопка-ссылка. */
  protected btnUrl(text: string, url: string): KbButton {
    return rb.btnUrl(text, url);
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

    return this.screen(
      text,
      this.kb([
        [
          this.btn(
            opts?.confirmButton ?? '✅ Да',
            this.cbFor(this.name, confirmCode, targetId) + extra,
          ),
          this.btn(opts?.cancelButton ?? '❌ Отмена', cancelCode),
        ],
      ]),
    );
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
    return this.screen(md`⚠️ Неизвестная команда`);
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

    // Клавиатура выхода на экране ошибки (errorExitRows), если задана
    const exitRows = this.errorExitRows();
    const errorKb = exitRows.length > 0 ? this.kb(exitRows) : undefined;

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
          return this.screen(
            mdConcat(
              md`⚠️ *Ошибка валидации*\n\n`,
              mdJoin(lines),
              md`\n\nПожалуйста, попробуйте снова начав с команды /start с исправленными значениями\\.`,
            ),
            errorKb,
          );
        }

        return this.screen(
          md`⚠️ *Ошибка валидации*\n\n${appError.message}\n\nПожалуйста, исправьте и попробуйте снова\\.`,
          errorKb,
        );
      }

      case 'not-found':
      case 'conflict':
      case 'access-denied':
      case 'bad-request':
        return this.screen(md`⚠️ ${appError.message}`, errorKb);

      // biome-ignore lint/complexity/noUselessSwitchCase: явно документирует обрабатываемые типы ошибок
      case 'internal':
      // biome-ignore lint/complexity/noUselessSwitchCase: явно документирует обрабатываемые типы ошибок
      case 'unauthorized':
      default: {
        this.logger?.error('bot', 'Ошибка в story', serializeError(err));
        return this.screen(
          md`⚠️ *Произошла внутренняя ошибка*\n\nПожалуйста, попробуйте позже или обратитесь к администратору\\.`,
          errorKb,
        );
      }
    }
  }

  /**
   * Реплика-ошибка без захвата экрана (ФР-5): warn-уведомление поверх
   * диалога (`notify.kind: 'warn'`), экран и ввод не трогает —
   * при валидации ввода awaitInput-контекст сохраняется (переспрос),
   * в pipe-командах — ошибка без перерисовки экрана.
   *
   * Различает типы ошибок через `fromError()`:
   * - `validation` — перечисляет поля из `payload.issues`;
   * - `not-found`, `conflict`, `access-denied`, `bad-request` — текст ошибки;
   * - `internal`, `unauthorized` — логирует и возвращает общее сообщение
   *   (доменные данные не утекают).
   */
  protected errorNotify(err: unknown): DialogResponse {
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
          return this.warn(mdConcat(md`*Ошибка валидации*\n\n`, mdJoin(lines)));
        }

        return this.warn(md`*Ошибка валидации*\n\n${appError.message}`);
      }

      case 'not-found':
      case 'conflict':
      case 'access-denied':
      case 'bad-request':
        return this.warn(md`${appError.message}`);

      // biome-ignore lint/complexity/noUselessSwitchCase: явно документирует обрабатываемые типы ошибок
      case 'internal':
      // biome-ignore lint/complexity/noUselessSwitchCase: явно документирует обрабатываемые типы ошибок
      case 'unauthorized':
      default: {
        this.logger?.error('bot', 'Ошибка в story', serializeError(err));
        return this.warn(
          md`Произошла ошибка\\. Попробуйте ещё раз или обратитесь к администратору\\.`,
        );
      }
    }
  }
}
