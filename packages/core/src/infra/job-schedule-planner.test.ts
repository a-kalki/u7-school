import { describe, expect, test } from 'bun:test';
import type { JobSchedule } from '../api/job/job';
import { JobSchedulePlanner } from './job-schedule-planner';

// ══ Хелперы ══

const planner = new JobSchedulePlanner();

/** ISO-строка из компонентов UTC */
function utc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms));
}

// ══ Тесты ══

describe('JobSchedulePlanner — interval', () => {
  test('без alignUtc: следующий запуск = after + intervalMs', () => {
    const schedule: JobSchedule = { kind: 'interval', intervalMs: 3_600_000 };

    expect(planner.nextRunAfter(schedule, utc(2026, 1, 1, 0, 0))).toEqual(
      utc(2026, 1, 1, 1, 0),
    );
  });

  test('alignUtc: сетка от epoch — after 12:30 при 6ч → 18:00', () => {
    const schedule: JobSchedule = {
      kind: 'interval',
      intervalMs: 6 * 3_600_000,
      alignUtc: true,
    };

    expect(planner.nextRunAfter(schedule, utc(2026, 1, 1, 12, 30))).toEqual(
      utc(2026, 1, 1, 18, 0),
    );
  });

  test('alignUtc: after ровно на сетке → следующий узел сетки', () => {
    const schedule: JobSchedule = {
      kind: 'interval',
      intervalMs: 6 * 3_600_000,
      alignUtc: true,
    };

    expect(planner.nextRunAfter(schedule, utc(2026, 1, 1, 0, 0))).toEqual(
      utc(2026, 1, 1, 6, 0),
    );
  });

  test('alignUtc: сетка переходит через сутки', () => {
    const schedule: JobSchedule = {
      kind: 'interval',
      intervalMs: 6 * 3_600_000,
      alignUtc: true,
    };

    expect(planner.nextRunAfter(schedule, utc(2026, 1, 1, 22, 0))).toEqual(
      utc(2026, 1, 2, 0, 0),
    );
  });
});

describe('JobSchedulePlanner — dailyAt', () => {
  const schedule: JobSchedule = { kind: 'dailyAt', hour: 12, minute: 0 };

  test('время ещё не наступило сегодня → сегодня', () => {
    expect(planner.nextRunAfter(schedule, utc(2026, 1, 10, 10, 0))).toEqual(
      utc(2026, 1, 10, 12, 0),
    );
  });

  test('время уже прошло → завтра', () => {
    expect(planner.nextRunAfter(schedule, utc(2026, 1, 10, 13, 0))).toEqual(
      utc(2026, 1, 11, 12, 0),
    );
  });

  test('ровно в момент запуска → завтра (строго после)', () => {
    expect(planner.nextRunAfter(schedule, utc(2026, 1, 10, 12, 0))).toEqual(
      utc(2026, 1, 11, 12, 0),
    );
  });
});

describe('JobSchedulePlanner — weeklyAt', () => {
  // 2026-01-01 — четверг (getUTCDay() === 4)
  const schedule: JobSchedule = {
    kind: 'weeklyAt',
    weekday: 4,
    hour: 12,
    minute: 0,
  };

  test('тот же день, время впереди → сегодня', () => {
    expect(planner.nextRunAfter(schedule, utc(2026, 1, 1, 10, 0))).toEqual(
      utc(2026, 1, 1, 12, 0),
    );
  });

  test('тот же день, время прошло → через неделю', () => {
    expect(planner.nextRunAfter(schedule, utc(2026, 1, 1, 13, 0))).toEqual(
      utc(2026, 1, 8, 12, 0),
    );
  });

  test('середина недели → ближайший следующий указанный день', () => {
    // суббота 2026-01-03 → четверг 2026-01-08 (weekday 1 = понедельник)
    const monday: JobSchedule = {
      kind: 'weeklyAt',
      weekday: 1,
      hour: 9,
      minute: 30,
    };
    expect(planner.nextRunAfter(monday, utc(2026, 1, 3, 0, 0))).toEqual(
      utc(2026, 1, 5, 9, 30),
    );
  });
});

describe('JobSchedulePlanner — monthlyAt', () => {
  test('день впереди в текущем месяце', () => {
    const schedule: JobSchedule = {
      kind: 'monthlyAt',
      day: 15,
      hour: 12,
      minute: 0,
    };
    expect(planner.nextRunAfter(schedule, utc(2026, 1, 10, 10, 0))).toEqual(
      utc(2026, 1, 15, 12, 0),
    );
  });

  test('день прошёл → следующий месяц', () => {
    const schedule: JobSchedule = {
      kind: 'monthlyAt',
      day: 15,
      hour: 12,
      minute: 0,
    };
    expect(planner.nextRunAfter(schedule, utc(2026, 1, 20, 10, 0))).toEqual(
      utc(2026, 2, 15, 12, 0),
    );
  });

  test('кламп: day 31 в январе — 31 января', () => {
    const schedule: JobSchedule = {
      kind: 'monthlyAt',
      day: 31,
      hour: 12,
      minute: 0,
    };
    expect(planner.nextRunAfter(schedule, utc(2026, 1, 10, 10, 0))).toEqual(
      utc(2026, 1, 31, 12, 0),
    );
  });

  test('кламп: day 31 в феврале (невисокосный) — 28 февраля', () => {
    const schedule: JobSchedule = {
      kind: 'monthlyAt',
      day: 31,
      hour: 12,
      minute: 0,
    };
    expect(planner.nextRunAfter(schedule, utc(2026, 2, 1, 0, 0))).toEqual(
      utc(2026, 2, 28, 12, 0),
    );
  });

  test('високосный год: day 29 в феврале 2028 — 29 февраля', () => {
    const schedule: JobSchedule = {
      kind: 'monthlyAt',
      day: 29,
      hour: 0,
      minute: 0,
    };
    expect(planner.nextRunAfter(schedule, utc(2028, 2, 1, 0, 0))).toEqual(
      utc(2028, 2, 29, 0, 0),
    );
  });

  test('клампнутый день прошёл → кламп следующего месяца', () => {
    // after 31 января 13:00 → февраль: 28 февраля 12:00
    const schedule: JobSchedule = {
      kind: 'monthlyAt',
      day: 31,
      hour: 12,
      minute: 0,
    };
    expect(planner.nextRunAfter(schedule, utc(2026, 1, 31, 13, 0))).toEqual(
      utc(2026, 2, 28, 12, 0),
    );
  });
});
