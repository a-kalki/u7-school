import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { StudentCompletedEvent } from '@u7-scl/stream/domain';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  pressedCode,
  stampedCode,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import { PeerReviewController } from '../../src/controllers/peer-review/controller';

/**
 * E2E «Просмотр S07 из карточки потока» (Фаза 6, задача 4):
 *
 * Контур A (фикстуры): кнопка «💬 Отзывы» в карточке потока — скрыта без
 * отзывов (Алгоритмика e5e5e5e5), видна при наличии (JS Core 2 e1e1e1e1);
 * S07 — группировка по адресатам, роли из direction, лейбл authorOutcome
 * только у автора-студента; «⬅️ Назад к потоку» — мост в карточку.
 *
 * Контур B (свой стенд): пагинация ≥3 страниц — 4 отзыва по ~3400 симв.
 * создаются в рантайме (событие судьбы → create-review), страница = один
 * блок; полный цикл листания, edit на месте, DialogCache — тыки страниц
 * не перечитывают домен (счётчик list-scope-reviews через прокси apiApp).
 */

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
const GUEST_TG = 1001; // «Гость» — читатель карточки потока
const STREAM_WITH_REVIEWS = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'; // JS Core — Поток 2
const STREAM_NO_REVIEWS = 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5'; // Алгоритмика — Поток 1
const SUBJECT_TG = 1007; // «Студент Advanced» — субъект кампании контура B
const SUBJECT_USER_ID = '77777777-7777-4777-8777-777777777777';
const MENTOR_TG = 1004;
const MENTOR_USER_ID = '44444444-4444-4444-4444-444444444444';

