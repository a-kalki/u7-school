import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import { Status } from '../status';
import { ModulePolicy } from './policy';

function makeActor(roles: Role[], uuid = 'actor-uuid'): User {
  return {
    uuid,
    name: 'Тест',
    telegramId: 1,
    roles,
    createdAt: '2026-05-01T12:00',
  };
}

const course = {
  uuid: 'course-uuid',
  title: 'Курс',
  description: 'Описание',
  authorId: '550e8400-e29b-41d4-a716-446655440000',
  status: Status.DRAFT,
  createdAt: '2026-05-01T12:00',
  projects: [],
};

describe('ModulePolicy', () => {
  describe('canCreate', () => {
    test('ADMIN не может создавать', () => {
      expect(ModulePolicy.canCreate(makeActor([Role.ADMIN]))).toBe(false);
    });

    test('MENTOR может создавать', () => {
      expect(ModulePolicy.canCreate(makeActor([Role.MENTOR]))).toBe(true);
    });

    test('STUDENT не может создавать', () => {
      expect(ModulePolicy.canCreate(makeActor([Role.STUDENT]))).toBe(false);
    });
  });

  describe('canRead', () => {
    test('студент может читать PUBLISHED курс', () => {
      expect(
        ModulePolicy.canRead(makeActor([Role.STUDENT]), {
          ...course,
          status: Status.PUBLISHED,
        }),
      ).toBe(true);
    });

    test('студент не может читать DRAFT курс', () => {
      expect(ModulePolicy.canRead(makeActor([Role.STUDENT]), course)).toBe(
        false,
      );
    });

    test('автор может читать DRAFT курс', () => {
      expect(
        ModulePolicy.canRead(
          makeActor([Role.MENTOR], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('ADMIN может читать DRAFT курс', () => {
      expect(ModulePolicy.canRead(makeActor([Role.ADMIN]), course)).toBe(true);
    });
  });

  describe('canEdit', () => {
    test('ADMIN может редактировать чужой курс', () => {
      expect(
        ModulePolicy.canEdit(makeActor([Role.ADMIN], 'not-author'), course),
      ).toBe(true);
    });

    test('автор может редактировать', () => {
      expect(
        ModulePolicy.canEdit(
          makeActor([Role.MENTOR], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('не-автор MENTOR не может редактировать', () => {
      expect(
        ModulePolicy.canEdit(makeActor([Role.MENTOR], 'other-uuid'), course),
      ).toBe(false);
    });

    test('STUDENT может редактировать свой курс', () => {
      expect(
        ModulePolicy.canEdit(
          makeActor([Role.STUDENT], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('STUDENT не может редактировать чужой курс', () => {
      expect(
        ModulePolicy.canEdit(makeActor([Role.STUDENT], 'other-uuid'), course),
      ).toBe(false);
    });
  });

  describe('isAuthor', () => {
    test('автор — true', () => {
      expect(
        ModulePolicy.isAuthor(
          makeActor([Role.STUDENT], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('не автор — false', () => {
      expect(
        ModulePolicy.isAuthor(makeActor([Role.ADMIN], 'other-uuid'), course),
      ).toBe(false);
    });
  });

  describe('isAdminOrAuthor', () => {
    test('ADMIN — true', () => {
      expect(
        ModulePolicy.isAdminOrAuthor(
          makeActor([Role.ADMIN], 'other-uuid'),
          course,
        ),
      ).toBe(true);
    });

    test('автор — true', () => {
      expect(
        ModulePolicy.isAdminOrAuthor(
          makeActor([Role.STUDENT], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('не автор и не ADMIN — false', () => {
      expect(
        ModulePolicy.isAdminOrAuthor(
          makeActor([Role.STUDENT], 'other-uuid'),
          course,
        ),
      ).toBe(false);
    });
  });

  describe('canAddProject', () => {
    test('автор может', () => {
      expect(
        ModulePolicy.canAddProject(
          makeActor([Role.MENTOR], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('ADMIN не может (не автор)', () => {
      expect(ModulePolicy.canAddProject(makeActor([Role.ADMIN]), course)).toBe(
        false,
      );
    });

    test('не автор не может', () => {
      expect(
        ModulePolicy.canAddProject(
          makeActor([Role.MENTOR], 'other-uuid'),
          course,
        ),
      ).toBe(false);
    });
  });

  const module = {
    uuid: 'm-uuid',
    title: 'М',
    status: Status.DRAFT,
    createdAt: '2026-05-01T12:00',
    projects: [],
  };
  const _publishedModule = { ...module, status: Status.PUBLISHED };

  const project = {
    uuid: 'p-uuid',
    title: 'П',
    status: Status.DRAFT,
    createdAt: '2026-05-01T12:00',
    lessonIds: [],
  };
  const publishedProject = { ...project, status: Status.PUBLISHED };

  describe('canReadProject', () => {
    test('автор может читать DRAFT проект', () => {
      expect(
        ModulePolicy.canReadProject(
          makeActor([Role.MENTOR], '550e8400-e29b-41d4-a716-446655440000'),
          course,
          project,
        ),
      ).toBe(true);
    });

    test('студент может читать PUBLISHED проект', () => {
      expect(
        ModulePolicy.canReadProject(
          makeActor([Role.STUDENT]),
          course,
          publishedProject,
        ),
      ).toBe(true);
    });

    test('студент не может читать DRAFT проект', () => {
      expect(
        ModulePolicy.canReadProject(makeActor([Role.STUDENT]), course, project),
      ).toBe(false);
    });
  });
});
