import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import {
  assertDialogResponseMarkdownSafe,
  type BotSession,
  type DialogResponse,
} from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { Routes } from '../../shared/routes';
import { MyReviewsStory } from './my-reviews.story';

/** Кнопка по подстроке текста (кросс-describe хелпер). */
function findBtn(response: DialogResponse, needle: string) {
  return (
    response.screen?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes(needle)) ?? null
  );
}

describe('MyReviewsStory — кнопка меню «💬 Отзывы» (S02)', () => {
  const actor: User = {
    uuid: 'user-1',
    name: 'Аня',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  function makeStory(campaignCount: number) {
    const appApi = {
      execute: mock(async (ucName: string) => {
        if (ucName === 'get-my-campaigns') {
          return Array.from({ length: campaignCount }, (_, i) => ({
            campaignId: `aaaaaaaa-0000-0000-0000-00000000000${i}`,
            context: 'stream_fate',
            scopeId: 'bbbbbbbb-0000-0000-0000-000000000001',
            subjectId: actor.uuid,
            myRole: 'subject',
            subjectOutcome: 'completed_passed',
            expiresAt: '2026-09-26T00:00',
            daysLeft: 5,
            progress: { done: 0, total: 1 },
          }));
        }
        throw new Error(`неизвестный UC: ${ucName}`);
      }),
    };
    const story = new MyReviewsStory();
    story.init({ appApi } as never);
    return { story, appApi };
  }

  test('есть живые кампании → одна кнопка «💬 Отзывы» с кодом my-reviews:hub', async () => {
    const { story } = makeStory(1);

    const buttons = await story.menuButtons(actor);

    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toEqual({
      kind: 'callback',
      text: '💬 Отзывы',
      action: 'my-reviews:hub',
      priority: 25,
      description: '💬 Отзывы — расскажи об учёбе участникам потока',
    });
  });

  test('нет живых кампаний → кнопки нет (пустой список)', async () => {
    const { story } = makeStory(0);

    const buttons = await story.menuButtons(actor);

    expect(buttons).toEqual([]);
  });

  test('проверка — UC get-my-campaigns с onlyLives от id актора', async () => {
    const { story, appApi } = makeStory(1);

    await story.menuButtons(actor);

    expect(appApi.execute).toHaveBeenCalledTimes(1);
    expect(appApi.execute).toHaveBeenCalledWith(
      'get-my-campaigns',
      { userId: actor.uuid, onlyLives: true },
      actor,
    );
  });
});

describe('MyReviewsStory — экран S02 «Мои отзывы» (мини-карточки)', () => {
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
    subjectOutcome:
      | 'completed_passed'
      | 'completed_not_passed'
      | 'dropped'
      | 'never_started';
    daysLeft: number;
    progress: { done: number; total: number };
  }

  const subjectCard: Card = {
    campaignId: CAMPAIGN_1,
    scopeId: STREAM_1,
    subjectId: actor.uuid,
    myRole: 'subject',
    subjectOutcome: 'completed_passed',
    daysLeft: 5,
    progress: { done: 1, total: 4 },
  };
  const mentorCard: Card = {
    campaignId: CAMPAIGN_2,
    scopeId: STREAM_2,
    subjectId: SUBJECT_ID,
    myRole: 'mentor',
    subjectOutcome: 'completed_passed',
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
            return cards.map((c) => ({ ...c, context: 'stream_fate' }));
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
    story.init({ appApi: makeAppApi(cards, opts) } as never);
    return story;
  }

  test('интро + мини-карточка субъекта «завершил»: текст пары «роль-судьба», метрики, кнопка с номером', async () => {
    const story = initStory(new MyReviewsStory(), [subjectCard]);

    const response = await story.handleCallback('hub', actor, session);
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    // Абстрактное интро «что это за место»
    expect(text).toContain('Здесь ты можешь оставить отзывы');
    expect(text).toContain('1\\. *Поток «Первый поток»*');
    expect(text).toContain('Ты завершил обучение\\. Поделись впечатлениями');
    expect(text).toContain('Метрики: 1/4 \\(5 дн\\.\\)');

    const btn = findBtn(response, '1. Поток');
    expect(btn?.text).toBe('1. Поток «Первый поток»');
    expect(btn?.code).toBe(`campaign:list:${CAMPAIGN_1}`);
  });

  test('мини-карточки субъектов «забросил»/«не начал» — свои тексты', async () => {
    const dropped: Card = {
      ...subjectCard,
      subjectOutcome: 'dropped',
    };
    const neverStarted: Card = {
      ...subjectCard,
      campaignId: CAMPAIGN_2,
      scopeId: STREAM_2,
      subjectOutcome: 'never_started',
    };
    const story = initStory(new MyReviewsStory(), [dropped, neverStarted]);

    const response = await story.handleCallback('hub', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Ты покинул обучение\\. Оставь отзыв ментору');
    expect(text).toContain('Ты записался, но не начал обучение');
    // Карточки разделяются линией
    expect(text).toContain('──────────────');
  });

  test('ментор «подопечный завершил»: имя субъекта batch-UC, кнопка «N. Отзыв об {Имя}»', async () => {
    const appApi = makeAppApi([mentorCard]);
    const story = new MyReviewsStory();
    story.init({ appApi } as never);

    const response = await story.handleCallback('hub', actor, session);
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Твой подопечный Борис завершил обучение');
    expect(text).toContain('Метрики: 0/1 \\(3 дн\\.\\)');

    const btn = findBtn(response, '1. Отзыв');
    expect(btn?.text).toBe('1. Отзыв об Борис');
    expect(btn?.code).toBe(`campaign:list:${CAMPAIGN_2}`);

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

  test('ментор «подопечный выбыл»: текст пары «роль-судьба»', async () => {
    const story = initStory(new MyReviewsStory(), [
      { ...mentorCard, subjectOutcome: 'dropped' },
    ]);

    const response = await story.handleCallback('hub', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Твой подопечный Борис покинул обучение');
  });

  test('несколько кампаний: нумерация карточек и кнопок, главное меню последним рядом', async () => {
    const story = initStory(new MyReviewsStory(), [subjectCard, mentorCard]);

    const response = await story.handleCallback('hub', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('1\\. *Поток «Первый поток»*');
    expect(text).toContain('2\\. *Поток «Второй поток»*');

    const rows = response.screen?.keyboard?.rows ?? [];
    expect(rows.length).toBe(3); // две кампании + меню
    expect(rows[0]?.[0]?.text).toBe('1. Поток «Первый поток»');
    expect(rows[1]?.[0]?.text).toBe('2. Отзыв об Борис');
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

  test('имя субъекта не найдено (batch пуст) — запасной «студент»', async () => {
    const story = initStory(new MyReviewsStory(), [mentorCard], {
      missingSubject: true,
    });

    const response = await story.handleCallback('hub', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Твой подопечный студент завершил обучение');
    const btn = findBtn(response, '1. Отзыв');
    expect(btn?.text).toBe('1. Отзыв об студенте');
  });
});

describe('MyReviewsStory — пагинация хаба S02 (BotPaginator + DialogCache)', () => {
  const TOTAL = 30;

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

  const STREAM = 'bbbbbbbb-0000-0000-0000-000000000001';

  function manyCards(n: number) {
    return Array.from({ length: n }, (_, i) => ({
      campaignId: `aaaaaaaa-0000-0000-0000-${String(i).padStart(12, '0')}`,
      scopeId: STREAM,
      subjectId: actor.uuid,
      myRole: 'subject' as const,
      subjectOutcome: 'completed_passed' as const,
      daysLeft: 5,
      progress: { done: 0, total: 1 },
    }));
  }

  function cardButtons(response: DialogResponse) {
    return (response.screen?.keyboard?.rows ?? [])
      .flat()
      .filter((b) => b.code.startsWith('campaign:list:'));
  }

  function initStory(cards: ReturnType<typeof manyCards>) {
    const appApi = {
      execute: mock(async (ucName: string, attrs: Record<string, unknown>) => {
        switch (ucName) {
          case 'get-my-campaigns':
            return cards;
          case 'get-stream':
            return { uuid: attrs.streamId, title: 'Первый поток' };
          case 'get-users-by-ids':
            return [];
          default:
            throw new Error(`неизвестный UC: ${ucName}`);
        }
      }),
    };
    const story = new MyReviewsStory();
    story.init({ appApi } as never);
    return { story, appApi };
  }

  test('много карточек → страницы по бюджету Telegram: индикатор, навигация, лимит 4096', async () => {
    const { story } = initStory(manyCards(TOTAL));

    const first = await story.handleCallback('hub', actor, session);
    assertDialogResponseMarkdownSafe(first);
    const text = String(first.screen?.text ?? '');

    expect(text).toContain('Стр\\. 1/');
    expect(findBtn(first, 'След ›')).not.toBeNull();
    expect(findBtn(first, '‹ Пред')).toBeNull();
    expect(text.length).toBeLessThanOrEqual(4096);

    // Кнопки страницы — начало списка, меню последним рядом
    const buttonsOnPage = cardButtons(first);
    expect(buttonsOnPage.length).toBeGreaterThan(0);
    expect(buttonsOnPage.length).toBeLessThan(TOTAL);
    expect(buttonsOnPage[0]?.text).toBe('1. Поток «Первый поток»');
  });

  test('hub-page:N → кнопки своей страницы, нумерация сквозная, предел — последняя карточка', async () => {
    const cards = manyCards(TOTAL);
    const { story } = initStory(cards);

    const first = await story.handleCallback('hub', actor, session);
    const firstCount = cardButtons(first).length;

    const second = await story.handleCallback('hub-page:1', actor, session);
    assertDialogResponseMarkdownSafe(second);
    const text = String(second.screen?.text ?? '');

    expect(text).toContain('Стр\\. 2/');
    expect(findBtn(second, '‹ Пред')).not.toBeNull();
    expect(findBtn(second, 'След ›')).toBeNull();

    const rest = cardButtons(second);
    expect(rest).toHaveLength(TOTAL - firstCount);
    expect(rest[0]?.text).toBe(`${firstCount + 1}. Поток «Первый поток»`);
    expect(rest.at(-1)?.text).toBe(`${TOTAL}. Поток «Первый поток»`);
    // Коды кнопок второй страницы — свои кампании
    expect(rest[0]?.code).toBe(
      `campaign:list:${cards[firstCount]?.campaignId}`,
    );
  });

  test('тык навигации не перечитывает домен: build один раз на эпоху диалога', async () => {
    const { story, appApi } = initStory(manyCards(TOTAL));

    await story.handleCallback('hub', actor, session);
    await story.handleCallback('hub-page:1', actor, session);
    await story.handleCallback('hub-page:0', actor, session);

    const calls = (
      appApi.execute.mock.calls as unknown as Array<[string]>
    ).filter(([ucName]) => ucName === 'get-my-campaigns');
    expect(calls).toHaveLength(1);
  });

  test('одна страница — без индикатора и навигации (как без пагинации)', async () => {
    const { story } = initStory(manyCards(2));

    const response = await story.handleCallback('hub', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).not.toContain('Стр\\. ');
    expect(findBtn(response, 'След ›')).toBeNull();
    expect(findBtn(response, '‹ Пред')).toBeNull();
    expect(cardButtons(response)).toHaveLength(2);
  });
});
