import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import {
  assertDialogResponseMarkdownSafe,
  type BotSession,
  type DialogResponse,
} from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { ScopeReviewsStory } from './scope-reviews.story';

/**
 * S07 — просмотр отзывов потока (только чтение, пагинация).
 *
 * Формат блока (ui-spec S07), группировка по адресатам — порядок DS:
 *   👤 {Имя} (роль адресата):
 *   «{текст}» — {автор} (роль автора · лейбл исхода)
 * Лейбл исхода — только у автора-студента (authorOutcome); автор-ментор
 * — без лейбла. Роли выводятся из direction.
 */

const SCOPE_ID = 'cccccccc-0000-0000-0000-000000000001';
const MENTOR_ID = 'dddddddd-0000-0000-0000-000000000001';
const STUDENT_1 = 'eeeeeeee-0000-0000-0000-000000000001';
const STUDENT_2 = 'eeeeeeee-0000-0000-0000-000000000002';
const AUTHOR_1 = 'ffffffff-0000-0000-0000-000000000001';
const AUTHOR_2 = 'ffffffff-0000-0000-0000-000000000002';

const session: BotSession = {
  dialog: { path: 'peer-review/scope-reviews', seq: 1 },
};
const actor: User = {
  uuid: 'user-reader',
  name: 'Читатель',
  telegramId: 123,
  roles: [Role.STUDENT],
  createdAt: '2026-01-01T00:00:00.000Z',
};

/** Снимок отзыва — как отдаёт list-scope-reviews (scope-reviews-ds). */
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

interface Group {
  recipientId: string;
  reviews: Snapshot[];
}

/** Длинный текст отзыва (n — номер, чтобы блоки различались). */
function longText(n: number, pad = 700): string {
  return `Отзыв номер ${n}. ${'а'.repeat(pad)}`;
}

/** appApi-мок: list-scope-reviews, get-stream, get-users-by-ids. */
function makeAppApi(groups: Group[], opts: { emptyNames?: boolean } = {}) {
  return {
    execute: mock(async (ucName: string, attrs: Record<string, unknown>) => {
      switch (ucName) {
        case 'list-scope-reviews':
          return { scopeId: attrs.scopeId, recipients: groups };
        case 'get-stream':
          return { uuid: attrs.streamId, title: 'Поток решения' };
        case 'get-users-by-ids':
          if (opts.emptyNames) return [];
          return [
            { uuid: MENTOR_ID, name: 'Марина' },
            { uuid: STUDENT_1, name: 'Борис' },
            { uuid: STUDENT_2, name: 'Вера' },
            { uuid: AUTHOR_1, name: 'Анна' },
            { uuid: AUTHOR_2, name: 'Глеб' },
          ];
        default:
          throw new Error(`неизвестный UC: ${ucName}`);
      }
    }),
  };
}

function makeStory(groups: Group[], opts?: { emptyNames?: boolean }) {
  const appApi = makeAppApi(groups, opts);
  const story = new ScopeReviewsStory();
  story.init({ appApi } as never);
  return { story, appApi };
}

function btnsOf(r: DialogResponse) {
  return (r.screen?.keyboard?.rows ?? []).flat();
}

function findBtn(r: DialogResponse, needle: string) {
  return btnsOf(r).find((b) => b.text.includes(needle)) ?? null;
}

/** Отзывы: n отзывов об адресате-студенте, авторы чередуются. */
function manyReviews(n: number, textPad = 700): Group[] {
  const reviews: Snapshot[] = Array.from({ length: n }, (_, i) => ({
    reviewId: `11111111-0000-0000-0000-${String(i).padStart(12, '0')}`,
    authorId: i % 2 === 0 ? AUTHOR_1 : AUTHOR_2,
    direction: 'student_student',
    authorOutcome: 'completed_passed',
    text: longText(i + 1, textPad),
    createdAt: `2026-09-2${i % 10}T10:00`,
  }));
  return [{ recipientId: STUDENT_1, reviews }];
}

