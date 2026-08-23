import { describe, expect, test } from 'bun:test';
import { LearningController } from './controller';

describe('LearningController', () => {
  test('имя контроллера — learning', () => {
    const ctrl = new LearningController();
    expect(ctrl.name).toBe('learning');
  });

  test('содержит 4 стори', () => {
    const ctrl = new LearningController();
    const stories = ctrl.getStories();
    expect(stories.length).toBe(4);
  });

  test('стори имеют уникальные имена', () => {
    const ctrl = new LearningController();
    const stories = ctrl.getStories();
    const names = stories.map((s) => s.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  test('все ожидаемые имена стори присутствуют', () => {
    const ctrl = new LearningController();
    const stories = ctrl.getStories();
    const names = stories.map((s) => s.name);
    expect(names).toContain('hub');
    expect(names).toContain('step-view');
    expect(names).toContain('nav-tree');
    expect(names).toContain('progress');
  });
});
