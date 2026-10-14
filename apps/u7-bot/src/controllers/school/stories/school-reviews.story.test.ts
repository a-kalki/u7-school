import { describe, expect, mock, test } from 'bun:test';
import { TEST_SCHOOL, type User } from '@u7-scl/app/domain';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { SchoolReviewsStory } from './school-reviews.story';

const actor: User = {
  uuid: 'user-guest',
  name: 'Гость',
  telegramId: 123456,
  roles: [Role.GUEST],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const session: BotSession = {
  dialog: { path: 'school/reviews', seq: 1 },
};

const SCHOOL_ID = TEST_SCHOOL.id;
const STREAM_1 = '11111111-1111-4111-8111-111111111111';
const STREAM_2 = '22222222-2222-4222-8222-222222222222';
const MENTOR_1 = '33333333-3333-4333-8333-333333333333';
const STUDENT_1 = '44444444-4444-4444-8444-444444444444';

function makeStory(opts?: {
  streams?: Array<{ uuid: string; schoolId: string }>;
  recipients?: Array<{
    recipientId: string;
    reviews: Array<{
      reviewId: string;
      scopeId: string;
      authorId: string;
      direction: 'student_mentor';
      authorOutcome?:
        | 'completed_passed'
        | 'completed_not_passed'
        | 'dropped'
        | 'never_started';
      text: string;
      createdAt: string;
    }>;
  }>;
  names?: Record<string, string>;
}) {
  const story = new SchoolReviewsStory();

  const streams = opts?.streams ?? [
    { uuid: STREAM_1, schoolId: SCHOOL_ID },
    { uuid: STREAM_2, schoolId: SCHOOL_ID },
  ];
  const recipients = opts?.recipients ?? [];
  const namesMap: Record<string, string> = {
    [MENTOR_1]: 'Алексей Ментор',
    [STUDENT_1]: 'Иван Студент',
    ...(opts?.names ?? {}),
  };

  const executeMock = mock(
    async (ucName: string, attrs: Record<string, unknown>) => {
      switch (ucName) {
        case 'list-streams':
          return streams;
        case 'list-scope-reviews':
          return {
            scopeIds: attrs.scopeIds,
            recipients,
          };
        case 'get-users-by-ids': {
          const ids = attrs.userIds as string[];
          return ids.map((id) => ({
            uuid: id,
            name: namesMap[id] ?? 'Неизвестный',
          }));
        }
        default:
          throw new Error(`Unexpected UC call: ${ucName}`);
      }
    },
  );

  story.init({
    school: TEST_SCHOOL,
    appApi: {
      execute: executeMock,
    },
  } as any);

  return { story, executeMock };
}

describe('SchoolReviewsStory (SH03)', () => {
  test('имя стори — reviews, menuButtons пуст (вход только через хаб)', async () => {
    const { story } = makeStory();
    expect(story.name).toBe('reviews');
    const buttons = await story.menuButtons(actor);
    expect(buttons).toEqual([]);
  });

  test('пустой срез: если потоков или отзывов нет — заглушка с кнопкой «Назад в школу»', async () => {
    const { story, executeMock } = makeStory({ recipients: [] });

    const response: DialogResponse = await story.handleCallback(
      'list',
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('Пока нет отзывов о школе');

    const backBtn = response.screen?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('Назад в школу'));
    expect(backBtn).toBeDefined();
    expect(backBtn?.code).toBe('school:hub:open');

    expect(executeMock).toHaveBeenCalledWith(
      'list-streams',
      { schoolId: SCHOOL_ID },
      actor,
    );
    expect(executeMock).toHaveBeenCalledWith(
      'list-scope-reviews',
      { scopeIds: [STREAM_1, STREAM_2], direction: 'student_mentor' },
      actor,
    );
  });

  test('непустой срез: заголовок «Отзывы о школе», имя ментора, текст и автор', async () => {
    const { story } = makeStory({
      recipients: [
        {
          recipientId: MENTOR_1,
          reviews: [
            {
              reviewId: 'r1',
              scopeId: STREAM_1,
              authorId: STUDENT_1,
              direction: 'student_mentor',
              authorOutcome: 'completed_passed',
              text: 'Отличный курс, ментор всегда помогал!',
              createdAt: '2026-09-20T10:00',
            },
          ],
        },
      ],
    });

    const response: DialogResponse = await story.handleCallback(
      'list',
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('Отзывы о школе');
    expect(text).toContain('Алексей Ментор');
    expect(text).toContain('Иван Студент');
    expect(text).toContain('Отличный курс, ментор всегда помогал');

    const backBtn = response.screen?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('Назад в школу'));
    expect(backBtn).toBeDefined();
    expect(backBtn?.code).toBe('school:hub:open');
  });

  test('пагинация: длинный список отзывов нарезается на страницы', async () => {
    const manyReviews = Array.from({ length: 8 }, (_, i) => ({
      reviewId: `rev-${i}`,
      scopeId: STREAM_1,
      authorId: STUDENT_1,
      direction: 'student_mentor' as const,
      authorOutcome: 'completed_passed' as const,
      text:
        `Длинный полезный отзыв номер ${i + 1}. ` +
        'Слова благодарности ментору. '.repeat(30),
      createdAt: `2026-09-2${i}T10:00`,
    }));

    const { story, executeMock } = makeStory({
      recipients: [
        {
          recipientId: MENTOR_1,
          reviews: manyReviews,
        },
      ],
    });

    const page0: DialogResponse = await story.handleCallback(
      'list',
      actor,
      session,
    );
    expect(String(page0.screen?.text)).toContain('Стр\\. 1/');

    const nextBtn = page0.screen?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('След'));
    expect(nextBtn).toBeDefined();

    // Листание на страницу 1
    const page1: DialogResponse = await story.handleCallback(
      nextBtn!.code.split(':').slice(1).join(':'),
      actor,
      session,
    );
    expect(String(page1.screen?.text)).toContain('Стр\\. 2/');

    // Проверка кеширования: повторные обращения к домену не происходят
    const scopeReviewCalls = executeMock.mock.calls.filter(
      ([name]) => name === 'list-scope-reviews',
    );
    expect(scopeReviewCalls).toHaveLength(1);
  });
});
