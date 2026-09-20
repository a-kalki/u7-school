import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import {
  assertDialogResponseMarkdownSafe,
  type BotSession,
  type DialogResponse,
} from '@u7-scl/core/ui';
import type { PeerReviewFacade } from '@u7-scl/peer-review/domain';
import { Role } from '@u7-scl/user/domain';
import { Routes } from '../../shared/routes';
import { MyReviewsStory } from './my-reviews.story';

describe('MyReviewsStory — кнопка меню «💬 Отзывы» (S02)', () => {
  const actor: User = {
    uuid: 'user-1',
    name: 'Аня',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  function makeStory(hasLive: boolean) {
    const facade: PeerReviewFacade = {
      hasLiveCampaigns: mock(
        async (userId: string) => hasLive && userId === actor.uuid,
      ),
      hasReviews: mock(async () => false),
      listScopeFacts: mock(async () => ({
        hasReviews: false,
        reviewsCount: 0,
      })),
    };
    const story = new MyReviewsStory();
    story.init({
      appApi: { execute: mock(async () => []) },
      peerReviewFacade: facade,
    } as never);
    return story;
  }

  test('есть живые кампании → одна кнопка «💬 Отзывы» с кодом my-reviews:hub', async () => {
    const story = makeStory(true);

    const buttons = await story.menuButtons(actor);

    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toEqual({
      kind: 'callback',
      text: '💬 Отзывы',
      action: 'my-reviews:hub',
      priority: 25,
      description: '💬 Отзывы — о ком можно рассказать после потока',
    });
  });

  test('нет живых кампаний → кнопки нет (пустой список)', async () => {
    const story = makeStory(false);

    const buttons = await story.menuButtons(actor);

    expect(buttons).toEqual([]);
  });

  test('проверка идёт по фасаду hasLiveCampaigns от id актора', async () => {
    const facade: PeerReviewFacade = {
      hasLiveCampaigns: mock(async () => true),
      hasReviews: mock(async () => false),
      listScopeFacts: mock(async () => ({
        hasReviews: false,
        reviewsCount: 0,
      })),
    };
    const story = new MyReviewsStory();
    story.init({
      appApi: { execute: mock(async () => []) },
      peerReviewFacade: facade,
    } as never);

    await story.menuButtons(actor);

    expect(facade.hasLiveCampaigns).toHaveBeenCalledTimes(1);
    expect(facade.hasLiveCampaigns).toHaveBeenCalledWith(actor.uuid);
  });
});

describe('MyReviewsStory — экран S02 «Мои отзывы»', () => {
  const CAMPAIGN_1 = 'aaaaaaaa-0000-0000-0000-000000000001';
  const CAMPAIGN_2 = 'aaaaaaaa-0000-0000-0000-000000000002';
  const STREAM_1 = 'bbbbbbbb-0000-0000-0000-000000000001';
  const STREAM_2 = 'bbbbbbbb-0000-0000-0000-000000000002';
  const SUBJECT_ID = 'dddddddd-0000-0000-0000-000000000001';

  const session: BotSession = {
    dialog: { path: 'peer-review/my-reviews', seq: 1 },
  };
  const actor: User = {
    uuid: 'user-1',
    name: 'Аня',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  /** Карточка «моей кампании» — как отдаёт get-my-campaigns. */
  interface Card {
    campaignId: string;
    scopeId: string;
    subjectId: string;
    myRole: 'subject' | 'mentor';
    daysLeft: number;
    progress: { done: number; total: number };
  }

  const subjectCard: Card = {
    campaignId: CAMPAIGN_1,
    scopeId: STREAM_1,
    subjectId: actor.uuid,
    myRole: 'subject',
    daysLeft: 5,
    progress: { done: 1, total: 4 },
  };
  const mentorCard: Card = {
    campaignId: CAMPAIGN_2,
    scopeId: STREAM_2,
    subjectId: SUBJECT_ID,
    myRole: 'mentor',
    daysLeft: 3,
    progress: { done: 0, total: 1 },
  };

  /**
   * appApi-мок: get-my-campaigns (только живые), get-stream, get-users-by-ids.
   * `missingSubject` — batch не находит субъекта (запасной лейбл).
   */
  function makeAppApi(cards: Card[], opts: { missingSubject?: boolean } = {}) {
    return {
      execute: mock(async (ucName: string, attrs: Record<string, unknown>) => {
        switch (ucName) {
          case 'get-my-campaigns':
            return cards.map((c) => ({
              campaignId: c.campaignId,
              context: 'stream_fate',
              scopeId: c.scopeId,
              subjectId: c.subjectId,
              myRole: c.myRole,
              expiresAt: '2026-09-26T00:00',
              daysLeft: c.daysLeft,
              progress: c.progress,
            }));
          case 'get-stream':
            return {
              uuid: attrs.streamId,
              title:
                attrs.streamId === STREAM_1 ? 'Первый поток' : 'Второй поток',
            };
          case 'get-users-by-ids':
            if (opts.missingSubject) return [];
            return [
              {
                uuid: SUBJECT_ID,
                name: 'Борис',
                telegramId: 9,
                roles: [],
                createdAt: '2026-01-01T00:00:00.000Z',
              },
            ];
          default:
            throw new Error(`неизвестный UC: ${ucName}`);
        }
      }),
    };
  }

  function initStory(
    story: MyReviewsStory,
    cards: Card[],
    opts?: { missingSubject?: boolean },
  ) {
    const facade: PeerReviewFacade = {
      hasLiveCampaigns: mock(async () => cards.length > 0),
      hasReviews: mock(async () => false),
      listScopeFacts: mock(async () => ({
        hasReviews: false,
        reviewsCount: 0,
      })),
    };
    story.init({
      appApi: makeAppApi(cards, opts),
      peerReviewFacade: facade,
    } as never);
    return story;
  }

  function findBtn(response: DialogResponse, needle: string) {
    return (
      response.screen?.keyboard?.rows
        .flat()
        .find((b) => b.text.includes(needle)) ?? null
    );
  }

  test('субъект: строка «одногруппники и ментор», кнопка с M/K и днями; код — мост campaign:list', async () => {
    const story = initStory(new MyReviewsStory(), [subjectCard]);

    const response = await story.handleCallback('hub', actor, session);
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Мои отзывы');
    expect(text).toContain(
      '1\\. Поток «Первый поток» — одногруппники и ментор\\. Осталось 5 дн\\.',
    );

    const btn = findBtn(response, 'Первый поток');
    expect(btn?.text).toBe('🏁 Поток «Первый поток» · 1/4 · 5 дн.');
    expect(btn?.code).toBe(`campaign:list:${CAMPAIGN_1}`);
  });

  test('ментор: строка «отзыв о {Имя}», имя субъекта — batch-UC get-users-by-ids', async () => {
    const story = initStory(new MyReviewsStory(), [mentorCard]);
    const appApi = (
      story as unknown as {
        resolver: { appApi: ReturnType<typeof makeAppApi> };
      }
    ).resolver.appApi;

    const response = await story.handleCallback('hub', actor, session);
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain(
      '1\\. Поток «Второй поток» — отзыв о Борис\\. Осталось 3 дн\\.',
    );

    const btn = findBtn(response, 'Второй поток');
    expect(btn?.text).toBe('🏁 Поток «Второй поток» · отзыв о Борис · 3 дн.');

    const calls = (
      appApi.execute.mock.calls as unknown as Array<
        [string, Record<string, unknown>]
      >
    ).map(([ucName, attrs]) => [ucName, attrs]);
    expect(calls).toContainEqual([
      'get-users-by-ids',
      { userIds: [SUBJECT_ID] },
    ]);
  });

  test('несколько кампаний: нумерация 1. 2., главное меню последним рядом', async () => {
    const story = initStory(new MyReviewsStory(), [subjectCard, mentorCard]);

    const response = await story.handleCallback('hub', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('1\\. Поток «Первый поток»');
    expect(text).toContain('2\\. Поток «Второй поток»');

    const rows = response.screen?.keyboard?.rows ?? [];
    expect(rows.length).toBe(3); // две кампании + меню
    expect(rows.at(-1)?.[0]?.code).toBe(Routes.app.mainMenu);
  });

  test('нет живых кампаний (окно истекло после меню) — заглушка с главным меню', async () => {
    const story = initStory(new MyReviewsStory(), []);

    const response = await story.handleCallback('hub', actor, session);

    const text = String(response.screen?.text ?? '');
    expect(text).toContain('Открытых окон');
    const last = response.screen?.keyboard?.rows.at(-1)?.[0];
    expect(last?.code).toBe(Routes.app.mainMenu);
  });

  test('имя субъекта не найдено (batch пуст) — запасной лейбл «отзыв о студенте»', async () => {
    const story = initStory(new MyReviewsStory(), [mentorCard], {
      missingSubject: true,
    });

    const response = await story.handleCallback('hub', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('— отзыв о студенте\\. Осталось 3 дн\\.');
    const btn = findBtn(response, 'Второй поток');
    expect(btn?.text).toBe(
      '🏁 Поток «Второй поток» · отзыв о студенте · 3 дн.',
    );
  });
});
