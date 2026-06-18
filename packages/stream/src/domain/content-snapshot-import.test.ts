import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { ContentSnapshotSchema } from './index';

describe('ContentSnapshotSchema в stream domain через index', () => {
  test('схема доступна и валидирует пустой массив', () => {
    expect(() => v.parse(ContentSnapshotSchema, [])).not.toThrow();
  });

  test('схема отклоняет невалидные данные', () => {
    expect(() =>
      v.parse(ContentSnapshotSchema, [
        {
          projectId: 'bad-uuid',
          projectTitle: '',
          lessons: [],
        },
      ]),
    ).toThrow();
  });
});
