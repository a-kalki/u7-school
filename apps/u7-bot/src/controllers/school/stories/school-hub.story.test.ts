import { describe, expect, mock, test } from 'bun:test';
import { TEST_SCHOOL, type User } from '@u7-scl/app/domain';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { SchoolHubStory } from './school-hub.story';

const MENTOR_1_UUID = '8d9a56f6-51e7-49f0-ba58-2832b157e718';
const MENTOR_2_UUID = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';

const actor: User = {
  uuid: 'user-guest',
  name: 'Гость',
  telegramId: 123456,
  roles: [Role.GUEST],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const session: BotSession = {
  dialog: { path: 'school/hub', seq: 1 },
};

function makeStory(opts: {
  mentors?: string[];
  mockMentors?: Array<{ uuid: string; name: string }>;
}) {
  const story = new SchoolHubStory();
  const execute = mock(
    async (ucName: string, _attrs: Record<string, unknown>) => {
      if (ucName === 'get-users-by-ids') {
        return opts.mockMentors ?? [];
      }
      throw new Error(`Неизвестный UC: ${ucName}`);
    },
  );

  story.init({
    school: {
      ...TEST_SCHOOL,
      name: 'Batys IT School',
      description: 'Крутая школа программирования',
      mentors: opts.mentors ?? [],
    },
    appApi: { execute },
  } as any);

  return { story, execute };
}

describe('SchoolHubStory (SH01)', () => {
  test('карточка показывает имя школы, описание и менторов (резолв uuid → имена)', async () => {
    const { story, execute } = makeStory({
      mentors: [MENTOR_1_UUID, MENTOR_2_UUID],
      mockMentors: [
        { uuid: MENTOR_1_UUID, name: 'Алиса' },
        { uuid: MENTOR_2_UUID, name: 'Боб' },
      ],
    });

    const response: DialogResponse = await story.handleCallback(
      'open',
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    expect(execute).toHaveBeenCalledWith('get-users-by-ids', {
      userIds: [MENTOR_1_UUID, MENTOR_2_UUID],
    });

    const text = String(response.screen?.text);
    expect(text).toContain('Batys IT School');
    expect(text).toContain('Крутая школа программирования');
    expect(text).toContain('Наши менторы: Алиса, Боб');
  });

  test('пустой список менторов — строка «Наши менторы» не выводится и get-users-by-ids не вызывается', async () => {
    const { story, execute } = makeStory({
      mentors: [],
    });

    const response: DialogResponse = await story.handleCallback(
      'open',
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    expect(execute).not.toHaveBeenCalled();

    const text = String(response.screen?.text);
    expect(text).toContain('Batys IT School');
    expect(text).toContain('Крутая школа программирования');
    expect(text).not.toContain('Наши менторы');
  });

  test('если get-users-by-ids вернул пустой список — строка «Наши менторы» не выводится', async () => {
    const { story, execute } = makeStory({
      mentors: [MENTOR_1_UUID],
      mockMentors: [],
    });

    const response: DialogResponse = await story.handleCallback(
      'open',
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    expect(execute).toHaveBeenCalledWith('get-users-by-ids', {
      userIds: [MENTOR_1_UUID],
    });

    const text = String(response.screen?.text);
    expect(text).toContain('Batys IT School');
    expect(text).not.toContain('Наши менторы');
  });

  test('menuButtons возвращает кнопку «🏫 Школа» (priority 10)', async () => {
    const { story } = makeStory({});

    const buttons = await story.menuButtons(actor);
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.text).toBe('🏫 Школа');
    expect(buttons[0]!.kind).toBe('callback');
    expect(buttons[0]!.priority).toBe(10);
    expect(buttons[0]!.description).toContain('визитная карточка');
  });

  test('неизвестный action возвращает unknownCommand', async () => {
    const { story } = makeStory({});

    const response = await story.handleCallback('unknown', actor, session);
    expect(String(response.screen?.text)).toContain('Неизвестная команда');
  });
});
