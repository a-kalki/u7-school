import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import {
  assertDialogResponseMarkdownSafe,
  type BotSession,
  type DialogResponse,
} from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { Routes } from '../../shared/routes';
import { ReviewsForMeStory } from './reviews-for-me.story';

/**
 * S08 — «Отзывы мне»: все отзывы адресату, новые наверху (порядок даёт
 * UC list-my-reviews), пагинация целыми отзывами.
 *
 * Формат блока:
 *   👤 {автор} ({роль} · {исход} · {дата}):
 *   «{текст}»
 * Лейбл исхода — только у автора-студента; автор-ментор — без лейбла.
 */

const READER = '22222222-2222-4222-8222-222222222222';
const AUTHOR_1 = '33333333-3333-4333-8333-333333333333';
const AUTHOR_2 = '34444444-4444-4444-8444-444444444444';

const session: BotSession = {
  dialog: { path: 'peer-review/reviews-for-me', seq: 1 },
};
const actor: User = {
  uuid: READER,
  name: 'Читатель',
  telegramId: 123,
  roles: [Role.STUDENT],
  createdAt: '2026-01-01T00:00:00.000Z',
};

/** Снимок отзыва — как отдаёт list-my-reviews (новые наверху). */
interface Snapshot {
  reviewId: string;
  authorId: string;
  direction: 'student_student' | 'student_mentor' | 'mentor_student';
  authorOutcome?:
    | 'completed_passed'
    | 'completed_not_passed'
    | 'dropped'
    | 'never_started';
  text: string;
  createdAt: string;
}

/** Длинный текст отзыва (n — номер, чтобы блоки различались). */
function longText(n: number, pad = 700): string {
  return `Отзыв номер ${n}. ${'б'.repeat(pad)}`;
}

/** appApi-мок: list-my-reviews + get-users-by-ids. */
function makeAppApi(reviews: Snapshot[], opts: { emptyNames?: boolean } = {}) {
  return {
    execute: mock(async (ucName: string) => {
      switch (ucName) {
        case 'list-my-reviews':
          return { reviews };
        case 'get-users-by-ids':
          if (opts.emptyNames) return [];
          return [
            { uuid: AUTHOR_1, name: 'Анна' },
            { uuid: AUTHOR_2, name: 'Глеб' },
          ];
        default:
          throw new Error(`неизвестный UC: ${ucName}`);
      }
    }),
  };
}

function makeStory(reviews: Snapshot[], opts?: { emptyNames?: boolean }) {
  const appApi = makeAppApi(reviews, opts);
  const story = new ReviewsForMeStory();
  story.init({ appApi } as never);
  return { story, appApi };
}

function btnsOf(r: DialogResponse) {
  return (r.screen?.keyboard?.rows ?? []).flat();
}

function findBtn(r: DialogResponse, needle: string) {
  return btnsOf(r).find((b) => b.text.includes(needle)) ?? null;
}

/** Отзывы, как их отдаёт UC: новые наверху. */
function manyReviews(n: number, textPad = 700): Snapshot[] {
  return Array.from({ length: n }, (_, i) => ({
    reviewId: `11111111-0000-0000-0000-${String(i).padStart(12, '0')}`,
    authorId: i % 2 === 0 ? AUTHOR_1 : AUTHOR_2,
    direction: 'student_student' as const,
    authorOutcome: 'completed_passed' as const,
    text: longText(i + 1, textPad),
    createdAt: `2026-09-2${9 - (i % 10)}T10:00`,
  }));
}

