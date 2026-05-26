import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import { ModuleAr } from './a-root';

function makeActor(roles: Role[], uuid = 'actor-uuid'): User {
  return {
    uuid,
    name: 'Тест',
    telegramId: 1,
    roles,
    createdAt: '2026-05-01T12:00',
  };
}

const authorId = crypto.randomUUID();
const studentId = crypto.randomUUID();

describe('ModuleAr.getVisibleFor', () => {
  describe('без актора', () => {
    test('DRAFT — null', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      expect(ar.getVisibleFor()).toBeNull();
    });

    test('PUBLISHED — виден', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.publish();
      expect(ar.getVisibleFor()).not.toBeNull();
      expect(ar.getVisibleFor()?.title).toBe('Модуль');
    });
  });

  describe('DRAFT модуль', () => {
    test('автор видит модуль целиком', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.addProject({
        moduleId: 'x',
        title: 'П1',
        goal: undefined,
        result: undefined,
        additional: undefined,
      });
      const projUuid = ar.state.projects[0]?.uuid as string;
      ar.publishProject(projUuid);

      const result = ar.getVisibleFor(makeActor([Role.MENTOR], authorId));
      expect(result).not.toBeNull();
      expect(result?.projects).toHaveLength(1);
    });

    test('студент не видит DRAFT', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      expect(ar.getVisibleFor(makeActor([Role.STUDENT], studentId))).toBeNull();
    });
  });

  describe('PUBLISHED модуль', () => {
    test('студент видит PUBLISHED проекты, DRAFT — нет', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.addProject({
        moduleId: 'x',
        title: 'П1',
        goal: undefined,
        result: undefined,
        additional: undefined,
      });
      const projUuid = ar.state.projects[0]?.uuid as string;
      ar.publishProject(projUuid);
      ar.publish();

      const result = ar.getVisibleFor(makeActor([Role.STUDENT], studentId));
      expect(result).not.toBeNull();
      expect(result?.projects).toHaveLength(1);
    });

    test('студент не видит DRAFT проект в PUBLISHED модуле', () => {
      const ar = ModuleAr.create('Модуль', 'Описание', authorId);
      ar.addProject({
        moduleId: 'x',
        title: 'DRAFT проект',
        goal: undefined,
        result: undefined,
        additional: undefined,
      });
      ar.publish();

      const result = ar.getVisibleFor(makeActor([Role.STUDENT], studentId));
      expect(result).not.toBeNull();
      expect(result?.projects).toHaveLength(0);
    });
  });
});
