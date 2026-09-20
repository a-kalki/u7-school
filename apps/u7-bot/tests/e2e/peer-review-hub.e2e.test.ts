import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { AppController } from '@u7-scl/bot/app/app-controller';
import type { StudentCompletedEvent } from '@u7-scl/stream/domain';
import { createTestApp, type TestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  pressedCode,
  stampedCode,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import { PeerReviewController } from '../../src/controllers/peer-review/controller';

/**
 * E2E «Хаб и меню» (Фаза 6, задача 3):
 *
 *   1) menuButtons «💬 Отзывы» скрыта без кампаний, видна при живых
 *      (асинхронная проверка onlyLives, приоритет 25);
 *   2) S02 — рендер по myRole: субъекту «одногруппники и ментор» +
 *      прогресс M/K, ментору «отзыв о {Имя}»; выбор кампании → S03;
 *   3) истёкшее окно (фикстура c4a44444, expiresAt в прошлом):
 *      клик по старому приглашению → S03 «Ещё 0 дн» → ввод →
 *      заглушка «возможность закрыта» (REVIEW_WINDOW_CLOSED).
 *
 * Живая кампания создаётся событием судьбы в рантайме (окно 7 дн от
 * «сейчас» — тесты не зависят от возраста фикстур); просроченная —
 * фикстура c4a44444 в другом потоке (не мешает идемпотентности ER).
 */

const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';
const STREAM_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'; // «JS Core — Поток 2»
const STREAM_TITLE = 'JS Core — Поток 2';
const SUBJECT_TG = 1007; // «Студент Advanced» — субъект новой кампании
const SUBJECT_USER_ID = '77777777-7777-4777-8777-777777777777';
const MENTOR_TG = 1004; // «Ментор» — ментор потока
const NO_CAMPAIGNS_TG = 1002; // «Кандидат» — кампаний нет
const DROPPED_TG = 1003; // «Студент» — субъект просроченной c4a44444
const EXPIRED_CAMPAIGN_ID = 'c4a44444-4444-4444-8444-444444444444';

/** Ждёт условия (poll) — ER обрабатывает событие асинхронно. */
async function waitUntil(
  probe: () => boolean | Promise<boolean>,
  timeoutMs = 3000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await probe()) return;
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe('E2E peer-review: хаб «Мои отзывы» и меню', () => {
  let app: TestApp;
  let transport: TestBotTransport;

  beforeAll(async () => {
    app = await createTestApp('pr-hub');
    transport = createTestBotTransport(app, [
      new AppController(SCHOOL_GROUP_URL),
      new PeerReviewController(),
    ]);
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('menuButtons: без кампаний кнопки «💬 Отзывы» нет', async () => {
    const candidate = (await app.userFacade.getUserByTelegramId(
      NO_CAMPAIGNS_TG,
    ))!;
    const menu = await transport.collectMainMenu(candidate);
    expect(menu.some((b) => b.text === '💬 Отзывы')).toBe(false);
  });

  test('живая кампания → кнопка меню видна (kind callback, приоритет 25)', async () => {
    app.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventName: 'student.completed',
      occurredAt: '2026-09-22T12:00',
      aggregateName: 'Student',
      aggregateId: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
      payload: {
        studentId: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
        userId: SUBJECT_USER_ID,
        streamId: STREAM_ID,
        moduleId: 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0',
        outcome: 'advanced',
      },
    } satisfies StudentCompletedEvent);

    await waitUntil(async () =>
      Boolean(
        await app.reviewCampaignRepo.findBySubject(STREAM_ID, SUBJECT_USER_ID),
      ),
    );

    const subject = (await app.userFacade.getUserByTelegramId(SUBJECT_TG))!;
    const menu = await transport.collectMainMenu(subject);
    const btn = menu.find((b) => b.text === '💬 Отзывы');
    expect(btn).toBeDefined();
    expect(btn!.kind).toBe('callback');
    expect(btn!.priority).toBe(25);
  });

  test('S02 субъекту: карточка с прогрессом M/K, выбор кампании → S03', async () => {
    // /start открывает экран с меню (кнопка «💬 Отзывы» в нём)
    await transport.handleStart(transport.makeBotContext(SUBJECT_TG));

    const hubResp = await transport.handleCallback(
      transport.makeBotContext(SUBJECT_TG, {
        callbackData: pressedCode(transport, SUBJECT_TG, '💬 Отзывы'),
      }),
    );
    const hubText = String(hubResp.screen?.text);
    expect(hubText).toContain('💬 *Мои отзывы*');
    // myRole=subject: «одногруппники и ментор», окно свежей кампании — 7 дн
    expect(hubText).toContain(
      `1\\. Поток «${STREAM_TITLE}» — одногруппники и ментор\\. Осталось 7 дн`,
    );
    const hubBtn = hubResp.screen?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('🏁 Поток'));
    // Прогресс M/K: 0 написанных из 3 адресатов (2 соучастника + ментор)
    expect(hubBtn?.text).toBe(`🏁 Поток «${STREAM_TITLE}» · 0/3 · 7 дн.`);

    // Выбор кампании — мост в S03
    const s03 = await transport.handleCallback(
      transport.makeBotContext(SUBJECT_TG, {
        callbackData: pressedCode(transport, SUBJECT_TG, '🏁 Поток'),
      }),
    );
    expect(String(s03.screen?.text)).toContain('О ком хотите рассказать?');
    expect(String(s03.screen?.text)).toContain(STREAM_TITLE);
  });

  test('S02 ментору: карточка «отзыв о {Имя}» по myRole=mentor', async () => {
    await transport.handleStart(transport.makeBotContext(MENTOR_TG));

    const hubResp = await transport.handleCallback(
      transport.makeBotContext(MENTOR_TG, {
        callbackData: pressedCode(transport, MENTOR_TG, '💬 Отзывы'),
      }),
    );
    const hubText = String(hubResp.screen?.text);
    expect(hubText).toContain('💬 *Мои отзывы*');
    // Карточка ментора в новой кампании — «отзыв о Студент Advanced»
    expect(hubText).toContain('отзыв о Студент Advanced');
    expect(
      hubResp.screen?.keyboard?.rows
        .flat()
        .some((b) => b.text.includes('отзыв о Студент Advanced')),
    ).toBe(true);
  });

  test('истёкшее окно: старое приглашение → «Кампания не найдена» (списочный путь)', async () => {
    // Клик по кнопке старого приглашения (сырой код + штамп текущего экрана):
    // истёкшая кампания не попадает в get-my-campaigns — заглушка списка
    await transport.handleStart(transport.makeBotContext(DROPPED_TG));
    const staleCode = stampedCode(
      transport,
      DROPPED_TG,
      `peer-review:campaign:list:${EXPIRED_CAMPAIGN_ID}`,
    );

    const s03 = await transport.handleCallback(
      transport.makeBotContext(DROPPED_TG, { callbackData: staleCode }),
    );
    expect(String(s03.screen?.text)).toContain('⚠️ Кампания не найдена');
    expect(s03.screen?.keyboard?.rows.flat()[0]?.text).toBe('↩️ Главное меню');
  });

  test('окно истекло во время ввода → экран-заглушка «возможность закрыта»', async () => {
    // Субъект живой кампании открыл S05 (ввод адресату-ментору)
    await transport.handleStart(transport.makeBotContext(SUBJECT_TG));
    await transport.handleCallback(
      transport.makeBotContext(SUBJECT_TG, {
        callbackData: pressedCode(transport, SUBJECT_TG, '💬 Отзывы'),
      }),
    );
    await transport.handleCallback(
      transport.makeBotContext(SUBJECT_TG, {
        callbackData: pressedCode(transport, SUBJECT_TG, '🏁 Поток'),
      }),
    );
    const s05 = await transport.handleCallback(
      transport.makeBotContext(SUBJECT_TG, {
        callbackData: pressedCode(transport, SUBJECT_TG, 'Ментор: Ментор'),
      }),
    );
    expect(s05.awaitInput).toBeDefined();

    // Окно истекает, пока пользователь пишет: двигаем expiresAt в файле
    // фикстуры (JsonFileRepo перечитывает файл при каждом readAll)
    const file = Bun.file(app.fixtures.peerReview.campaigns);
    const campaigns = (await file.json()) as Array<{
      uuid: string;
      scopeId: string;
      subjectId: string;
      expiresAt: string;
    }>;
    const target = campaigns.find(
      (c) => c.subjectId === SUBJECT_USER_ID && c.scopeId === STREAM_ID,
    )!;
    target.expiresAt = '2026-01-01T00:00';
    await Bun.write(
      app.fixtures.peerReview.campaigns,
      JSON.stringify(campaigns, null, 2),
    );

    // Ввод корректного текста — UC отклоняет запись: доменная ошибка окна
    const input = await transport.handleMessage(
      transport.makeBotContext(SUBJECT_TG, {
        text: 'Ментор давал понятную обратную связь и не давал застрять.',
      }),
    );
    expect(String(input.screen?.text)).toContain(
      '⌛ Возможность написать отзыв уже закрыта',
    );
    expect(input.screen?.keyboard?.rows.flat()[0]?.text).toBe('↩️ Главное меню');
  });
});
