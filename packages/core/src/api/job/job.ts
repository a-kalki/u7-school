import type { ModuleResolver } from '#domain/types';

/**
 * Периодическое задание (Job) — доменная логика, выполняемая
 * планировщиком по интервалу, а не по действию пользователя.
 *
 * Аналог UseCase: получает резолвер зависимостей через init()
 * (пробрасывается модулем при инициализации) и инкапсулирует
 * одну фоновую операцию в execute().
 *
 * @typeParam TResolve — резолвер зависимостей (расширяет ModuleResolver)
 */
export abstract class Job<TResolve extends ModuleResolver = ModuleResolver> {
  /** Уникальное имя задания (например "sweep-abandoned-questionnaires") */
  abstract readonly jobName: string;

  /** Человекочитаемая метка задания (для логов и документации) */
  abstract readonly jobLabel: string;

  /** Интервал запуска в мс. */
  abstract readonly intervalMs: number;

  protected resolve!: TResolve;

  /**
   * Инициализирует задание резолвером.
   * Вызывается модулем при регистрации задания.
   */
  init(resolve: TResolve): void {
    this.resolve = resolve;
  }

  /**
   * Один прогон задания. Ошибка прогона не должна ронять процесс —
   * планировщик перехватывает и логирует её.
   */
  abstract execute(): Promise<void>;
}
