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
 * S08 — «Отзывы мне»: карточный просмотр отзывов адресату, новые наверху
 * (порядок даёт UC list-my-reviews), ровно один отзыв на экран с листанием
 * ◀️ Пред. / След. ▶️ и индикатором 1/N.
 *
 * Формат карточки:
 *   👤 От: {автор} ({роль} · {исход})
 *   📚 Поток: {название потока}
 *   📅 Дата: {ДД.ММ.ГГГГ}
 *
 *   💬 «{текст}»
 *
 * Лейбл исхода — только у автора-студента; автор-ментор — без лейбла.
 */

const READER = '22222222-2222-4222-8222-222222222222';
const STREAM_1 = '11111111-1111-4111-8111-111111111111';
const STREAM_2 = '55555555-5555-4555-8555-555555555555';
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
  scopeId: string;
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

/** appApi-мок: list-my-reviews + get-users-by-ids + get-stream. */
function makeAppApi(
  reviews: Snapshot[],
  opts: { emptyNames?: boolean; streamFails?: boolean } = {},
) {
  return {
    execute: mock(async (ucName: string, attrs: Record<string, unknown>) => {
      switch (ucName) {
        case 'list-my-reviews':
          return { reviews };
        case 'get-users-by-ids':
          if (opts.emptyNames) return [];
          return [
            { uuid: AUTHOR_1, name: 'Анна' },
            { uuid: AUTHOR_2, name: 'Глеб' },
          ];
        case 'get-stream':
          if (opts.streamFails) throw new Error('Поток не найден');
          if (attrs.streamId === STREAM_2) {
            return { uuid: STREAM_2, title: 'JS Advanced — Поток 2' };
          }
          return { uuid: STREAM_1, title: 'JS Core — Поток 1' };
        default:
          throw new Error(`неизвестный UC: ${ucName}`);
      }
    }),
  };
}

