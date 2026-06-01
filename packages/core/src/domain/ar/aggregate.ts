import { isoNow } from '@u7-scl/core/shared';
import * as v from 'valibot';
import {
  errBadRequest,
  errDomain,
  throwError,
} from '#domain/errors/error-helpers';
import type {
  AppError,
  BadRequestError,
  DomainError,
} from '#domain/errors/errors';

export interface ArMeta {
  name: string;
  label: string;
  state: {
    uuid: string;
    createdAt: string;
    updatedAt?: string;
  } & Record<string, unknown>;
}

export abstract class Aggregate<TMeta extends ArMeta> {
  /** Valibot-схема для валидации состояния агрегата */
  readonly schema: v.GenericSchema<TMeta['state']>;

  /** Поля, которые safeUpdate никогда не перезаписывает */
  protected safeAttrs: Array<keyof TMeta['state']> = ['uuid', 'createdAt'];

  /**
   * Мутабельное состояние агрегата.
   * Наследники мутируют напрямую, затем safeUpdate({}) для updatedAt.
   * Внешний код не имеет доступа (protected).
   */
  protected _state: TMeta['state'];

  constructor(state: TMeta['state'], schema: v.GenericSchema<TMeta['state']>) {
    this.schema = schema;
    this._state = this.validateState(state);
    this.checkInvariant();
  }

  /** Состояние агрегата — клон только для чтения (внешнее использование) */
  get state(): Readonly<TMeta['state']> {
    return structuredClone(this._state);
  }

  /** Валидация состояния */
  protected validateState(state: TMeta['state']): TMeta['state'] {
    const result = v.safeParse(this.schema, state);
    if (!result.success) {
      console.log('Validation issues:', v.flatten(result.issues));
      this.throwInvariant(
        { issues: v.flatten(result.issues) },
        'Нарушены инварианты агрегата',
      );
    }
    return result.output;
  }

  /** Проверка инвариантов (переопределяется в наследниках) */
  protected checkInvariant(): void {
    // По умолчанию пусто — переопределяется при необходимости
  }

  /**
   * Обновление состояния с валидацией.
   * Автоматически устанавливает updatedAt = isoNow().
   */
  protected updateState(newState: TMeta['state']): void {
    const stamped = { ...newState, updatedAt: isoNow() } as TMeta['state'];
    this._state = this.validateState(stamped);
    this.checkInvariant();
  }

  /**
   * Безопасное частичное обновление состояния.
   * Обновляет только поля, значение которых не undefined.
   * Поля из safeAttrs не перезаписываются никогда.
   * updatedAt устанавливается автоматически через updateState.
   */
  protected safeUpdate(partial: Partial<TMeta['state']>): void {
    const keys = Object.keys(partial as Record<string, unknown>);
    if (keys.length === 0) {
      this._state.updatedAt = isoNow();
      return;
    }

    const updated = this.state as Record<string, unknown>; // полный клон

    for (const key of keys) {
      const value = (partial as Record<string, unknown>)[key];

      // Пропускаем undefined — не перезаписываем
      if (value === undefined) continue;

      // Пропускаем защищённые поля
      if ((this.safeAttrs as string[]).includes(key)) continue;

      updated[key] = value;
    }

    this.updateState(updated as TMeta['state']);
  }

  /**
   * Внутренняя ошибка — баг в коде или повреждение данных.
   * Например: нарушение инвариантов, неконсистентное состояние.
   */
  protected throwInternal(message: string): never {
    throwError(
      errDomain<DomainError>(
        'AR_INTERNAL_ERROR',
        message,
        this.constructor.name,
        undefined,
      ),
    );
  }

  /**
   * Ошибка обработки запроса — плохие входные данные извне.
   * Например: проект не найден, модуль не найден.
   */
  protected throwBadRequest(message: string): never {
    throwError(
      errBadRequest<BadRequestError>('BAD_REQUEST', message, undefined),
    );
  }

  /** Ошибка инварианта */
  protected throwInvariant(
    payload: Record<string, unknown>,
    message = 'Нарушены инварианты агрегата',
  ): never {
    throwError({
      name: 'AR_INVARIANT_ERROR',
      level: 'domain',
      kind: 'internal',
      message,
      payload,
    } satisfies AppError);
  }
}
