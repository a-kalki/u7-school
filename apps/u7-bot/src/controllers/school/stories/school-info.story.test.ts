import { describe, expect, test } from 'bun:test';
import { TEST_SCHOOL, type User } from '@u7-scl/app/domain';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { SchoolInfoStory } from './school-info.story';

const actor: User = {
  uuid: 'user-guest',
  name: 'Гость',
  telegramId: 123456,
  roles: [Role.GUEST],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const session: BotSession = {
  dialog: { path: 'school/info', seq: 1 },
};

function makeStory(contacts?: { phone: string; site?: string }) {
  const story = new SchoolInfoStory();

  story.init({
    school: {
      ...TEST_SCHOOL,
      name: 'Batys IT School',
      description: 'Крутая школа программирования',
      address: 'г. Уральск, ул. Тестовая, 10',
      contacts: contacts ?? {
        phone: '+7 777 000 0000',
      },
    },
    appApi: {
      execute: async () => {
        throw new Error('Not implemented');
      },
    },
  } as any);

  return { story };
}

describe('SchoolInfoStory (SH02)', () => {
  test('имя стори — info, menuButtons пуст (вход только через хаб)', async () => {
    const { story } = makeStory();
    expect(story.name).toBe('info');
    const buttons = await story.menuButtons(actor);
    expect(buttons).toEqual([]);
  });

  test('экран «Инфо» отображает имя, описание, адрес, телефон и кнопку возврата в хаб', async () => {
    const { story } = makeStory({
      phone: '+7 777 123 4567',
    });

    const response: DialogResponse = await story.handleCallback(
      'view',
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('Batys IT School');
    expect(text).toContain('Крутая школа программирования');
    expect(text).toContain('Уральск');
    expect(text).toContain('Тестовая, 10');
    expect(text).toContain('123 4567');

    const keyboard = response.screen?.keyboard;
    expect(keyboard).toBeDefined();
    const flatButtons = keyboard?.rows.flat() ?? [];
    const backBtn = flatButtons.find((b) => b.text === '⬅️ Назад в школу');
    expect(backBtn).toBeDefined();
    expect(backBtn?.code).toBe('hub:open');
  });

  test('сайт не задан — выводится заглушка «сайта пока нет, но скоро будет»', async () => {
    const { story } = makeStory({
      phone: '+7 777 123 4567',
    });

    const response: DialogResponse = await story.handleCallback(
      'view',
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('сайта пока нет, но скоро будет');
  });

  test('сайт задан — выводится адрес сайта и нет заглушки', async () => {
    const { story } = makeStory({
      phone: '+7 777 123 4567',
      site: 'https://batys-school.kz',
    });

    const response: DialogResponse = await story.handleCallback(
      'view',
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('batys');
    expect(text).toContain('school\\.kz');
    expect(text).not.toContain('сайта пока нет, но скоро будет');
  });

  test('неизвестный action возвращает unknownCommand', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback('unknown', actor, session);
    expect(String(response.screen?.text)).toContain('Неизвестная команда');
  });
});
