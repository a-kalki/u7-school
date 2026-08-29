import type { JobSchedule } from '../api/job/job';

/**
 * Календарная математика расписаний: считает момент следующего запуска
 * СТРОГО ПОСЛЕ указанного времени. Все времена — UTC.
 *
 * Чистый объект без побочных эффектов — легко тестируется на фиксированных датах.
 */
export class JobSchedulePlanner {
  /** Ближайший запуск расписания строго после `after`. */
  nextRunAfter(schedule: JobSchedule, after: Date): Date {
    switch (schedule.kind) {
      case 'interval':
        return this.#nextInterval(schedule, after);
      case 'dailyAt':
        return this.#nextDailyAt(schedule, after);
      case 'weeklyAt':
        return this.#nextWeeklyAt(schedule, after);
      case 'monthlyAt':
        return this.#nextMonthlyAt(schedule, after);
    }
  }

  #nextInterval(
    schedule: Extract<JobSchedule, { kind: 'interval' }>,
    after: Date,
  ): Date {
    if (schedule.alignUtc) {
      // Сетка от epoch (UTC-полночь кратно intervalMs): строго следующий узел
      const next = Math.ceil((after.getTime() + 1) / schedule.intervalMs);
      return new Date(next * schedule.intervalMs);
    }
    return new Date(after.getTime() + schedule.intervalMs);
  }

  #nextDailyAt(
    schedule: Extract<JobSchedule, { kind: 'dailyAt' }>,
    after: Date,
  ): Date {
    let candidate = Date.UTC(
      after.getUTCFullYear(),
      after.getUTCMonth(),
      after.getUTCDate(),
      schedule.hour,
      schedule.minute,
    );
    if (candidate <= after.getTime()) {
      candidate += 24 * 3_600_000;
    }
    return new Date(candidate);
  }

  #nextWeeklyAt(
    schedule: Extract<JobSchedule, { kind: 'weeklyAt' }>,
    after: Date,
  ): Date {
    const daysAhead = (schedule.weekday - after.getUTCDay() + 7) % 7;
    let candidate = Date.UTC(
      after.getUTCFullYear(),
      after.getUTCMonth(),
      after.getUTCDate() + daysAhead,
      schedule.hour,
      schedule.minute,
    );
    if (candidate <= after.getTime()) {
      candidate += 7 * 24 * 3_600_000;
    }
    return new Date(candidate);
  }

  #nextMonthlyAt(
    schedule: Extract<JobSchedule, { kind: 'monthlyAt' }>,
    after: Date,
  ): Date {
    const year = after.getUTCFullYear();
    const month = after.getUTCMonth();
    let candidate = Date.UTC(
      year,
      month,
      this.#clampDay(year, month, schedule.day),
      schedule.hour,
      schedule.minute,
    );
    if (candidate <= after.getTime()) {
      // Следующий месяц (Date.UTC нормализует декабрь → январь следующего года)
      const nextYear = month === 11 ? year + 1 : year;
      const nextMonth = (month + 1) % 12;
      candidate = Date.UTC(
        nextYear,
        nextMonth,
        this.#clampDay(nextYear, nextMonth, schedule.day),
        schedule.hour,
        schedule.minute,
      );
    }
    return new Date(candidate);
  }

  /** День месяца, клампнутый на последний день месяца (семантика cron). */
  #clampDay(year: number, month: number, day: number): number {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return Math.min(day, lastDay);
  }
}