describe('ScopeReviewsStory — формат экрана S07', () => {
  test('блок: адресат + роль, текст, автор + роль + лейбл исхода (authorOutcome)', async () => {
    const groups: Group[] = [
      {
        recipientId: STUDENT_1,
        reviews: [
          {
            reviewId: '11111111-0000-0000-0000-000000000001',
            authorId: AUTHOR_1,
            direction: 'student_student',
            authorOutcome: 'completed_passed',
            text: 'Отличный товарищ по команде',
            createdAt: '2026-09-21T10:00',
          },
        ],
      },
    ];
    const { story } = makeStory(groups);

    const response = await story.handleCallback(
      `view:${SCOPE_ID}`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('💬 *Отзывы* — поток «Поток решения»');
    expect(text).toContain('👤 Борис \\(студент\\):');
    expect(text).toContain(
      '«Отличный товарищ по команде» — Анна \\(студент · завершил и прошел\\)',
    );
  });

  test('направление student_mentor: адресат — ментор; исход автора — свой лейбл', async () => {
    const groups: Group[] = [
      {
        recipientId: MENTOR_ID,
        reviews: [
          {
            reviewId: '11111111-0000-0000-0000-000000000002',
            authorId: AUTHOR_1,
            direction: 'student_mentor',
            authorOutcome: 'never_started',
            text: 'Ментор был на связи',
            createdAt: '2026-09-21T11:00',
          },
        ],
      },
    ];
    const { story } = makeStory(groups);

    const response = await story.handleCallback(
      `view:${SCOPE_ID}`,
      actor,
      session,
    );
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('👤 Марина \\(ментор\\):');
    expect(text).toContain(
      '«Ментор был на связи» — Анна \\(студент · не начал\\)',
    );
  });

  test('автор-ментор (mentor_student) — без лейбла исхода', async () => {
    const groups: Group[] = [
      {
        recipientId: STUDENT_2,
        reviews: [
          {
            reviewId: '11111111-0000-0000-0000-000000000003',
            authorId: MENTOR_ID,
            direction: 'mentor_student',
            text: 'Вера глубоко разбирается в коде',
            createdAt: '2026-09-21T12:00',
          },
        ],
      },
    ];
    const { story } = makeStory(groups);

    const response = await story.handleCallback(
      `view:${SCOPE_ID}`,
      actor,
      session,
    );
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('👤 Вера \\(студент\\):');
    expect(text).toContain(
      '«Вера глубоко разбирается в коде» — Марина \\(ментор\\)',
    );
  });

  test('группировка по адресатам: отзывы одного адресата идут подряд', async () => {
    const groups: Group[] = [
      {
        recipientId: STUDENT_1,
        reviews: [
          {
            reviewId: '11111111-0000-0000-0000-000000000004',
            authorId: AUTHOR_1,
            direction: 'student_student',
            authorOutcome: 'dropped',
            text: 'Первый отзыв о Борисе',
            createdAt: '2026-09-21T10:00',
          },
          {
            reviewId: '11111111-0000-0000-0000-000000000005',
            authorId: AUTHOR_2,
            direction: 'student_student',
            authorOutcome: 'completed_not_passed',
            text: 'Второй отзыв о Борисе',
            createdAt: '2026-09-21T12:00',
          },
        ],
      },
      {
        recipientId: STUDENT_2,
        reviews: [
          {
            reviewId: '11111111-0000-0000-0000-000000000006',
            authorId: AUTHOR_1,
            direction: 'student_student',
            text: 'Отзыв о Вере',
            createdAt: '2026-09-21T13:00',
          },
        ],
      },
    ];
    const { story } = makeStory(groups);

    const response = await story.handleCallback(
      `view:${SCOPE_ID}`,
      actor,
      session,
    );
    const text = String(response.screen?.text ?? '');

    const boris1 = text.indexOf('Первый отзыв о Борисе');
    const boris2 = text.indexOf('Второй отзыв о Борисе');
    const vera = text.indexOf('Отзыв о Вере');
    expect(boris1).toBeGreaterThan(-1);
    expect(boris2).toBeGreaterThan(boris1);
    expect(vera).toBeGreaterThan(boris2);
  });

  test('имена: один batch-запрос get-users-by-ids с адресатами и авторами', async () => {
    const groups: Group[] = [
      {
        recipientId: STUDENT_1,
        reviews: [
          {
            reviewId: '11111111-0000-0000-0000-000000000004',
            authorId: AUTHOR_1,
            direction: 'student_student',
            text: 'текст один',
            createdAt: '2026-09-21T10:00',
          },
          {
            reviewId: '11111111-0000-0000-0000-000000000005',
            authorId: AUTHOR_1,
            direction: 'student_student',
            text: 'текст два',
            createdAt: '2026-09-21T11:00',
          },
        ],
      },
      {
        recipientId: MENTOR_ID,
        reviews: [
          {
            reviewId: '11111111-0000-0000-0000-000000000006',
            authorId: AUTHOR_2,
            direction: 'student_mentor',
            text: 'текст три',
            createdAt: '2026-09-21T12:00',
          },
        ],
      },
    ];
    const { story, appApi } = makeStory(groups);

    await story.handleCallback(`view:${SCOPE_ID}`, actor, session);

    const calls = (
      appApi.execute.mock.calls as unknown as Array<
        [string, Record<string, unknown>]
      >
    ).filter(([uc]) => uc === 'get-users-by-ids');
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[1]).toEqual({
      userIds: [STUDENT_1, AUTHOR_1, MENTOR_ID, AUTHOR_2],
    });
  });

  test('имя не найдено (batch пуст) — запасная подпись «неизвестно»', async () => {
    const groups: Group[] = [
      {
        recipientId: STUDENT_1,
        reviews: [
          {
            reviewId: '11111111-0000-0000-0000-000000000007',
            authorId: AUTHOR_1,
            direction: 'student_student',
            authorOutcome: 'completed_passed',
            text: 'текст отзыва',
            createdAt: '2026-09-21T10:00',
          },
        ],
      },
    ];
    const { story } = makeStory(groups, { emptyNames: true });

    const response = await story.handleCallback(
      `view:${SCOPE_ID}`,
      actor,
      session,
    );
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('👤 неизвестно \\(студент\\):');
    expect(text).toContain('— неизвестно \\(студент · завершил и прошел\\)');
  });

  test('кнопка «⬅️ Назад к потоку» — мост в карточку потока', async () => {
    const { story } = makeStory(manyReviews(1, 50));

    const response = await story.handleCallback(
      `view:${SCOPE_ID}`,
      actor,
      session,
    );

    const back = findBtn(response, 'Назад к потоку');
    expect(back?.code).toBe(`stream:view-stream:view:${SCOPE_ID}`);
  });

  test('пустой список (гонка: отзывы исчезли) — заглушка с возвратом', async () => {
    const { story } = makeStory([]);

    const response = await story.handleCallback(
      `view:${SCOPE_ID}`,
      actor,
      session,
    );
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Отзывов по потоку пока нет');
    const back = findBtn(response, 'Назад к потоку');
    expect(back?.code).toBe(`stream:view-stream:view:${SCOPE_ID}`);
  });
});

