import { describe, expect, test } from 'bun:test';
import type { User } from '@u7/user/domain';
import { Role } from '@u7/user/domain';
import { CourseAr } from './a-root';

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

describe('CourseAr.getVisibleFor', () => {
  describe('без актора', () => {
    test('DRAFT — null', () => {
      const ar = CourseAr.create('Курс', 'Описание', 'modules', authorId);
      expect(ar.getVisibleFor()).toBeNull();
    });

    test('PUBLISHED — виден', () => {
      const ar = CourseAr.create('Курс', 'Описание', 'modules', authorId);
      ar.publish();
      expect(ar.getVisibleFor()).not.toBeNull();
      expect(ar.getVisibleFor()?.title).toBe('Курс');
    });
  });

  describe('DRAFT курс', () => {
    test('автор видит курс целиком', () => {
      const ar = CourseAr.create('Курс', 'Описание', 'modules', authorId);
      ar.addModule({
        courseId: 'x',
        title: 'М1',
        goal: undefined,
        result: undefined,
        additional: undefined,
      });
      const modUuid = (ar.state as { modules: { uuid: string }[] }).modules[0]
        ?.uuid as string;
      ar.addProjectToModule(modUuid, {
        courseId: 'x',
        title: 'П1',
        goal: undefined,
        result: undefined,
        additional: undefined,
      });
      ar.publishModule(modUuid);

      const result = ar.getVisibleFor(makeActor([Role.MENTOR], authorId));
      expect(result).not.toBeNull();
      const r = result!;
      if (r.kind === 'modules') {
        expect(r.modules).toHaveLength(1);
        expect(r.modules[0]?.projects).toHaveLength(1);
      }
    });

    test('студент не видит DRAFT', () => {
      const ar = CourseAr.create('Курс', 'Описание', 'modules', authorId);
      expect(ar.getVisibleFor(makeActor([Role.STUDENT], studentId))).toBeNull();
    });
  });

  describe('PUBLISHED курс', () => {
    test('студент видит PUBLISHED модули, DRAFT — нет', () => {
      const ar = CourseAr.create('Курс', 'Описание', 'modules', authorId);
      ar.addModule({
        courseId: 'x',
        title: 'М1',
        goal: undefined,
        result: undefined,
        additional: undefined,
      });
      const modUuid = (ar.state as { modules: { uuid: string }[] }).modules[0]
        ?.uuid as string;
      ar.addProjectToModule(modUuid, {
        courseId: 'x',
        title: 'П1',
        goal: undefined,
        result: undefined,
        additional: undefined,
      });
      ar.publishModule(modUuid);
      ar.publish();

      const result = ar.getVisibleFor(makeActor([Role.STUDENT], studentId));
      expect(result).not.toBeNull();
      const r = result!;
      if (r.kind === 'modules') {
        expect(r.modules).toHaveLength(1);
        expect(r.modules[0]?.projects).toHaveLength(0);
      }
    });

    test('студент видит PUBLISHED модуль с PUBLISHED проектом', () => {
      const ar = CourseAr.create('Курс', 'Описание', 'modules', authorId);
      ar.addModule({
        courseId: 'x',
        title: 'М1',
        goal: undefined,
        result: undefined,
        additional: undefined,
      });
      const modUuid = (ar.state as { modules: { uuid: string }[] }).modules[0]
        ?.uuid as string;
      ar.addProjectToModule(modUuid, {
        courseId: 'x',
        title: 'П1',
        goal: undefined,
        result: undefined,
        additional: undefined,
      });
      const projUuid = (
        ar.state as { modules: { projects: { uuid: string }[] }[] }
      ).modules[0]?.projects[0]?.uuid as string;
      ar.publishProject(projUuid);
      ar.publishModule(modUuid);
      ar.publish();

      const result = ar.getVisibleFor(makeActor([Role.STUDENT], studentId));
      expect(result).not.toBeNull();
      const r = result!;
      if (r.kind === 'modules') {
        expect(r.modules).toHaveLength(1);
        expect(r.modules[0]?.projects).toHaveLength(1);
      }
    });

    test('kind=projects — фильтрует DRAFT проекты', () => {
      const ar = CourseAr.create('Курс', 'Описание', 'projects', authorId);
      ar.addProject({
        courseId: 'x',
        title: 'П1',
        goal: undefined,
        result: undefined,
        additional: undefined,
      });
      ar.addProject({
        courseId: 'x',
        title: 'П2',
        goal: undefined,
        result: undefined,
        additional: undefined,
      });
      const projUuid = (ar.state as { projects: { uuid: string }[] })
        .projects[0]?.uuid as string;
      ar.publishProject(projUuid);
      ar.publish();

      const result = ar.getVisibleFor(makeActor([Role.STUDENT], studentId));
      expect(result).not.toBeNull();
      const r = result!;
      if (r.kind === 'projects') {
        expect(r.projects).toHaveLength(1);
      }
    });
  });
});
