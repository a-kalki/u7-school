import { afterAll, describe, expect, mock, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { AppResolver } from '@u7-scl/core/domain';
import type { User, UserFacade } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import { Status } from '#domain/status';
import { LessonJsonRepo } from '#infra/db/lesson-json-repo';
import { ModuleJsonRepo } from '#infra/db/module-json-repo';
import { StepJsonRepo } from '#infra/db/step-json-repo';
import { CourseApiModule } from './module';

const tmpDir = mkdtempSync('/tmp/course-api-module-test-');
const appResolver = {
  logger: console,
  mode: 'test' as const,
} as unknown as AppResolver;

/** In-memory заглушка фасада пользователей для тестов */
class MockUserFacade implements UserFacade {
  private users = new Map<string, User>();

  addUser(user: User): void {
    this.users.set(user.uuid, user);
  }

  async getUserByUuid(uuid: string): Promise<User | undefined> {
    return this.users.get(uuid);
  }

  async userExists(uuid: string): Promise<boolean> {
    return this.users.has(uuid);
  }

  async getUserByTelegramId(_telegramId: number): Promise<User | undefined> {
    return undefined;
  }

  async registerGuest(_telegramId: number, _name: string): Promise<User> {
    throw new Error('Not implemented in mock');
  }

  async addRoleToUser(
    _uuid: string,
    _role: Role,
    _actorId?: string,
  ): Promise<void> {
    // ok
  }

  async updateUserRole(
    _userId: string,
    _role: Role,
    _actorId?: string,
  ): Promise<void> {
    // ok
  }

  async removeRoleFromUser(
    _userId: string,
    _role: Role,
    _actorId?: string,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

function makeAdmin(): User {
  return {
    uuid: crypto.randomUUID(),
    name: 'Админ',
    telegramId: 1,
    roles: [Role.ADMIN],
    createdAt: '2026-05-01T12:00',
  };
}

function makeAuthor(): User {
  return {
    uuid: crypto.randomUUID(),
    name: 'Автор',
    telegramId: 2,
    roles: [Role.AUTHOR],
    createdAt: '2026-05-01T12:00',
  };
}

let seq = 0;
function nextPath(prefix: string): string {
  return join(tmpDir, `${prefix}-${seq++}.json`);
}

function setupModule(facade: MockUserFacade) {
  return new CourseApiModule({
    moduleRepo: new ModuleJsonRepo(nextPath('courses')),
    courseRepo: {
      save: mock(async () => {}),
      getByUuid: mock(async () => undefined),
      getAll: mock(async () => []),
    },
    courseFacade: {
      getModuleSnapshot: mock(async () => []) as never,
      getStep: mock(async () => ({})) as never,
      getCourseProgram: mock(async () => ({})) as never,
    },
    lessonRepo: new LessonJsonRepo(nextPath('lessons')),
    stepRepo: new StepJsonRepo(nextPath('steps')),
    userFacade: facade,
    appResolver,
  });
}

async function createModuleAsAuthor(
  mod: CourseApiModule,
  author: User,
): Promise<string> {
  const result = await mod.execute(
    'create-module',
    { title: 'Модуль', description: 'Описание' },
    author.uuid,
  );
  return (result as { uuid: string }).uuid;
}

describe('CourseApiModule', () => {
  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('create-module: AUTHOR создаёт модуль', async () => {
    const facade = new MockUserFacade();
    const author = makeAuthor();
    facade.addUser(author);

    const mod = setupModule(facade);
    const result = await mod.execute(
      'create-module',
      { title: 'Курс JS', description: 'Описание' },
      author.uuid,
    );

    expect((result as { title: string }).title).toBe('Курс JS');
  });

  test('create-module: ADMIN не может создать модуль', async () => {
    const facade = new MockUserFacade();
    const admin = makeAdmin();
    facade.addUser(admin);

    const mod = setupModule(facade);

    await expect(
      mod.execute(
        'create-module',
        { title: 'X', description: 'X' },
        admin.uuid,
      ),
    ).rejects.toThrow('Недостаточно прав для создания модуля');
  });

  test('enrich-module: ADMIN обогащает модуль автора', async () => {
    const facade = new MockUserFacade();
    const author = makeAuthor();
    const admin = makeAdmin();
    facade.addUser(author);
    facade.addUser(admin);

    const mod = setupModule(facade);
    const moduleId = await createModuleAsAuthor(mod, author);

    const result = await mod.execute(
      'enrich-module',
      {
        moduleId,
        targetAudience: 'Новички',
        goal: 'Научиться',
        tags: ['js'],
      },
      admin.uuid,
    );

    expect((result as { targetAudience?: string }).targetAudience).toBe(
      'Новички',
    );
  });

  test('publish-module: автор публикует модуль', async () => {
    const facade = new MockUserFacade();
    const author = makeAuthor();
    facade.addUser(author);

    const mod = setupModule(facade);
    const moduleId = await createModuleAsAuthor(mod, author);

    const result = await mod.execute(
      'publish-module',
      { moduleId },
      author.uuid,
    );

    expect((result as { status: string }).status).toBe(Status.PUBLISHED);
  });

  test('get-module: возвращает созданный модуль', async () => {
    const facade = new MockUserFacade();
    const author = makeAuthor();
    facade.addUser(author);

    const mod = setupModule(facade);
    const moduleId = await createModuleAsAuthor(mod, author);

    const result = await mod.execute(
      'get-module',
      { uuid: moduleId },
      author.uuid,
    );

    expect((result as { title: string }).title).toBe('Модуль');
  });

  test('list-courses: возвращает список модулей', async () => {
    const facade = new MockUserFacade();
    const author = makeAuthor();
    facade.addUser(author);

    const mod = setupModule(facade);
    await createModuleAsAuthor(mod, author);

    const result = await mod.execute('list-modules', {}, author.uuid);

    expect(result as unknown[]).toHaveLength(1);
  });

  test('create-lesson: AUTHOR создаёт урок в своём модуле', async () => {
    const facade = new MockUserFacade();
    const author = makeAuthor();
    facade.addUser(author);

    const mod = setupModule(facade);
    const moduleId = await createModuleAsAuthor(mod, author);

    const withProject = (await mod.execute(
      'add-project',
      { moduleId, title: 'Проект 1' },
      author.uuid,
    )) as { projects?: { uuid: string }[] };
    const projectId = withProject.projects?.[0]?.uuid ?? '';

    const result = await mod.execute(
      'create-lesson',
      { moduleId, projectId, title: 'Урок 1' },
      author.uuid,
    );

    expect((result as { title: string }).title).toBe('Урок 1');
  });

  test('create-step: AUTHOR создаёт шаг в своём модуле', async () => {
    const facade = new MockUserFacade();
    const author = makeAuthor();
    facade.addUser(author);

    const mod = setupModule(facade);
    const moduleId = await createModuleAsAuthor(mod, author);

    const withProject = (await mod.execute(
      'add-project',
      { moduleId, title: 'Проект 1' },
      author.uuid,
    )) as { projects?: { uuid: string }[] };
    const projectId = withProject.projects?.[0]?.uuid ?? '';

    const lesson = (await mod.execute(
      'create-lesson',
      { moduleId, projectId, title: 'Урок 1' },
      author.uuid,
    )) as { uuid: string };

    const result = await mod.execute(
      'create-step',
      {
        kind: 'text',
        moduleId,
        lessonId: lesson.uuid,
        description: 'Описание',
        content: 'Шаг 1',
      },
      author.uuid,
    );

    expect((result as { kind: string }).kind).toBe('text');
  });
});
