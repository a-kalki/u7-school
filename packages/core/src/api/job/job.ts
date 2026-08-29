import type { DomainEvent } from '#domain/events/domain-event';
import type { ModuleResolver } from '#domain/types';

/**
 * Расписание запуска периодического задания. Все времена — UTC.
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

export interface JobMeta {
  name: string;
  label: string;
}

/**
 * Периодическое задание (Job) — доменная логика, выполняемая
 * планировщиком по расписанию, а не по действию пользователя.
 */
export abstract class Job<
  TMeta extends JobMeta = JobMeta,
  TResolve extends ModuleResolver = ModuleResolver,
> {
  abstract readonly jobName: TMeta['name'];

  abstract readonly jobLabel: TMeta['label'];

  abstract readonly schedule: JobSchedule;

  protected resolve!: TResolve;

  init(resolve: TResolve): void {
    this.resolve = resolve;
  }

  /**
   * Один прогон задания.
   */
  abstract execute(): Promise<void>;

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
