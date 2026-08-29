import type { DomainEvent } from '#domain/events/domain-event';
import type { ModuleResolver } from '#domain/types';

/**
 * Расписание запуска периодического задания. Все времена — UTC.
 *
 * - `interval` — каждые `intervalMs` миллисекунд; первый прогон — после
 *   интервала от старта (или сразу при старте с `runAtStart`, см. планировщик).
 *   `alignUtc` выравнивает запуски по календарной сетке UTC от epoch
 *   (например, 6ч + alignUtc → 00:00, 06:00, 12:00, 18:00 UTC).
 * - `dailyAt` — ежедневно в указанное время.
 * - `weeklyAt` — еженедельно в указанный день недели (0=вс…6=сб) и время.
 * - `monthlyAt` — ежемесячно в указанный день (1–31) и время; если дня
 *   нет в месяце, клампится на последний день месяца (семантика cron).
 */
export type JobSchedule =
  | {
      kind: 'interval';
      intervalMs: number;
      alignUtc?: boolean;
      runAtStart?: boolean;
    }
  | { kind: 'dailyAt'; hour: number; minute: number }
  | { kind: 'weeklyAt'; weekday: number; hour: number; minute: number }
  | { kind: 'monthlyAt'; day: number; hour: number; minute: number };

/** Метаданные задания — типизируют jobName/jobLabel (аналог UcMeta для UC). */
export interface JobMeta {
  /** Уникальное имя задания (kebab-case, например "sweep-abandoned") */
  name: string;
  /** Человекочитаемая метка (для логов и документации) */
  label: string;
}

/**
 * Периодическое задание (Job) — доменная логика, выполняемая
 * планировщиком по расписанию, а не по действию пользователя.
 *
 * Аналог UseCase: получает резолвер зависимостей через init()
 * (пробрасывается модулем при инициализации) и инкапсулирует
 * одну фоновую операцию в execute().
 *
 * @typeParam TMeta — метаданные задания (имя, метка)
 * @typeParam TResolve — резолвер зависимостей (расширяет ModuleResolver)
 */
export abstract class Job<
  TMeta extends JobMeta = JobMeta,
  TResolve extends ModuleResolver = ModuleResolver,
> {
  /** Уникальное имя задания (например "sweep-abandoned-questionnaires") */
  abstract readonly jobName: TMeta['name'];

  /** Человекочитаемая метка задания (для логов и документации) */
  abstract readonly jobLabel: TMeta['label'];

  /** Расписание запуска (интервал / время суток / день недели+время / день месяца+время) */
  abstract readonly schedule: JobSchedule;

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

  /**
   * Публикует доменные события, накопленные агрегатом.
   * Имя и семантика — как у UseCase.publishEvents.
   */
  protected publishEvents(ar: {
    hasEvents(): boolean;
    flushEvents(): DomainEvent[];
  }): void {
    if (!ar.hasEvents()) return;
    const events = ar.flushEvents();
    const eventBus = this.resolve.eventBus;
    if (!eventBus) return;
    for (const event of events) {
      eventBus.publish(event);
    }
  }
}