function makeStory(
  reviews: Snapshot[],
  opts?: { emptyNames?: boolean; streamFails?: boolean },
) {
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
function manyReviews(n: number): Snapshot[] {
  return Array.from({ length: n }, (_, i) => ({
    reviewId: `11111111-0000-0000-0000-${String(i).padStart(12, '0')}`,
    scopeId: i % 2 === 0 ? STREAM_1 : STREAM_2,
    authorId: i % 2 === 0 ? AUTHOR_1 : AUTHOR_2,
    direction: 'student_student' as const,
    authorOutcome: 'completed_passed' as const,
    text: `Отзыв номер ${i + 1}`,
    createdAt: `2026-09-2${9 - (i % 10)}T10:00`,
  }));
}

describe('ReviewsForMeStory — формат карточки S08', () => {
  test('карточка: автор + роль + исход + поток + дата, текст ниже; вызов UC с userId актора', async () => {
    const reviews: Snapshot[] = [
      {
        reviewId: '11111111-0000-0000-0000-000000000001',
        scopeId: STREAM_1,
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

    // Ровно один отзыв — шапка без индикатора 1/1
    expect(text).toContain('📥 *Отзывы мне*');
    expect(text).not.toContain('· 1/1');
    expect(text).toContain('👤 От: Анна \\(студент · завершил и прошел\\)');
    expect(text).toContain('📚 Поток: JS Core — Поток 1');
    expect(text).toContain('📅 Дата: 21\\.09\\.2026');
    expect(text).toContain('💬 «Отличный товарищ по команде»');

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
        scopeId: STREAM_1,
        authorId: AUTHOR_2,
        direction: 'mentor_student',
        text: 'Глубоко разбирается в коде',
        createdAt: '2026-09-20T11:00',
      },
    ];
    const { story } = makeStory(reviews);

    const response = await story.handleCallback('view', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('👤 От: Глеб \\(ментор\\)');
    expect(text).toContain('💬 «Глубоко разбирается в коде»');
  });

  test('имена авторов — один batch-запрос с уникальными id', async () => {
    const reviews: Snapshot[] = [
      {
        reviewId: '11111111-0000-0000-0000-000000000005',
        scopeId: STREAM_1,
        authorId: AUTHOR_1,
        direction: 'student_student',
        text: 'текст один',
        createdAt: '2026-09-21T10:00',
      },
      {
        reviewId: '11111111-0000-0000-0000-000000000006',
        scopeId: STREAM_1,
        authorId: AUTHOR_1,
        direction: 'student_student',
        text: 'текст два',
        createdAt: '2026-09-20T10:00',
      },
      {
        reviewId: '11111111-0000-0000-0000-000000000007',
        scopeId: STREAM_1,
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
          scopeId: STREAM_1,
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

    expect(text).toContain('👤 От: неизвестно \\(студент · забросил\\)');
  });

  test('поток не найден — запасная «неизвестно»', async () => {
    const { story } = makeStory(
      [
        {
          reviewId: '11111111-0000-0000-0000-000000000009',
          scopeId: STREAM_1,
          authorId: AUTHOR_1,
          direction: 'student_student',
          authorOutcome: 'completed_passed',
          text: 'текст отзыва',
          createdAt: '2026-09-21T10:00',
        },
      ],
      { streamFails: true },
    );

    const response = await story.handleCallback('view', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('📚 Поток: неизвестно');
  });

  test('кнопки: «↩️ Мои отзывы» в хаб S02, главное меню последним рядом', async () => {
    const { story } = makeStory(manyReviews(1));

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
    const { story } = makeStory(manyReviews(1));

    const response = await story.handleCallback('wat', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text.toLowerCase()).toContain('неизвестн');
  });
});

describe('ReviewsForMeStory — карточная пагинация (◀️ Пред. / След. ▶️ и 1/N)', () => {
  test('один отзыв — без индикатора и без кнопок навигации', async () => {
    const { story } = makeStory(manyReviews(1));

    const response = await story.handleCallback('view', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).not.toContain('· 1/');
    expect(findBtn(response, 'След. ▶️')).toBeNull();
    expect(findBtn(response, '◀️ Пред.')).toBeNull();
  });

  test('два отзыва: карточки с 1/2 и 2/2, кнопки След. ▶️ и ◀️ Пред., новые наверху', async () => {
    const reviews: Snapshot[] = [
      {
        reviewId: '11111111-0000-0000-0000-000000000001',
        scopeId: STREAM_1,
        authorId: AUTHOR_1,
        direction: 'student_student',
        text: 'Свежий отзыв',
        createdAt: '2026-09-22T09:00',
      },
      {
        reviewId: '11111111-0000-0000-0000-000000000002',
        scopeId: STREAM_2,
        authorId: AUTHOR_2,
        direction: 'student_student',
        text: 'Старый отзыв',
        createdAt: '2026-09-18T09:00',
      },
    ];
    const { story } = makeStory(reviews);

    // Первая карточка
    const p1 = await story.handleCallback('view', actor, session);
    assertDialogResponseMarkdownSafe(p1);
    const t1 = String(p1.screen?.text ?? '');

    expect(t1).toContain('📥 *Отзывы мне* · 1/2');
    expect(t1).toContain('Свежий отзыв');
    expect(t1).not.toContain('Старый отзыв');
    expect(findBtn(p1, '◀️ Пред.')).toBeNull();
    const nextBtn = findBtn(p1, 'След. ▶️');
    expect(nextBtn).toBeDefined();

    // Переход на вторую карточку
    const p2 = await story.handleCallback(
      nextBtn!.code.split(':').slice(1).join(':'),
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(p2);
    const t2 = String(p2.screen?.text ?? '');

    expect(t2).toContain('📥 *Отзывы мне* · 2/2');
    expect(t2).toContain('Старый отзыв');
    expect(t2).not.toContain('Свежий отзыв');
    expect(findBtn(p2, 'След. ▶️')).toBeNull();
    expect(findBtn(p2, '◀️ Пред.')).toBeDefined();
  });

  test('листание не перечитывает домен: list-my-reviews один раз (кеш)', async () => {
    const { story, appApi } = makeStory(manyReviews(3));

    const p0 = await story.handleCallback('view', actor, session);
    const next = findBtn(p0, 'След. ▶️')!;
    await story.handleCallback(
      next.code.split(':').slice(1).join(':'),
      actor,
      session,
    );

    const reads = (
      appApi.execute.mock.calls as unknown as Array<[string]>
    ).filter(([uc]) => uc === 'list-my-reviews');
    expect(reads).toHaveLength(1);
  });

  test('запрос страницы за пределами — clamp к границам', async () => {
    const { story } = makeStory(manyReviews(3));

    const response = await story.handleCallback('view:99', actor, session);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('📥 *Отзывы мне* · 3/3');
    expect(findBtn(response, 'След. ▶️')).toBeNull();
    expect(findBtn(response, '◀️ Пред.')).toBeDefined();
  });
});
