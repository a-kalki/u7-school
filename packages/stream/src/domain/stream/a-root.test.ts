import { describe, expect, test } from 'bun:test';
import { StreamStatus } from '../status';
import { StreamAr } from './a-root';
import type { ContentSnapshot } from './entity';

const validContentSnapshot: ContentSnapshot = [
  {
    projectId: '11111111-1111-4111-8111-111111111111',
    projectTitle: 'Введение',
    lessons: [
      {
        lessonId: '22222222-2222-4222-8222-222222222222',
        lessonTitle: 'Урок 1',
        stepIds: [
          '33333333-3333-4333-8333-333333333333',
          '44444444-4444-4444-8444-444444444444',
        ],
      },
    ],
  },
];

const mockCreateCmd = {
  title: 'Поток JS-1',
  description: 'Основной поток курса JavaScript',
  mentorId: '660e8400-e29b-41d4-a716-446655440002',
  moduleId: '770e8400-e29b-41d4-a716-446655440003',
  startDate: '2026-06-01T12:00',
  telegramGroupId: '-100123456789',
  goal: 'Цель обучения',
  result: 'Результат обучения',
  rules: 'Правила прохождения',
  additional: 'Дополнительные материалы',
  targetAudience: 'Целевая аудитория',
};

describe('StreamAr', () => {
  describe('create', () => {
    test('создаёт поток с корректными полями, статусом enrollment и опциональным telegramGroupId', () => {
      const ar = StreamAr.create(mockCreateCmd, validContentSnapshot);

      expect(ar.state.title).toBe(mockCreateCmd.title);
      expect(ar.state.description).toBe(mockCreateCmd.description);
      expect(ar.state.mentorId).toBe(mockCreateCmd.mentorId);
      expect(ar.state.moduleId).toBe(mockCreateCmd.moduleId);
      expect(ar.state.startDate).toBe(mockCreateCmd.startDate);
      expect(ar.state.telegramGroupId).toBe(mockCreateCmd.telegramGroupId);
      expect(ar.state.status).toBe(StreamStatus.ENROLLMENT);
      expect(ar.state.uuid).toMatch(
        /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      );
      expect(ar.state.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
      expect(ar.state.updatedAt).toBeUndefined();
    });

    test('contentSnapshot сохраняется корректно', () => {
      const ar = StreamAr.create(mockCreateCmd, validContentSnapshot);
      expect(ar.state.contentSnapshot).toEqual(validContentSnapshot);
    });

    test('поля-снимки копируются', () => {
      const ar = StreamAr.create(mockCreateCmd, validContentSnapshot);
      expect(ar.state.goal).toBe(mockCreateCmd.goal);
      expect(ar.state.result).toBe(mockCreateCmd.result);
      expect(ar.state.rules).toBe(mockCreateCmd.rules);
      expect(ar.state.additional).toBe(mockCreateCmd.additional);
      expect(ar.state.targetAudience).toBe(mockCreateCmd.targetAudience);
    });
  });

  describe('управление статусом', () => {
    test('activate() переводит поток из enrollment в active', () => {
      const ar = StreamAr.create(mockCreateCmd, validContentSnapshot);
      expect(ar.state.status).toBe(StreamStatus.ENROLLMENT);

      ar.activate();
      expect(ar.state.status).toBe(StreamStatus.ACTIVE);
      expect(ar.state.updatedAt).toBeDefined();
    });

    test('activate() из некорректных статусов выбрасывает ошибку', () => {
      const ar = StreamAr.create(mockCreateCmd, validContentSnapshot);
      ar.activate(); // теперь active

      expect(() => ar.activate()).toThrow();
    });

    test('complete() переводит поток в completed', () => {
      const ar = StreamAr.create(mockCreateCmd, validContentSnapshot);
      ar.activate(); // переводим в active
      expect(ar.state.status).toBe(StreamStatus.ACTIVE);

      ar.complete();
      expect(ar.state.status).toBe(StreamStatus.COMPLETED);
    });

    test('complete() из некорректных статусов выбрасывает ошибку', () => {
      const ar = StreamAr.create(mockCreateCmd, validContentSnapshot);
      // статус ENROLLMENT, а не ACTIVE
      expect(() => ar.complete()).toThrow();
    });

    test('archive() переводит поток в archived из enrollment', () => {
      const ar = StreamAr.create(mockCreateCmd, validContentSnapshot);
      ar.archive();
      expect(ar.state.status).toBe(StreamStatus.ARCHIVED);
    });

    test('archive() переводит поток в archived из active', () => {
      const ar = StreamAr.create(mockCreateCmd, validContentSnapshot);
      ar.activate();
      ar.archive();
      expect(ar.state.status).toBe(StreamStatus.ARCHIVED);
    });

    test('archive() переводит поток в archived из completed', () => {
      const ar = StreamAr.create(mockCreateCmd, validContentSnapshot);
      ar.activate();
      ar.complete();
      ar.archive();
      expect(ar.state.status).toBe(StreamStatus.ARCHIVED);
    });

    test('archive() из archived выбрасывает ошибку', () => {
      const ar = StreamAr.create(mockCreateCmd, validContentSnapshot);
      ar.archive();
      expect(() => ar.archive()).toThrow();
    });
  });

  describe('findNextStep', () => {
    const complexSnapshot: ContentSnapshot = [
      {
        projectId: '11111111-1111-4111-8111-111111111111',
        projectTitle: 'Проект 1',
        lessons: [
          {
            lessonId: '11111111-1111-4222-8222-111111111111',
            lessonTitle: 'Урок 1.1',
            stepIds: [
              '11111111-1111-4333-8333-111111111111',
              '22222222-2222-4333-8333-222222222222',
            ],
          },
          {
            lessonId: '22222222-2222-4222-8222-222222222222',
            lessonTitle: 'Урок 1.2',
            stepIds: ['33333333-3333-4333-8333-333333333333'],
          },
        ],
      },
      {
        projectId: '22222222-2222-4111-8111-222222222222',
        projectTitle: 'Проект 2',
        lessons: [
          {
            lessonId: '33333333-3333-4222-8222-333333333333',
            lessonTitle: 'Урок 2.1',
            stepIds: ['44444444-4444-4444-8444-444444444444'],
          },
        ],
      },
    ];

    const s1 = '11111111-1111-4333-8333-111111111111';
    const s2 = '22222222-2222-4333-8333-222222222222';
    const s3 = '33333333-3333-4333-8333-333333333333';
    const s4 = '44444444-4444-4444-8444-444444444444';
    const sUnknown = '99999999-9999-4999-8999-999999999999';

    test('находит следующий шаг в том же уроке', () => {
      const ar = StreamAr.create(mockCreateCmd, complexSnapshot);
      expect(ar.findNextStep(s1)).toBe(s2);
    });

    test('переходит к первому шагу следующего урока в том же проекте', () => {
      const ar = StreamAr.create(mockCreateCmd, complexSnapshot);
      expect(ar.findNextStep(s2)).toBe(s3);
    });

    test('переходит к первому шагу следующего проекта', () => {
      const ar = StreamAr.create(mockCreateCmd, complexSnapshot);
      expect(ar.findNextStep(s3)).toBe(s4);
    });

    test('возвращает null на последнем шаге всего потока', () => {
      const ar = StreamAr.create(mockCreateCmd, complexSnapshot);
      expect(ar.findNextStep(s4)).toBeNull();
    });

    test('выбрасывает ошибку если stepId не найден в снимке', () => {
      const ar = StreamAr.create(mockCreateCmd, complexSnapshot);
      expect(() => ar.findNextStep(sUnknown)).toThrow(
        'Шаг не найден в структуре потока',
      );
    });
  });
});
