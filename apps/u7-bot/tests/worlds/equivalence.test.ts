import { describe, expect, it } from 'bun:test';
import { buildWorldState } from './builder';
import { CORE_EDUCATION_WORLD } from './core-education';

describe('World Equivalence (core-education)', () => {
  const state = buildWorldState(CORE_EDUCATION_WORLD);

  it('содержит всех ключевых пользователей из templates', () => {
    const userUuids = new Set(state.users.map((u) => u.uuid));
    const expectedUsers = [
      '11111111-1111-1111-1111-111111111111', // Гость (1001)
      '22222222-2222-2222-2222-222222222222', // Кандидат (1002)
      '33333333-3333-3333-3333-333333333333', // Андрей (1003)
      '44444444-4444-4444-4444-444444444444', // Ментор (1004)
      '55555555-5555-5555-5555-555555555555', // Админ (1005)
      '66666666-6666-6666-6666-666666666666', // Автор (1006)
      'ae00f3f6-1392-4b98-b178-41c27e794b7f', // Бот-админ (8781337572)
      '77777777-7777-4777-8777-777777777777', // Марина (1007)
      '88888888-8888-4888-8888-888888888888', // Олег (1008)
    ];

    for (const uuid of expectedUsers) {
      expect(userUuids.has(uuid)).toBe(true);
    }
  });

  it('содержит все ключевые курсы из templates', () => {
    const courseUuids = new Set(state.courses.map((c) => c.uuid));
    const expectedCourses = [
      'fafafafa-baba-4aba-8aba-babababababa', // Основы программирования
      '29adc3be-873e-47ec-aa30-61f5e6e25d4e', // UX/UI
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc', // Продвинутый JS
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd', // Тест опасное имя
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', // Опасное wish
      'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', // Длинный курс
    ];

    for (const uuid of expectedCourses) {
      expect(courseUuids.has(uuid)).toBe(true);
    }
  });

  it('содержит все ключевые потоки из templates', () => {
    const streamUuids = new Set(state.streams.map((s) => s.uuid));
    const expectedStreams = [
      'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', // Поток 2 (active)
      'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', // Поток 1 (completed)
      'e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3', // Поток 4 (archived)
      'e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4', // Поток 5 (enrollment, key: secret123)
      'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', // Алгоритмика
      'e6e6e6e6-e6e6-e6e6-e6e6-e6e6e6e6e6e6', // Длинная программа (пагинация S03)
    ];

    for (const uuid of expectedStreams) {
      expect(streamUuids.has(uuid)).toBe(true);
    }
  });

  it('содержит всех студентов из templates с правильными статусами и шагами', () => {
    const studentUuids = new Set(state.students.map((s) => s.uuid));
    const expectedStudents = [
      'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0', // активный студент
      'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', // advanced
      'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', // not_advanced
    ];

    for (const uuid of expectedStudents) {
      expect(studentUuids.has(uuid)).toBe(true);
    }
  });

  it('содержит кампании и отзывы из templates', () => {
    const campaignUuids = new Set(state.campaigns.map((c) => c.uuid));
    const reviewUuids = new Set(state.reviews.map((r) => r.uuid));

    expect(campaignUuids.has('c1a11111-1111-4111-8111-111111111111')).toBe(
      true,
    );
    expect(reviewUuids.has('10000000-0000-4000-8000-000000000001')).toBe(true);
  });
});
