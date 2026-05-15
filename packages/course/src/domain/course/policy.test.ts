import { describe, expect, test } from 'bun:test';
import type { User } from '@u7/user/domain';
import { Role } from '@u7/user/domain';
import { Status } from '../status';
import { CoursePolicy } from './policy';

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
  kind: 'modules' as const,
  title: 'Курс',
  description: 'Описание',
  authorId: '550e8400-e29b-41d4-a716-446655440000',
  status: Status.DRAFT,
  createdAt: '2026-05-01T12:00',
  modules: [],
};

describe('CoursePolicy', () => {
  describe('canCreate', () => {
    test('ADMIN не может создавать', () => {
      expect(CoursePolicy.canCreate(makeActor([Role.ADMIN]))).toBe(false);
    });

    test('MENTOR может создавать', () => {
      expect(CoursePolicy.canCreate(makeActor([Role.MENTOR]))).toBe(true);
    });

    test('STUDENT не может создавать', () => {
      expect(CoursePolicy.canCreate(makeActor([Role.STUDENT]))).toBe(false);
    });
  });

  describe('canRead', () => {
    test('студент может читать PUBLISHED курс', () => {
      expect(
        CoursePolicy.canRead(makeActor([Role.STUDENT]), {
          ...course,
          status: Status.PUBLISHED,
        }),
      ).toBe(true);
    });

    test('студент не может читать DRAFT курс', () => {
      expect(CoursePolicy.canRead(makeActor([Role.STUDENT]), course)).toBe(
        false,
      );
    });

    test('автор может читать DRAFT курс', () => {
      expect(
        CoursePolicy.canRead(
          makeActor([Role.MENTOR], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('ADMIN может читать DRAFT курс', () => {
      expect(CoursePolicy.canRead(makeActor([Role.ADMIN]), course)).toBe(true);
    });
  });

  describe('canEdit', () => {
    test('ADMIN может редактировать чужой курс', () => {
      expect(
        CoursePolicy.canEdit(makeActor([Role.ADMIN], 'not-author'), course),
      ).toBe(true);
    });

    test('автор может редактировать', () => {
      expect(
        CoursePolicy.canEdit(
          makeActor([Role.MENTOR], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('не-автор MENTOR не может редактировать', () => {
      expect(
        CoursePolicy.canEdit(makeActor([Role.MENTOR], 'other-uuid'), course),
      ).toBe(false);
    });

    test('STUDENT может редактировать свой курс', () => {
      expect(
        CoursePolicy.canEdit(
          makeActor([Role.STUDENT], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('STUDENT не может редактировать чужой курс', () => {
      expect(
        CoursePolicy.canEdit(makeActor([Role.STUDENT], 'other-uuid'), course),
      ).toBe(false);
    });
  });

  describe('isAuthor', () => {
    test('автор — true', () => {
      expect(
        CoursePolicy.isAuthor(
          makeActor([Role.STUDENT], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('не автор — false', () => {
      expect(
        CoursePolicy.isAuthor(makeActor([Role.ADMIN], 'other-uuid'), course),
      ).toBe(false);
    });
  });

  describe('isAdminOrAuthor', () => {
    test('ADMIN — true', () => {
      expect(
        CoursePolicy.isAdminOrAuthor(
          makeActor([Role.ADMIN], 'other-uuid'),
          course,
        ),
      ).toBe(true);
    });

    test('автор — true', () => {
      expect(
        CoursePolicy.isAdminOrAuthor(
          makeActor([Role.STUDENT], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('не автор и не ADMIN — false', () => {
      expect(
        CoursePolicy.isAdminOrAuthor(
          makeActor([Role.STUDENT], 'other-uuid'),
          course,
        ),
      ).toBe(false);
    });
  });

  describe('canAddModule', () => {
    test('автор может', () => {
      expect(
        CoursePolicy.canAddModule(
          makeActor([Role.MENTOR], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('ADMIN не может (не автор)', () => {
      expect(CoursePolicy.canAddModule(makeActor([Role.ADMIN]), course)).toBe(
        false,
      );
    });

    test('не автор не может', () => {
      expect(
        CoursePolicy.canAddModule(
          makeActor([Role.MENTOR], 'other-uuid'),
          course,
        ),
      ).toBe(false);
    });
  });

  describe('canAddProject', () => {
    test('автор может', () => {
      expect(
        CoursePolicy.canAddProject(
          makeActor([Role.MENTOR], '550e8400-e29b-41d4-a716-446655440000'),
          course,
        ),
      ).toBe(true);
    });

    test('ADMIN не может (не автор)', () => {
      expect(CoursePolicy.canAddProject(makeActor([Role.ADMIN]), course)).toBe(
        false,
      );
    });

    test('не автор не может', () => {
      expect(
        CoursePolicy.canAddProject(
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
  const publishedModule = { ...module, status: Status.PUBLISHED };

  describe('canReadModule', () => {
    test('автор может читать DRAFT модуль', () => {
      expect(
        CoursePolicy.canReadModule(
          makeActor([Role.MENTOR], '550e8400-e29b-41d4-a716-446655440000'),
          course,
          module,
        ),
      ).toBe(true);
    });

    test('ADMIN может читать DRAFT модуль', () => {
      expect(
        CoursePolicy.canReadModule(makeActor([Role.ADMIN]), course, module),
      ).toBe(true);
    });

    test('студент может читать PUBLISHED модуль', () => {
      expect(
        CoursePolicy.canReadModule(
          makeActor([Role.STUDENT]),
          course,
          publishedModule,
        ),
      ).toBe(true);
    });

    test('студент не может читать DRAFT модуль', () => {
      expect(
        CoursePolicy.canReadModule(makeActor([Role.STUDENT]), course, module),
      ).toBe(false);
    });
  });

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
        CoursePolicy.canReadProject(
          makeActor([Role.MENTOR], '550e8400-e29b-41d4-a716-446655440000'),
          course,
          project,
        ),
      ).toBe(true);
    });

    test('студент может читать PUBLISHED проект', () => {
      expect(
        CoursePolicy.canReadProject(
          makeActor([Role.STUDENT]),
          course,
          publishedProject,
        ),
      ).toBe(true);
    });

    test('студент не может читать DRAFT проект', () => {
      expect(
        CoursePolicy.canReadProject(makeActor([Role.STUDENT]), course, project),
      ).toBe(false);
    });
  });
});
