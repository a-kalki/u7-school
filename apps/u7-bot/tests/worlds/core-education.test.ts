import { describe, expect, it } from 'bun:test';
import { buildWorldState } from './builder';
import { CORE_EDUCATION_WORLD } from './core-education';
import { checkWorldInvariants } from './invariants';

describe('Мир core-education', () => {
  it('успешно собирается через buildWorldState и проходит все инварианты', () => {
    const state = buildWorldState(CORE_EDUCATION_WORLD);
    const violations = checkWorldInvariants(state);
    expect(violations).toEqual([]);
  });

  it('содержит 3 курса с качественным контентом', () => {
    const state = buildWorldState(CORE_EDUCATION_WORLD);
    expect(state.courses.length).toBeGreaterThanOrEqual(3);

    for (const course of state.courses) {
      expect(course.title.trim().length).toBeGreaterThan(3);
      expect(course.description.trim().length).toBeGreaterThan(10);
      expect(course.description).not.toContain('lorem');
      expect(course.description).not.toContain('Lorem');
    }

    // Проверка уроков и шагов на продуктовое качество (ФР-9)
    expect(state.lessons.length).toBeGreaterThan(0);
    for (const lesson of state.lessons) {
      expect(lesson.title).not.toMatch(/^Урок \d+$/);
      expect(lesson.title.trim().length).toBeGreaterThan(3);
    }

    expect(state.steps.length).toBeGreaterThan(0);
    for (const step of state.steps) {
      expect(step.description.trim().length).toBeGreaterThan(15);
      expect(step.description).not.toContain('lorem');
      expect(step.description).not.toContain('Lorem');
      const theory = (step as { theoryUrl?: string }).theoryUrl;
      if (theory) {
        expect(theory).toMatch(/^https:\/\//);
      }
    }
  });

  it('содержит 3 потока с заданным составом и статусами', () => {
    const state = buildWorldState(CORE_EDUCATION_WORLD);

    // Поток 1 — завершён
    const completedStream = state.streams.find((s) => s.status === 'completed');
    expect(completedStream).toBeDefined();

    // Поток 2 — активный
    const activeStream = state.streams.find((s) => s.status === 'active');
    expect(activeStream).toBeDefined();

    // Поток 3 — в приёме без студентов
    const enrollmentStream = state.streams.find(
      (s) => s.status === 'enrollment',
    );
    expect(enrollmentStream).toBeDefined();

    const enrollmentStudents = state.students.filter(
      (st) => st.streamId === enrollmentStream?.uuid,
    );
    expect(enrollmentStudents.length).toBe(0);
  });

  it('поток 1 содержит студента "прошёл" с живой кампанией и 1 отзывом, и студента "забросил" с истекшей кампанией', () => {
    const state = buildWorldState(CORE_EDUCATION_WORLD);
    const completedStream = state.streams.find((s) => s.status === 'completed');
    expect(completedStream).toBeDefined();

    const stream1Students = state.students.filter(
      (st) => st.streamId === completedStream?.uuid,
    );
    expect(stream1Students.length).toBe(2);

    const passedStudent = stream1Students.find(
      (st) => st.status === 'advanced',
    );
    expect(passedStudent).toBeDefined();

    const droppedStudent = stream1Students.find(
      (st) => st.status === 'abandoned',
    );
    expect(droppedStudent).toBeDefined();

    // Живая кампания для прошедшего студента
    const liveCampaign = state.campaigns.find(
      (c) =>
        c.subjectId === passedStudent?.userId &&
        c.payload.subjectOutcome === 'completed_passed',
    );
    expect(liveCampaign).toBeDefined();
    const liveExpiresAt = new Date(liveCampaign!.expiresAt).getTime();
    const anchorTime = (
      CORE_EDUCATION_WORLD.anchorDate ?? new Date()
    ).getTime();
    expect(liveExpiresAt).toBeGreaterThan(anchorTime);

    // 1 написанный отзыв в живой кампании
    const reviewsInLiveCampaign = state.reviews.filter(
      (r) => r.campaignId === liveCampaign?.uuid,
    );
    expect(reviewsInLiveCampaign.length).toBe(1);
    const firstReview = reviewsInLiveCampaign[0];
    expect(firstReview).toBeDefined();
    expect(firstReview?.direction).toBe('student_mentor');
    expect(firstReview?.text.length).toBeGreaterThan(20);

    // Истёкшая кампания для забросившего студента
    const expiredCampaign = state.campaigns.find(
      (c) =>
        c.subjectId === droppedStudent?.userId &&
        c.payload.subjectOutcome === 'dropped',
    );
    expect(expiredCampaign).toBeDefined();
    const expiredTime = new Date(expiredCampaign!.expiresAt).getTime();
    expect(expiredTime).toBeLessThanOrEqual(anchorTime);
  });

  it('поток 2 содержит студентов Андрей, Марина, Олег', () => {
    const state = buildWorldState(CORE_EDUCATION_WORLD);
    const activeStream = state.streams.find((s) => s.status === 'active');
    expect(activeStream).toBeDefined();

    const stream2Students = state.students.filter(
      (st) => st.streamId === activeStream?.uuid,
    );
    expect(stream2Students.length).toBe(3);

    const studentUserIds = stream2Students.map((s) => s.userId);
    const users = state.users.filter((u) => studentUserIds.includes(u.uuid));
    const names = users.map((u) => u.name);

    expect(names).toContain('Андрей');
    expect(names).toContain('Марина');
    expect(names).toContain('Олег');
  });
});