/** Прокси над apiApp: считает execute по имени UC (для кеш-ассертов). */
function countingApi(app: TestApp): {
  api: typeof app.apiApp;
  count: (name: string) => number;
} {
  const counts = new Map<string, number>();
  const api = new Proxy(app.apiApp, {
    get(target, prop, receiver) {
      if (prop === 'execute') {
        return async (name: string, attrs: unknown, actor?: unknown) => {
          counts.set(name, (counts.get(name) ?? 0) + 1);
          return (
            target as unknown as {
              execute: (
                n: string,
                a: unknown,
                ac?: unknown,
              ) => Promise<unknown>;
            }
          ).execute(name, attrs, actor);
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  return { api, count: (name) => counts.get(name) ?? 0 };
}

/** Стенд: TestApp + транспорт (все контроллеры карточки и S07). */
async function makeStand(tag: string, withCounter = false) {
  const app = await createTestApp(tag);
  const counter = withCounter ? countingApi(app) : undefined;
  const transport = createTestBotTransport(
    counter ? { ...app, apiApp: counter.api } : app,
    [
      new AppController(SCHOOL_GROUP_URL),
      new StreamsController(),
      new PeerReviewController(),
    ],
  );
  return { app, transport, counter };
}

/** Карточка потока: /start + сырой код view-stream с актуальным штампом. */
async function openStreamCard(
  transport: TestBotTransport,
  tgId: number,
  streamId: string,
) {
  await transport.handleStart(transport.makeBotContext(tgId));
  return transport.handleCallback(
    transport.makeBotContext(tgId, {
      callbackData: stampedCode(
        transport,
        tgId,
        `stream:view-stream:view:${streamId}`,
      ),
    }),
  );
}

/** Экран в хронологии отображения (sent, затем его edits по порядку). */
interface ScreenRecord {
  messageId: number;
  text: string;
}

/** Хронология экранов пользователя (sent + относящиеся к ним edits). */
function screenHistory(
  transport: TestBotTransport,
  tgId: number,
): ScreenRecord[] {
  const history: ScreenRecord[] = [];
  for (const sent of transport.api.sentMessages.filter(
    (s) => s.telegramId === tgId,
  )) {
    history.push({ messageId: sent.messageId, text: sent.text });
    for (const edit of transport.api.editedMessages.filter(
      (e) => e.telegramId === tgId && e.messageId === sent.messageId,
    )) {
      history.push({ messageId: edit.messageId, text: edit.text });
    }
  }
  return history;
}

/** Текст последнего экрана пользователя (send или edit). */
function lastScreenText(transport: TestBotTransport, tgId: number): string {
  const history = screenHistory(transport, tgId);
  return history[history.length - 1]?.text ?? '';
}

/** Индикатор страницы `Стр. N/M` → {index, total} (1-based) или null. */
function pageOf(text: string): { index: number; total: number } | null {
  const m = /Стр\\\. (\d+)\/(\d+)/.exec(text);
  return m ? { index: Number(m[1]), total: Number(m[2]) } : null;
}

/** Длинный отзыв (~3300 симв.): маркер один раз + повторяющийся текст. */
function longReview(marker: string): string {
  const filler =
    'Подробный разбор работы за поток: темы, темп, обратная связь, ' +
    'командные привычки и личные наблюдения. ';
  return `${marker} ${filler.repeat(Math.ceil(3300 / filler.length)).slice(0, 3300)}`;
}

// ═══ Контур A: карточка потока и контент S07 (фикстуры) ═══

describe('E2E peer-review: S07 из карточки потока — контент', () => {
  let app: TestApp;
  let transport: TestBotTransport;

  beforeAll(async () => {
    ({ app, transport } = await makeStand('pr-view'));
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('карточка без отзывов — кнопки «💬 Отзывы» нет', async () => {
    const card = await openStreamCard(transport, GUEST_TG, STREAM_NO_REVIEWS);
    const btns = card.screen?.keyboard?.rows.flat() ?? [];
    expect(btns.some((b) => b.text === '👥 Студенты')).toBe(true);
    expect(btns.some((b) => b.text === '💬 Отзывы')).toBe(false);
  });

  test('карточка с отзывами — кнопка открывает S07: группы, роли, лейблы', async () => {
    transport.reset();
    const card = await openStreamCard(transport, GUEST_TG, STREAM_WITH_REVIEWS);
    expect(
      card.screen?.keyboard?.rows.flat().some((b) => b.text === '💬 Отзывы'),
    ).toBe(true);

    const s07 = await transport.handleCallback(
      transport.makeBotContext(GUEST_TG, {
        callbackData: pressedCode(transport, GUEST_TG, '💬 Отзывы'),
      }),
    );
    const text = String(s07.screen?.text);
    expect(text).toContain('💬 *Отзывы* — поток «JS Core — Поток 2»');
    // Три фикстурных блока умещаются на одной странице (без индикатора)
    expect(pageOf(text)).toBeNull();
    // Группа адресата-ментора: направление student_mentor — роли из
    // direction, лейбл authorOutcome у автора-студента
    expect(text).toContain('👤 Ментор');
    expect(text).toContain('«Ментор давал понятную обратную связь');
    expect(text).toContain('— Студент');
    expect(text).toContain('студент · завершил и прошел');
    // Группа адресата-студента: автор-ментор — БЕЗ лейбла исхода
    expect(text).toContain('👤 Студент');
    expect(text).toContain('«Студент дисциплинированно');
    expect(text).toContain('— Ментор');
    // student_student: обе роли «студент»
    expect(text).toContain('👤 Студент Advanced');
    expect(text).toContain('«Работать в паре');
    // Кнопка возврата в карточку потока
    expect(
      s07.screen?.keyboard?.rows
        .flat()
        .some((b) => b.text === '⬅️ Назад к потоку'),
    ).toBe(true);
  });

  test('«⬅️ Назад к потоку» — мост в карточку потока', async () => {
    const back = await transport.handleCallback(
      transport.makeBotContext(GUEST_TG, {
        callbackData: pressedCode(transport, GUEST_TG, '⬅️ Назад к потоку'),
      }),
    );
    const text = String(back.screen?.text);
    expect(text).toContain('JS Core — Поток 2');
    // Карточка потока (streams S02): ментор и кнопки карточки
    expect(text).toContain('Ментор');
    expect(
      back.screen?.keyboard?.rows.flat().some((b) => b.text === '👥 Студенты'),
    ).toBe(true);
  });
});

// ═══ Контур B: пагинация S07 (длинные отзывы в рантайме) ═══

describe('E2E peer-review: S07 — пагинация и DialogCache', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let counter: ReturnType<typeof countingApi> | undefined;

  beforeAll(async () => {
    const stand = await makeStand('pr-view-paged', true);
    app = stand.app;
    transport = stand.transport;
    counter = stand.counter;

    // Кампания судьбой + 4 длинных отзыва (страница = один блок)
    app.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventName: 'student.completed',
      occurredAt: '2026-09-22T12:00',
      aggregateName: 'Student',
      aggregateId: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
      payload: {
        studentId: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
        userId: SUBJECT_USER_ID,
        streamId: STREAM_WITH_REVIEWS,
        moduleId: 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0',
        outcome: 'advanced',
      },
    } satisfies StudentCompletedEvent);
    const deadline = Date.now() + 3000;
    while (
      !(await app.reviewCampaignRepo.findBySubject(
        STREAM_WITH_REVIEWS,
        SUBJECT_USER_ID,
      )) &&
      Date.now() < deadline
    ) {
      await new Promise((r) => setTimeout(r, 20));
    }

    const subject = (await app.userFacade.getUserByTelegramId(SUBJECT_TG))!;
    const mentor = (await app.userFacade.getUserByTelegramId(MENTOR_TG))!;
    const campaign = (await app.reviewCampaignRepo.findBySubject(
      STREAM_WITH_REVIEWS,
      SUBJECT_USER_ID,
    ))!;
    const reviews: Array<[string, string]> = [
      [MENTOR_USER_ID, longReview('D1: отзыв ментору за поток.')],
      [
        '33333333-3333-3333-3333-333333333333',
        longReview('D2: отзыв соучастнику о командной работе.'),
      ],
      [
        '88888888-8888-4888-8888-888888888888',
        longReview('D3: отзыв соучастнику о темпе.'),
      ],
      [SUBJECT_USER_ID, longReview('D4: отзыв ментора о студенте.')],
    ];
    for (const [recipientId, text] of reviews) {
      await app.apiApp.execute(
        'create-review',
        {
          campaignId: campaign.uuid,
          authorId:
            recipientId === SUBJECT_USER_ID ? mentor.uuid : subject.uuid,
          recipientId,
          text,
        },
        recipientId === SUBJECT_USER_ID ? mentor : subject,
      );
    }

    // Открываем S07: карточка потока → кнопка «💬 Отзывы»
    await openStreamCard(transport, GUEST_TG, STREAM_WITH_REVIEWS);
    await transport.handleCallback(
      transport.makeBotContext(GUEST_TG, {
        callbackData: pressedCode(transport, GUEST_TG, '💬 Отзывы'),
      }),
    );
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('≥3 страниц: полный цикл листания, edit на месте, домен не перечитывается', async () => {
    const first = pageOf(lastScreenText(transport, GUEST_TG));
    expect(first?.total).toBeGreaterThanOrEqual(3);
    expect(first?.index).toBe(1);

    // Открытие S07 = один build (чтение домена)
    expect(counter?.count('list-scope-reviews')).toBe(1);

    const s07MessageId = transport.api.sentMessages
      .filter((s) => s.telegramId === GUEST_TG)
      .at(-1)!.messageId;

    /** Тексты всех страниц по циклу «След ›» до конца, затем «‹ Пред» до 1-й. */
    const pageTexts: string[] = [];
    const editInPlaceSteps: number[] = [];
    const pressNav = async (label: string) => {
      await transport.handleCallback(
        transport.makeBotContext(GUEST_TG, {
          callbackData: pressedCode(transport, GUEST_TG, label),
        }),
      );
      pageTexts.push(lastScreenText(transport, GUEST_TG));
      const lastEdit = transport.api.editedMessages
        .filter((e) => e.telegramId === GUEST_TG)
        .at(-1)!;
      editInPlaceSteps.push(lastEdit.messageId);
    };

    // вперёд до конца
    for (let i = 1; i < first!.total; i++) {
      await pressNav('След ›');
    }
    const total = first!.total;
    // назад к первой
    for (let i = 1; i < total; i++) {
      await pressNav('‹ Пред');
    }

    // Порядок страниц: вперёд 2..total, назад total-1..1
    const indices = pageTexts.map((t) => pageOf(t)?.index);
    expect(indices).toEqual([
      ...Array.from({ length: total - 1 }, (_, i) => i + 2),
      ...Array.from({ length: total - 1 }, (_, i) => total - 1 - i),
    ]);

    // Каждый edit — на месте (тот же messageId исходного экрана S07)
    expect(new Set(editInPlaceSteps).size).toBe(1);
    expect(editInPlaceSteps[0]).toBe(s07MessageId);

    // Целые блоки без потерь: все 4 длинных отзыва — ровно по одному разу
    // (createdAt рантайм-отзывов совпадает до минуты — порядок страниц
    // недетерминирован, поэтому проверяем распределение, а не порядок)
    const allTexts = [
      lastScreenText(transport, GUEST_TG),
      ...pageTexts.slice(0, total - 1), // страницы вперёд (без обратного пути)
    ].join('\n');
    for (const marker of ['D1:', 'D2:', 'D3:', 'D4:']) {
      expect(allTexts.split(marker).length).toBe(2); // ровно одно вхождение
    }
    // Фикстурные короткие отзывы тоже целы (перенесены на дальние страницы)
    expect(allTexts).toContain('Ментор давал понятную');
    expect(allTexts).toContain('Студент дисциплинированно');
    expect(allTexts).toContain('Работать в паре');

    // DialogCache: все тыки — из кеша, list-scope-reviews не звался
    expect(counter?.count('list-scope-reviews')).toBe(1);
  });
});
