import { describe, expect, mock, test } from 'bun:test';
import { TEST_SCHOOL, type User } from '@u7-scl/app/domain';
import { Role } from '@u7-scl/user/domain';
import type { ApiAppBundle } from './create-api-app';
import { createUiApp } from './create-ui-app';

const BOT_ADMIN_UUID = '99999999-9999-4999-8999-999999999999';

const botAdminUser: User = {
  uuid: BOT_ADMIN_UUID,
  name: 'Admin',
  telegramId: 999,
  roles: [Role.ADMIN],
  createdAt: '2026-01-01T00:00:00.000Z',
};

function makeApiBundle(): ApiAppBundle {
  return {
    apiApp: {
      getModule: mock(() => ({})),
    } as any,
    eventBus: {} as any,
    userFacade: {
      getUserByUuid: mock(async (uuid: string) => {
        if (uuid === BOT_ADMIN_UUID) return botAdminUser;
        return undefined;
      }),
      getUserByTelegramId: mock(async () => botAdminUser),
    } as any,
    userRepo: {} as any,
    questionnaireFacade: {} as any,
    streamModule: {} as any,
    courseModule: {} as any,
    wishModule: {} as any,
    school: TEST_SCHOOL,
    appResolver: {} as any,
  };
}

describe('createUiApp — регистрация SchoolController', () => {
  test('собирает UiAppBundle с schoolController и school в resolve', async () => {
    const apiBundle = makeApiBundle();
    const uiBundle = await createUiApp(apiBundle.apiApp, apiBundle, {
      botAdminUuid: BOT_ADMIN_UUID,
    });

    expect(uiBundle.schoolController).toBeDefined();
    expect(uiBundle.schoolController.name).toBe('school');
    expect(uiBundle.resolve.school).toEqual(TEST_SCHOOL);
  });
});