describe('ScopeReviewsStory — пагинация (BotPaginator + DialogCache)', () => {
  test('длинные отзывы: ≥3 страницы из целых отзывов, полный цикл листания', async () => {
    const groups = manyReviews(16, 700);
    const { story } = makeStory(groups);

    const pageTexts: string[] = [];
    let response = await story.handleCallback(
      `view:${SCOPE_ID}`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    pageTexts.push(String(response.screen?.text ?? ''));

    for (let i = 0; i < 12; i++) {
      const next = findBtn(response, 'След ›');
      if (!next) break;
      const seg = next.code.split(':').pop();
      response = await story.handleCallback(
        `view:${SCOPE_ID}:${seg}`,
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
      expect(pageTexts[i]).toContain('Отзывы');
      expect(pageTexts[i]).toContain(`Стр\\. ${i + 1}/${total}`);
    }

    // Все 16 отзывов на местах, без потерь и дублей
    for (let i = 1; i <= 16; i++) {
      expect(pageTexts.join('\n').split(`Отзыв номер ${i}\\.`).length).toBe(2);
    }
  });

  test('навигация одним рядом; коды кнопок содержат номер страницы', async () => {
    const { story } = makeStory(manyReviews(16, 700));

    const first = await story.handleCallback(
      `view:${SCOPE_ID}`,
      actor,
      session,
    );
    const navRow = (first.screen?.keyboard?.rows ?? []).find((row) =>
      row.some((b) => b.text.includes('Пред') || b.text.includes('След')),
    );
    expect(navRow).toHaveLength(1);
    expect(navRow?.[0]?.text).toBe('След ›');
    expect(navRow?.[0]?.code).toBe(`scope-reviews:view:${SCOPE_ID}:1`);

    const second = await story.handleCallback(
      `view:${SCOPE_ID}:1`,
      actor,
      session,
    );
    const navRow2 = (second.screen?.keyboard?.rows ?? []).find((row) =>
      row.some((b) => b.text.includes('Пред') || b.text.includes('След')),
    );
    expect(navRow2).toHaveLength(2);
    expect(navRow2?.[0]?.text).toBe('‹ Пред');
    expect(navRow2?.[0]?.code).toBe(`scope-reviews:view:${SCOPE_ID}:0`);
    expect(navRow2?.[1]?.text).toBe('След ›');
    expect(navRow2?.[1]?.code).toBe(`scope-reviews:view:${SCOPE_ID}:2`);
  });

  test('листание не перечитывает домен: list-scope-reviews один раз (кеш)', async () => {
    const { story, appApi } = makeStory(manyReviews(16, 700));

    let response = await story.handleCallback(
      `view:${SCOPE_ID}`,
      actor,
      session,
    );
    for (let i = 0; i < 3; i++) {
      const next = findBtn(response, 'След ›');
      if (!next) break;
      response = await story.handleCallback(
        `view:${SCOPE_ID}:${next.code.split(':').pop()}`,
        actor,
        session,
      );
    }

    const reads = (
      appApi.execute.mock.calls as unknown as Array<[string]>
    ).filter(([uc]) => uc === 'list-scope-reviews');
    expect(reads).toHaveLength(1);
  });

  test('одна страница коротких отзывов — без индикатора и навигации', async () => {
    const { story } = makeStory(manyReviews(2, 50));

    const response = await story.handleCallback(
      `view:${SCOPE_ID}`,
      actor,
      session,
    );
    const text = String(response.screen?.text ?? '');

    expect(text).not.toContain('Стр\\.');
    expect(findBtn(response, 'След ›')).toBeNull();
    expect(findBtn(response, '‹ Пред')).toBeNull();
  });

  test('запрос страницы за пределами — clamp к последней', async () => {
    const { story } = makeStory(manyReviews(8, 700));

    const response = await story.handleCallback(
      `view:${SCOPE_ID}:99`,
      actor,
      session,
    );
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Стр\\. 2/2');
    expect(findBtn(response, 'След ›')).toBeNull();
  });
});
