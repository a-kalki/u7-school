import { describe, expect, it } from 'bun:test';
import {
  buildWorldState,
  campaign,
  course,
  deterministicUuid,
  person,
  resolveRelativeTime,
  stream,
  student,
} from './index';

describe('world-kit: каркас и базовые инварианты', () => {
  describe('детерминированные UUID', () => {
    it('UUID стабилен между вызовами для одного ключа', () => {
      const id1 = deterministicUuid('person:andrey');
      const id2 = deterministicUuid('person:andrey');
      expect(id1).toBe(id2);
      // Валидный формат UUID (8-4-4-4-12 hex)
      expect(id1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('разные ключи генерируют разные UUID', () => {
      const id1 = deterministicUuid('person:andrey');
      const id2 = deterministicUuid('person:marina');
      expect(id1).not.toBe(id2);
    });
  });

  describe('относительное время', () => {
    const anchor = new Date('2026-09-23T10:00:00.000Z');

    it('T возвращает опорную дату в формате ISO', () => {
      const result = resolveRelativeTime('T', anchor);
      expect(new Date(result).toISOString()).toBe(anchor.toISOString());
    });

    it('поддерживает T-2d и T-2д (дни назад)', () => {
      const expected = new Date('2026-09-21T10:00:00.000Z').toISOString();
      expect(new Date(resolveRelativeTime('T-2d', anchor)).toISOString()).toBe(
        expected,
      );
      expect(new Date(resolveRelativeTime('T-2д', anchor)).toISOString()).toBe(
        expected,
      );
    });

    it('поддерживает T+5d и T+5д (дни вперёд)', () => {
      const expected = new Date('2026-09-28T10:00:00.000Z').toISOString();
      expect(new Date(resolveRelativeTime('T+5d', anchor)).toISOString()).toBe(
        expected,
      );
      expect(new Date(resolveRelativeTime('T+5д', anchor)).toISOString()).toBe(
        expected,
      );
    });

    it('поддерживает относительные часы и минуты (T-2h / T-30m / русские буквы)', () => {
      const hExpected = new Date('2026-09-23T08:00:00.000Z').toISOString();
      expect(new Date(resolveRelativeTime('T-2h', anchor)).toISOString()).toBe(
        hExpected,
      );
      expect(new Date(resolveRelativeTime('T-2ч', anchor)).toISOString()).toBe(
        hExpected,
      );

      const mExpected = new Date('2026-09-23T09:30:00.000Z').toISOString();
      expect(new Date(resolveRelativeTime('T-30m', anchor)).toISOString()).toBe(
        mExpected,
      );
      expect(new Date(resolveRelativeTime('T-30м', anchor)).toISOString()).toBe(
        mExpected,
      );
    });

    it('абсолютная ISO-дата возвращается как есть', () => {
      const abs = '2026-01-01T00:00:00.000Z';
      expect(resolveRelativeTime(abs, anchor)).toBe(abs);
    });
  });

  describe('конструкторы и сборка WorldState', () => {
    const anchor = new Date('2026-09-23T10:00:00.000Z');

    it('собирает минимальный согласованный WorldState', () => {
      const pMentor = person({
        key: 'mentor',
        name: 'Dev Mentor',
        telegramId: 1004,
        roles: ['MENTOR', 'AUTHOR'],
        registeredAt: 'T-90d',
      });

      const pStudent = person({
        key: 'andrey',
        name: 'Андрей',
        telegramId: 1003,
        roles: ['STUDENT'],
        registeredAt: 'T-60d',
      });

      const cCourse = course({
        key: 'js-core',
        title: 'JavaScript Core',
        description: 'Базовый курс по JS',
        authorKey: 'mentor',
        modules: [
          {
            key: 'm1',
            title: 'Синтаксис',
            description: 'Основы',
            projects: [
              {
                key: 'p1',
                title: 'Введение',
                lessons: [
                  {
                    key: 'l1',
                    title: 'Переменные',
                    steps: [
                      {
                        key: 's1',
                        title: 'Шаг 1: let и const',
                        content: 'Описание переменных',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      const sStream = stream({
        key: 'stream-1',
        title: 'Поток 1',
        description: 'Первый поток',
        courseKey: 'js-core',
        moduleKey: 'm1',
        mentorKey: 'mentor',
        status: 'completed',
        startedAt: 'T-50d',
      });

      const stStudent = student({
        key: 'student-andrey',
        personKey: 'andrey',
        streamKey: 'stream-1',
        enrolledAt: 'T-50d',
        status: 'advanced',
      });

      const cmp = campaign({
        key: 'cmp-andrey',
        context: 'stream_fate',
        streamKey: 'stream-1',
        subjectPersonKey: 'andrey',
        mentorPersonKey: 'mentor',
        subjectOutcome: 'completed_passed',
        createdAt: 'T-2d',
        expiresAt: 'T+5d',
        participants: [],
      });

      const worldState = buildWorldState({
        anchorDate: anchor,
        persons: [pMentor, pStudent],
        courses: [cCourse],
        streams: [sStream],
        students: [stStudent],
        campaigns: [cmp],
      });

      expect(worldState.users.length).toBe(2);
      expect(worldState.streams.length).toBe(1);
      expect(worldState.students.length).toBe(1);
      expect(worldState.courses.length).toBe(1);
      expect(worldState.campaigns.length).toBe(1);

      // Проверяем связи UUID
      expect(worldState.students[0]!.userId).toBe(worldState.users[1]!.uuid);
      expect(worldState.campaigns[0]!.subjectId).toBe(
        worldState.users[1]!.uuid,
      );
    });

    it('сборка падает с ошибкой, если исход кампании противоречит статусу студента', () => {
      const pMentor = person({
        key: 'mentor',
        name: 'Dev Mentor',
        telegramId: 1004,
        roles: ['MENTOR', 'AUTHOR'],
        registeredAt: 'T-90d',
      });

      const pStudent = person({
        key: 'andrey',
        name: 'Андрей',
        telegramId: 1003,
        roles: ['STUDENT'],
        registeredAt: 'T-60d',
      });

      const cCourse = course({
        key: 'js-core',
        title: 'JS Core',
        description: 'Курс',
        authorKey: 'mentor',
      });

      const sStream = stream({
        key: 'stream-1',
        title: 'Поток 1',
        description: 'Описание',
        courseKey: 'js-core',
        mentorKey: 'mentor',
        status: 'active',
        startedAt: 'T-50d',
      });

      // Студент зачислен (enrolled), а кампания утверждает что он completed_passed
      const stStudent = student({
        key: 'student-andrey',
        personKey: 'andrey',
        streamKey: 'stream-1',
        enrolledAt: 'T-50d',
        status: 'enrolled',
      });

      const cmp = campaign({
        key: 'cmp-andrey',
        context: 'stream_fate',
        streamKey: 'stream-1',
        subjectPersonKey: 'andrey',
        mentorPersonKey: 'mentor',
        subjectOutcome: 'completed_passed',
        createdAt: 'T-2d',
        expiresAt: 'T+5d',
        participants: [],
      });

      expect(() =>
        buildWorldState({
          anchorDate: anchor,
          persons: [pMentor, pStudent],
          courses: [cCourse],
          streams: [sStream],
          students: [stStudent],
          campaigns: [cmp],
        }),
      ).toThrow(/судьб|исход|противоречит/i);
    });

    it('сборка падает, если кампания dropped, а студент advanced', () => {
      const pMentor = person({
        key: 'mentor',
        name: 'Dev Mentor',
        telegramId: 1004,
        roles: ['MENTOR', 'AUTHOR'],
        registeredAt: 'T-90d',
      });

      const pStudent = person({
        key: 'andrey',
        name: 'Андрей',
        telegramId: 1003,
        roles: ['STUDENT'],
        registeredAt: 'T-60d',
      });

      const cCourse = course({
        key: 'js-core',
        title: 'JS Core',
        description: 'Курс',
        authorKey: 'mentor',
      });

      const sStream = stream({
        key: 'stream-1',
        title: 'Поток 1',
        description: 'Описание',
        courseKey: 'js-core',
        mentorKey: 'mentor',
        status: 'completed',
        startedAt: 'T-50d',
      });

      const stStudent = student({
        key: 'student-andrey',
        personKey: 'andrey',
        streamKey: 'stream-1',
        enrolledAt: 'T-50d',
        status: 'advanced',
      });

      const cmp = campaign({
        key: 'cmp-andrey',
        context: 'stream_fate',
        streamKey: 'stream-1',
        subjectPersonKey: 'andrey',
        mentorPersonKey: 'mentor',
        subjectOutcome: 'dropped',
        createdAt: 'T-2d',
        expiresAt: 'T+5d',
        participants: [],
      });

      expect(() =>
        buildWorldState({
          anchorDate: anchor,
          persons: [pMentor, pStudent],
          courses: [cCourse],
          streams: [sStream],
          students: [stStudent],
          campaigns: [cmp],
        }),
      ).toThrow(/судьб|исход|противоречит/i);
    });
  });
});
