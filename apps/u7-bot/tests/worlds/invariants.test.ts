import { describe, expect, it } from 'bun:test';
import {
  buildWorldState,
  campaign,
  course,
  person,
  stream,
  student,
} from './index';

describe('world-kit: инварианты роли/статуса и хронологии', () => {
  const anchor = new Date('2026-09-23T10:00:00.000Z');

  function createValidBase() {
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
      modules: [
        {
          key: 'm1',
          title: 'Синтаксис',
          projects: [
            {
              key: 'p1',
              title: 'Проект 1',
              lessons: [
                {
                  key: 'l1',
                  title: 'Урок 1',
                  steps: [{ key: 's1', title: 'Шаг 1' }],
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
      description: 'Описание',
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

    return { pMentor, pStudent, cCourse, sStream, stStudent, cmp };
  }

  describe('инвариант роли пользователя', () => {
    it('сборка падает, если студент в активном потоке не имеет роли STUDENT', () => {
      const base = createValidBase();
      // Пользователь Андрей имеет только роль GUEST, но числится активным студентом
      const pStudentGuest = person({
        key: 'andrey',
        name: 'Андрей',
        telegramId: 1003,
        roles: ['GUEST'],
        registeredAt: 'T-60d',
      });
      const stStudentActive = student({
        key: 'student-andrey',
        personKey: 'andrey',
        streamKey: 'stream-1',
        enrolledAt: 'T-50d',
        status: 'active',
      });

      expect(() =>
        buildWorldState({
          anchorDate: anchor,
          persons: [base.pMentor, pStudentGuest],
          courses: [base.cCourse],
          streams: [base.sStream],
          students: [stStudentActive],
        }),
      ).toThrow(/рол.*STUDENT|учится в потоке/iu);
    });

    it('сборка падает, если ментор потока не имеет роли MENTOR', () => {
      const base = createValidBase();
      const pMentorNoRole = person({
        key: 'mentor',
        name: 'Dev Mentor',
        telegramId: 1004,
        roles: ['AUTHOR'], // Нет роли MENTOR
        registeredAt: 'T-90d',
      });

      expect(() =>
        buildWorldState({
          anchorDate: anchor,
          persons: [pMentorNoRole, base.pStudent],
          courses: [base.cCourse],
          streams: [base.sStream],
          students: [base.stStudent],
          campaigns: [base.cmp],
        }),
      ).toThrow(/ментор.*рол.*MENTOR/iu);
    });
  });

  describe('инвариант хронологии: регистрация <= зачисление <= исход', () => {
    it('сборка падает, если регистрация студента позже зачисления в поток', () => {
      const base = createValidBase();
      // Зарегистрировался в T-20d, но зачислен в T-50d
      const pStudentLate = person({
        key: 'andrey',
        name: 'Андрей',
        telegramId: 1003,
        roles: ['STUDENT'],
        registeredAt: 'T-20d',
      });

      expect(() =>
        buildWorldState({
          anchorDate: anchor,
          persons: [base.pMentor, pStudentLate],
          courses: [base.cCourse],
          streams: [base.sStream],
          students: [base.stStudent],
          campaigns: [base.cmp],
        }),
      ).toThrow(/регистраци.*позже.*зачислени/iu);
    });

    it('сборка падает, если регистрация студента позже старта потока, в котором он уже учится', () => {
      const base = createValidBase();
      // Поток стартовал в T-50d, студент зачислен в T-30d, но зарегистрировался в T-20d (позже старта)
      const stMid = student({
        key: 'student-andrey',
        personKey: 'andrey',
        streamKey: 'stream-1',
        enrolledAt: 'T-20d',
        status: 'advanced',
      });
      const pStudentLate = person({
        key: 'andrey',
        name: 'Андрей',
        telegramId: 1003,
        roles: ['STUDENT'],
        registeredAt: 'T-10d',
      });

      expect(() =>
        buildWorldState({
          anchorDate: anchor,
          persons: [base.pMentor, pStudentLate],
          courses: [base.cCourse],
          streams: [base.sStream],
          students: [stMid],
          campaigns: [base.cmp],
        }),
      ).toThrow(/регистраци.*позже/iu);
    });
  });

  describe('инвариант согласованности окна кампании с исходом', () => {
    it('сборка падает, если окно кампании открыто ДО зачисления/исхода студента', () => {
      const base = createValidBase();
      // Студент зачислен в T-50d, а кампания открыта в T-60d (до его появления в потоке)
      const cmpTooEarly = campaign({
        key: 'cmp-andrey',
        context: 'stream_fate',
        streamKey: 'stream-1',
        subjectPersonKey: 'andrey',
        mentorPersonKey: 'mentor',
        subjectOutcome: 'completed_passed',
        createdAt: 'T-60d',
        expiresAt: 'T-50d',
        participants: [],
      });

      expect(() =>
        buildWorldState({
          anchorDate: anchor,
          persons: [base.pMentor, base.pStudent],
          courses: [base.cCourse],
          streams: [base.sStream],
          students: [base.stStudent],
          campaigns: [cmpTooEarly],
        }),
      ).toThrow(/окно кампании.*раньше|создан.*раньше/iu);
    });

    it('сборка падает, если дата закрытия окна кампании expiresAt <= createdAt', () => {
      const base = createValidBase();
      const cmpInvalidDates = campaign({
        key: 'cmp-andrey',
        context: 'stream_fate',
        streamKey: 'stream-1',
        subjectPersonKey: 'andrey',
        mentorPersonKey: 'mentor',
        subjectOutcome: 'completed_passed',
        createdAt: 'T-2d',
        expiresAt: 'T-5d', // Закрывается раньше создания
        participants: [],
      });

      expect(() =>
        buildWorldState({
          anchorDate: anchor,
          persons: [base.pMentor, base.pStudent],
          courses: [base.cCourse],
          streams: [base.sStream],
          students: [base.stStudent],
          campaigns: [cmpInvalidDates],
        }),
      ).toThrow(/окно кампании.*закрытия.*создания|expiresAt/iu);
    });
  });
});
