import { describe, expect, test } from 'bun:test';
import {
  ContentSnapshot,
  ContentSnapshotItem,
  ContentSnapshotItemSchema,
  ContentSnapshotSchema,
  LessonSnapshotSchema,
} from './index';

describe('Экспорт ContentSnapshot из course/domain/index', () => {
  test('ContentSnapshotItemSchema доступна через index', () => {
    expect(ContentSnapshotItemSchema).toBeDefined();
  });

  test('LessonSnapshotSchema доступна через index', () => {
    expect(LessonSnapshotSchema).toBeDefined();
  });

  test('ContentSnapshotSchema доступна через index', () => {
    expect(ContentSnapshotSchema).toBeDefined();
  });

  test('ContentSnapshot и ContentSnapshotItem типы доступны', () => {
    const item: ContentSnapshotItem = {
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      projectTitle: 'Test',
      lessons: [],
    };
    const snapshot: ContentSnapshot = [item];
    expect(snapshot).toHaveLength(1);
  });
});