describe('ReviewsForMeStory — формат экрана S08', () => {
  test('блок: автор + роль + исход + дата, текст ниже; вызов UC с userId актора', async () => {
    const reviews: Snapshot[] = [
      {
        reviewId: '11111111-0000-0000-0000-000000000001',
        authorId: AUTHOR_1,
        direction: 'student_student',
        authorOutcome: 'completed_passed',
        text: 'Отличный товарищ по команде',
        createdAt: '2026-09-21T10:00',
      },
    ];
    const { story, appApi } = makeStory(reviews);

    const response = await story.handleCallback('view', actor, session);
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('📥 *Отзывы мне*');
    expect(text).toContain('Все отзывы, которые оставили тебе');
    expect(text).toContain('1 отзыв от участников');
    expect(text).toContain(
      '👤 Анна \\(студент · завершил и прошел · 21\\.09\\.2026\\):',
    );
    expect(text).toContain('«Отличный товарищ по команде»');
    // один отзыв — без линии-разделителя
    expect(text).not.toContain('──────────────');

    expect(appApi.execute).toHaveBeenCalledWith(
      'list-my-reviews',
      { userId: READER },
      actor,
    );
  });

  test('автор-ментор (mentor_student) — без лейбла исхода', async () => {
    const reviews: Snapshot[] = [
      {
        reviewId: '11111111-0000-0000-0000-000000000002',
        authorId: AUTHOR_2,
        direction: 'mentor_student',
        text: 'Глубоко разбирается в коде',
        createdAt: '2026-09-20T11:00',
      },
    ];
    const { story } = makeStory(reviews);

    const response = await story.handleCallback('view', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('👤 Глеб \\(ментор · 20\\.09\\.2026\\):');
    expect(text).toContain('«Глубоко разбирается в коде»');
  });

  test('порядок — как отдал UC: новые наверху (стории не пересортировывает)', async () => {
    const reviews: Snapshot[] = [
      {
        reviewId: '11111111-0000-0000-0000-000000000003',
        authorId: AUTHOR_1,
        direction: 'student_student',
        text: 'Свежий отзыв',
        createdAt: '2026-09-22T09:00',
      },
      {
        reviewId: '11111111-0000-0000-0000-000000000004',
        authorId: AUTHOR_2,
        direction: 'student_student',
        text: 'Старый отзыв',
        createdAt: '2026-09-18T09:00',
      },
    ];
    const { story } = makeStory(reviews);

    const response = await story.handleCallback('view', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text.indexOf('Свежий отзыв')).toBeLessThan(
      text.indexOf('Старый отзыв'),
    );
    // несколько отзывов — карточки разделены линией (как в хабе S02)
    expect(text).toContain('──────────────');
  });

  test('имена авторов — один batch-запрос с уникальными id', async () => {
    const reviews: Snapshot[] = [
      {
        reviewId: '11111111-0000-0000-0000-000000000005',
        authorId: AUTHOR_1,
        direction: 'student_student',
        text: 'текст один',
        createdAt: '2026-09-21T10:00',
      },
      {
        reviewId: '11111111-0000-0000-0000-000000000006',
        authorId: AUTHOR_1,
        direction: 'student_student',
        text: 'текст два',
        createdAt: '2026-09-20T10:00',
      },
      {
        reviewId: '11111111-0000-0000-0000-000000000007',
        authorId: AUTHOR_2,
        direction: 'student_student',
        text: 'текст три',
        createdAt: '2026-09-19T10:00',
      },
    ];
    const { story, appApi } = makeStory(reviews);

    await story.handleCallback('view', actor, session);

    const calls = (
      appApi.execute.mock.calls as unknown as Array<
        [string, Record<string, unknown>]
      >
    ).filter(([uc]) => uc === 'get-users-by-ids');
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[1]).toEqual({ userIds: [AUTHOR_1, AUTHOR_2] });
  });

  test('имя автора не найдено (batch пуст) — запасная «неизвестно»', async () => {
    const { story } = makeStory(
      [
        {
          reviewId: '11111111-0000-0000-0000-000000000008',
          authorId: AUTHOR_1,
          direction: 'student_student',
          authorOutcome: 'dropped',
          text: 'текст отзыва',
          createdAt: '2026-09-21T10:00',
        },
      ],
      { emptyNames: true },
    );

    const response = await story.handleCallback('view', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain(
      '👤 неизвестно \\(студент · забросил · 21\\.09\\.2026\\):',
    );
  });

  test('кнопки: «↩️ Мои отзывы» в хаб S02, главное меню последним рядом', async () => {
    const { story } = makeStory(manyReviews(1, 50));

    const response = await story.handleCallback('view', actor, session);

    const back = findBtn(response, 'Мои отзывы');
    expect(back?.code).toBe('my-reviews:hub');
    const rows = response.screen?.keyboard?.rows ?? [];
    expect(rows.at(-1)?.[0]?.code).toBe(Routes.app.mainMenu);
  });

  test('пустой список (гонка: отзывов нет) — заглушка с возвратом', async () => {
    const { story } = makeStory([]);

    const response = await story.handleCallback('view', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('пока не написали ни одного отзыва');
    const back = findBtn(response, 'Мои отзывы');
    expect(back?.code).toBe('my-reviews:hub');
  });

  test('неизвестная команда — экран unknownCommand', async () => {
    const { story } = makeStory(manyReviews(1, 50));

    const response = await story.handleCallback('wat', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text.toLowerCase()).toContain('неизвестн');
  });
});

describe('ReviewsForMeStory — пагинация (BotPaginator + DialogCache)', () => {
  test('длинные отзывы: ≥3 страницы из целых отзывов, полный цикл листания', async () => {
    const reviews = manyReviews(16);
    const { story } = makeStory(reviews);

    const pageTexts: string[] = [];
    let response = await story.handleCallback('view', actor, session);
    assertDialogResponseMarkdownSafe(response);
    pageTexts.push(String(response.screen?.text ?? ''));

    for (let i = 0; i < 12; i++) {
      const next = findBtn(response, 'След ›');
      if (!next) break;
      response = await story.handleCallback(
        `view:${next.code.split(':').pop()}`,
        actor,
        session,
      );
      assertDialogResponseMarkdownSafe(response);
      pageTexts.push(String(response.screen?.text ?? ''));
    }

    expect(pageTexts.length).toBeGreaterThanOrEqual(3);

    // Шапка и индикатор на каждой странице
    const total = pageTexts.length;
    for (let i = 0; i < total; i++) {
      expect(pageTexts[i]).toContain('Отзывы мне');
      expect(pageTexts[i]).toContain(`Стр\\. ${i + 1}/${total}`);
    }

    // Все 16 отзывов на местах, без потерь и дублей
    for (let i = 1; i <= 16; i++) {
      expect(pageTexts.join('\n').split(`Отзыв номер ${i}\\.`).length).toBe(2);
    }
  });

  test('листание не перечитывает домен: list-my-reviews один раз (кеш)', async () => {
    const { story, appApi } = makeStory(manyReviews(16));

    let response = await story.handleCallback('view', actor, session);
    for (let i = 0; i < 3; i++) {
      const next = findBtn(response, 'След ›');
      if (!next) break;
      response = await story.handleCallback(
        `view:${next.code.split(':').pop()}`,
        actor,
        session,
      );
    }

    const reads = (
      appApi.execute.mock.calls as unknown as Array<[string]>
    ).filter(([uc]) => uc === 'list-my-reviews');
    expect(reads).toHaveLength(1);
  });

  test('одна страница коротких отзывов — без индикатора и навигации', async () => {
    const { story } = makeStory(manyReviews(2, 50));

    const response = await story.handleCallback('view', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).not.toContain('Стр\\.');
    expect(findBtn(response, 'След ›')).toBeNull();
    expect(findBtn(response, '‹ Пред')).toBeNull();
  });

  test('запрос страницы за пределами — clamp к последней', async () => {
    const { story } = makeStory(manyReviews(8));

    const response = await story.handleCallback('view:99', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Стр\\. 2/2');
    expect(findBtn(response, 'След ›')).toBeNull();
  });
});
